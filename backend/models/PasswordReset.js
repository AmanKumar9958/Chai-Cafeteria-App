const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, unique: true },
    otp: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
