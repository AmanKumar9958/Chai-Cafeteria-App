const jwt = require('jsonwebtoken');

// Performance: Only verify the JWT here. Do NOT fetch the user document
// from MongoDB on every request. Routes that need the full user doc
// (e.g. /me, /profile) should fetch it themselves.
module.exports = function (req, res, next) {
  // Expect token in Authorization header as: Bearer <token>
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ msg: 'No token, authorization denied' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return res.status(401).json({ msg: 'Invalid token format' });

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Auth middleware error', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
