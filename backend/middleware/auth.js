const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  // Expect token in Authorization header as: Bearer <token>
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ msg: 'No token, authorization denied' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ msg: 'Invalid token format' });

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    // Optionally attach the full user document
    const userDoc = await User.findById(req.user.id).select('-password -__v');
    if (!userDoc) return res.status(401).json({ msg: 'User not found' });
    req.userDoc = userDoc;
    next();
  } catch (err) {
    console.error('Auth middleware error', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
