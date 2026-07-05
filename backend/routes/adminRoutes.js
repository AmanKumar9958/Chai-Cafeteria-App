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

// PUT /api/admin/orders/:id/close - mark order as closed
router.put('/orders/:id/close', adminJwt, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { isClosed: true }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('Admin PUT /orders/:id/close error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/dashboard - return dashboard stats
router.get('/dashboard', adminJwt, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalOrdersCount = await Order.countDocuments();
    
    // Total sell price
    const totalSellResult = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalSales: { $sum: "$total" } } }
    ]);
    const totalSellPrice = totalSellResult.length > 0 ? totalSellResult[0].totalSales : 0;

    // Today's orders count
    const todayOrdersCount = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

    // Today's completed (closed) orders
    const todayCompletedCount = await Order.countDocuments({ createdAt: { $gte: startOfToday }, isClosed: true });

    // Today's pending orders
    const todayPendingCount = await Order.countDocuments({ createdAt: { $gte: startOfToday }, isClosed: false });

    // Today's sell price
    const todaySellResult = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, todaySales: { $sum: "$total" } } }
    ]);
    const todaySellPrice = todaySellResult.length > 0 ? todaySellResult[0].todaySales : 0;

    // This month's orders count
    const thisMonthOrdersCount = await Order.countDocuments({ createdAt: { $gte: startOfThisMonth } });

    // This month's sell price
    const thisMonthSellResult = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfThisMonth }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, monthSales: { $sum: "$total" } } }
    ]);
    const thisMonthSellPrice = thisMonthSellResult.length > 0 ? thisMonthSellResult[0].monthSales : 0;

    // Monthly report (group by YYYY-MM)
    const monthlyReport = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$total" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      totalOrders: totalOrdersCount,
      totalSellPrice,
      todayOrders: todayOrdersCount,
      todayCompleted: todayCompletedCount,
      todayPending: todayPendingCount,
      todaySellPrice,
      thisMonthOrders: thisMonthOrdersCount,
      thisMonthSellPrice: thisMonthSellPrice,
      monthlyReport: monthlyReport.map(item => ({
        month: item._id,
        orders: item.totalOrders,
        sales: item.totalSales
      }))
    });
  } catch (err) {
    console.error('Admin GET /dashboard error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
