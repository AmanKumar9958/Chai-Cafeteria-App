// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;