// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, me, updateMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/me', auth, updateMe);

module.exports = router;