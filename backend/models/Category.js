const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

// ── Performance Indexes ──
// Text index on name for faster category search
CategorySchema.index({ name: 'text' });

module.exports = mongoose.model('Category', CategorySchema);
