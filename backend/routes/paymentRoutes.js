const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');

// POST /api/payments/razorpay/create-order
router.post('/razorpay/create-order', createRazorpayOrder);

// POST /api/payments/razorpay/verify
router.post('/razorpay/verify', verifyRazorpayPayment);

module.exports = router;
