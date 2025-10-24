const express = require('express');
const router = express.Router();
const { getOrders, updateOrderStatus, createOrder } = require('../controllers/orderController');

router.get('/', getOrders);
router.put('/:id', updateOrderStatus);
// Optional create for testing
router.post('/', createOrder);

module.exports = router;
