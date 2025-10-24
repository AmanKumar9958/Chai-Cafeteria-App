const Order = require('../models/Order');

// GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (err) {
    console.error('getOrders', err);
    res.status(500).send('Server error');
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
    res.status(500).send('Server error');
  }
};

// (Optional) POST /api/orders  — not used by admin now, but handy for tests
exports.createOrder = async (req, res) => {
  try {
    const { items, total, status, customerName, phone, address1, address2, notes, user } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ msg: 'items are required' });
    if (typeof total !== 'number') return res.status(400).json({ msg: 'total must be a number' });
    const order = new Order({ items, total, status, customerName, phone, address1, address2, notes, user });
    await order.save();
    res.status(201).json({ order });
  } catch (err) {
    console.error('createOrder', err);
    res.status(500).send('Server error');
  }
};
