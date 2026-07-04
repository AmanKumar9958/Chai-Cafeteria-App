const express = require('express');
const router = express.Router();
const adminJwt = require('../middleware/adminJwt');
const Order = require('../models/Order');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

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

// POST /api/admin/orders/:id/notify - send notification to order's user
router.post('/orders/:id/notify', adminJwt, async (req, res) => {
  try {
    const { title, body } = req.body;
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (!order.user || !order.user.pushToken) {
      return res.status(400).json({ message: 'Customer does not have a push token enabled.' });
    }

    if (!Expo.isExpoPushToken(order.user.pushToken)) {
      return res.status(400).json({ message: 'Invalid push token found for customer.' });
    }

    const messages = [{
      to: order.user.pushToken,
      sound: 'default',
      title,
      body,
      data: { orderId: order._id }
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    console.error('Admin POST /orders/:id/notify error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
