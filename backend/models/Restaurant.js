// Example schema for a location field with 2dsphere index
const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // ...other fields...
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
});

// Create 2dsphere index for geospatial queries
RestaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
