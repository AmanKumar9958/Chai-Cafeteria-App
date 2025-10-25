// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB Connected...'))
  .catch(err => console.log(err));

// Simple test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
// Menu routes
app.use('/api/menu', require('./routes/menuRoutes'));
// Orders routes
app.use('/api/orders', require('./routes/orderRoutes'));
// Coupons routes
app.use('/api/coupons', require('./routes/couponRoutes'));

// We will add our auth and menu routes here later

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));