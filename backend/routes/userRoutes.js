const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/user/save-push-token
// @desc    Save or update the user's Expo push token
// @access  Private
router.post('/save-push-token', auth, async (req, res) => {
  const { pushToken } = req.body;

  if (!pushToken) {
    return res.status(400).json({ msg: 'Push token is required' });
  }

  try {
    // req.user.id comes from the auth middleware
    await User.findByIdAndUpdate(req.user.id, { pushToken });
    res.json({ msg: 'Push token updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
