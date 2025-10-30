const express = require('express');
const router = express.Router();
const { getOrders, updateOrderStatus, createOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');

// All order routes require an authenticated user
router.get('/', auth, getOrders);
router.put('/:id', auth, updateOrderStatus);
router.post('/', auth, createOrder);

module.exports = router;
