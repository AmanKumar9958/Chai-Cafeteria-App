const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { Types } = require('mongoose');

// GET /api/orders (scoped to the authenticated user)
exports.getOrders = async (req, res) => {
  try {
    const userId = req?.user?.id || req?.user?._id || req?.userDoc?._id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    console.error('getOrders', err);
    res.status(500).json({ message: err?.message || 'Server error' });
  }
};

// PUT /api/orders/:id
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ msg: 'status is required' });
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    res.json({ order, msg: 'Order updated' });
  } catch (err) {
    console.error('updateOrderStatus', err);
    res.status(500).json({ message: err?.message || 'Server error' });
  }
};

// POST /api/orders — frontend checkout (associate to authenticated user)
exports.createOrder = async (req, res) => {
  try {
    const userId = req?.user?.id || req?.user?._id || req?.userDoc?._id;
    if (!userId) return res.status(401).json({ msg: 'Unauthorized' });
    const body = req.body || {};
    const items = Array.isArray(body.items)
      ? body.items.map(it => {
          const safe = {
            name: it.name,
            price: Number(it.price),
            qty: Number(it.qty || 1),
            image: it.image,
          };
          // Only set the optional reference if it's a valid ObjectId string
          const ref = it.itemId || it.item || null;
          if (ref && typeof ref === 'string' && Types.ObjectId.isValid(ref)) {
            safe.item = ref;
          }
          // category can be ObjectId or string; set only if valid ObjectId
          if (it.category && typeof it.category === 'string' && Types.ObjectId.isValid(it.category)) {
            safe.category = it.category;
          }
          return safe;
        })
      : [];
    if (!items.length) return res.status(400).json({ msg: 'items are required' });

    const orderType = body.type || body.orderType || 'Pickup';
    const paymentMethod = body.paymentMethod || 'COD';
    const customerName = body.customer?.name || body.customerName || '';
    const phone = body.customer?.phone || body.phone || '';
    const address1 = body.address?.address1 || body.address1 || '';
    const address2 = body.address?.address2 || body.address2 || '';
    const landmark = body.address?.landmark || body.landmark || '';
    const pincode = body.address?.pincode || body.pincode || '';
    const notes = body.note || body.notes || '';
    const couponCode = body.couponCode ? String(body.couponCode).toUpperCase() : null;

    const subtotal = items.reduce((s, it) => s + (Number(it.price) * Number(it.qty)), 0);
    let deliveryFee = 0; // Delivery fee removed
    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode }).lean();
      if (coupon && coupon.active) {
        const now = new Date();
        const inWindow = (!coupon.startDate || now >= coupon.startDate) && (!coupon.endDate || now <= coupon.endDate);
        if (inWindow) {
          if (coupon.type === 'percent') {
            const raw = (subtotal * (Number(coupon.value) || 0)) / 100;
            discount = Math.min(raw, Number(coupon.maxDiscount) || 0);
          } else if (coupon.type === 'flat') {
            if (subtotal >= (Number(coupon.minSubtotal) || 0)) {
              discount = Number(coupon.value) || 0;
            }
          } // 'freeship' type is now ignored since deliveryFee is always 0
        }
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);

    const order = new Order({
      items,
      total,
      subtotal,
      deliveryFee,
      discount,
      couponCode,
      orderType,
      paymentMethod,
      status: body.status || undefined,
      customerName,
      phone,
      address1,
      address2,
      landmark,
      pincode,
      notes,
      user: userId,
    });
    await order.save();
    res.status(201).json({ order });
  } catch (err) {
    console.error('createOrder', err);
    res.status(500).json({ message: err?.message || 'Server error' });
  }
};