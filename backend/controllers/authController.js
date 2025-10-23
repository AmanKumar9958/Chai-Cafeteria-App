// backend/controllers/authController.js
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../services/emailService');

// Register a new user
exports.register = async (req, res) => {
    const { name, email, password, phone, address1, address2 } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Name, email and password are required' });
        }

        // If a final user already exists, block registration
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists. Please login.' });
        }

        // Generate OTP (6-digit)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash password before saving in pending store
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upsert a pending user record (create new or update existing pending)
        let pending = await PendingUser.findOne({ email });
        if (pending) {
            pending.name = name;
            pending.password = hashedPassword;
            pending.phone = phone;
            pending.address1 = address1;
            pending.address2 = address2;
            pending.otp = otp;
            pending.otpExpiresAt = otpExpiresAt;
            await pending.save();
        } else {
            pending = new PendingUser({ name, email, password: hashedPassword, phone, address1, address2, otp, otpExpiresAt });
            await pending.save();
        }

        // Send OTP via email
        await sendOtpEmail(email, otp);

        res.status(201).json({ msg: 'Registration initiated. Please check your email for OTP.', email });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const pending = await PendingUser.findOne({ email });
        if (!pending) {
            return res.status(400).json({ msg: 'No pending registration found for this email' });
        }

        if (!pending.otp || pending.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        if (pending.otpExpiresAt && pending.otpExpiresAt < new Date()) {
            return res.status(400).json({ msg: 'OTP has expired' });
        }

        // Before creating final user, ensure a final user doesn't already exist
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Clean up pending record
            await PendingUser.deleteOne({ _id: pending._id });
            return res.status(400).json({ msg: 'User already exists. Please login.' });
        }

        // Create final user using hashed password from pending record
    const newUser = new User({ name: pending.name, email: pending.email, password: pending.password, phone: pending.phone, address1: pending.address1, address2: pending.address2, isVerified: true });
        await newUser.save();

        // Remove pending record
        await PendingUser.deleteOne({ _id: pending._id });

        // Generate auth token for convenience
        const payload = { user: { id: newUser.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ msg: 'Email verified successfully', token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        if (!user.isVerified) {
            return res.status(400).json({ msg: 'Please verify your email first' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get current user profile
exports.me = async (req, res) => {
    try {
        // auth middleware attaches userDoc
        const user = req.userDoc || (await User.findById(req.user.id).select('-password -__v'));
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json({ user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};