// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String },
        address1: { type: String },
        address2: { type: String },
        otp: { type: String },
        isVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);