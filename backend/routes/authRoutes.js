// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, me, updateMe, forgotPassword, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/me', auth, updateMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;