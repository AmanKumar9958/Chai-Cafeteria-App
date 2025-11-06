const express = require('express');
const router = express.Router();
const adminJwt = require('../middleware/adminJwt');
const Order = require('../models/Order');

// GET /api/admin/orders - returns all orders for admin dashboard
router.get('/orders', adminJwt, async (req, res) => {
  try {
    // Populate minimal user info for context
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
    res.json(orders);
  } catch (err) {
    console.error('Admin GET /orders error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/orders/:id - update order status
router.put('/orders/:id', adminJwt, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Admin PUT /orders/:id error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
