const router = require('express').Router();
const ctrl = require('../controllers/couponController');

// Admin: create and manage coupons
router.post('/', ctrl.createCoupon);
router.get('/', ctrl.listCoupons);
router.put('/:id/active', ctrl.toggleActive);

// Public: validate coupon
router.post('/validate', ctrl.validateCoupon);

module.exports = router;
