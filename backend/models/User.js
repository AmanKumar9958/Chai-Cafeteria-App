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
        pushToken: { type: String, default: null },
        // GeoJSON location: { type: 'Point', coordinates: [longitude, latitude] }
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
    },
    { timestamps: true }
);

// 2dsphere index for geospatial queries
UserSchema.index({ location: '2dsphere' });

// Static method to find users within 10km of a point
UserSchema.statics.findUsersNearby = function(restaurantLat, restaurantLong) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [restaurantLong, restaurantLat],
                },
                $maxDistance: 10000, // 10km in meters
            },
        },
    });
};

module.exports = mongoose.model('User', UserSchema);