const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Item', ItemSchema);
