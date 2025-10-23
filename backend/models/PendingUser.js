const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed password
    phone: { type: String },
    address1: { type: String },
    address2: { type: String },
    otp: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingUser', PendingUserSchema);
