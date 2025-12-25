const express = require('express');
const router = express.Router();
const { getOrders, updateOrderStatus, createOrder, validateLocation } = require('../controllers/orderController');
// Location validation endpoint (no auth required)
router.post('/validate-location', validateLocation);
const auth = require('../middleware/auth');

// All order routes require an authenticated user
router.get('/', auth, getOrders);
router.put('/:id', auth, updateOrderStatus);
router.post('/', auth, createOrder);

module.exports = router;
