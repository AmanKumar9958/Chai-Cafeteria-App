const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'flat', 'freeship'], required: true },
    value: { type: Number, default: 0 }, // percent or flat amount; ignored for freeship
    minSubtotal: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 100000 }, // cap for percent discount
    active: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', CouponSchema);
