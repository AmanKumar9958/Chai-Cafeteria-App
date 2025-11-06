const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/admin/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res.status(500).json({ message: 'Admin credentials not configured on server' });
  }
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const payload = { username, role: 'admin' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token });
});

module.exports = router;
