const Coupon = require('../models/Coupon');

const isActiveAndInWindow = (coupon) => {
  if (!coupon.active) return false;
  const now = new Date();
  if (coupon.startDate && now < coupon.startDate) return false;
  if (coupon.endDate && now > coupon.endDate) return false;
  return true;
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value = 0, minSubtotal = 0, maxDiscount = 100000, active = true, startDate, endDate } = req.body || {};
    if (!code || !type) return res.status(400).json({ msg: 'code and type are required' });
    const coupon = new Coupon({ code, type, value, minSubtotal, maxDiscount, active, startDate, endDate });
    await coupon.save();
    res.status(201).json({ coupon });
  } catch (err) {
    console.error('createCoupon', err);
    if (err.code === 11000) return res.status(409).json({ msg: 'Coupon code already exists' });
    res.status(500).send('Server error');
  }
};

exports.listCoupons = async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ coupons });
  } catch (err) {
    console.error('listCoupons', err);
    res.status(500).send('Server error');
  }
};

exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body || {};
    if (typeof active !== 'boolean') return res.status(400).json({ msg: 'active must be boolean' });
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: { active } }, { new: true }).lean();
    if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
    res.json({ coupon });
  } catch (err) {
    console.error('toggleActive', err);
    res.status(500).send('Server error');
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal = 0, orderType = 'Pickup' } = req.body || {};
    if (!code) return res.status(400).json({ msg: 'code is required' });
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();
    if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
    if (!isActiveAndInWindow(coupon)) return res.status(400).json({ msg: 'Coupon is not active' });

    const sub = Number(subtotal) || 0;
    let discount = 0;
    let freeDelivery = false;

    if (coupon.type === 'percent') {
      const raw = (sub * (Number(coupon.value) || 0)) / 100;
      discount = Math.min(raw, Number(coupon.maxDiscount) || 0);
    } else if (coupon.type === 'flat') {
      if (sub >= (Number(coupon.minSubtotal) || 0)) {
        discount = Number(coupon.value) || 0;
      }
    } else if (coupon.type === 'freeship') {
      freeDelivery = orderType === 'Delivery';
    }

    return res.json({ valid: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount, freeDelivery });
  } catch (err) {
    console.error('validateCoupon', err);
    res.status(500).send('Server error');
  }
};
