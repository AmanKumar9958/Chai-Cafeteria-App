const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String },
    active: { type: Boolean, default: true },
    hasPortions: { type: Boolean, default: false },
    variantType: { type: String, enum: ['none', 'portion', 'pieces'], default: 'none' },
    portions: [
      {
        name: { type: String }, // e.g., "Half", "Full", "6 pcs"
        price: { type: Number }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', ItemSchema);
