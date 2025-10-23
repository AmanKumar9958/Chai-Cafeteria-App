const express = require('express');
const router = express.Router();
const { getCategories, getItems, search } = require('../controllers/menuController');

router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/search', search);

module.exports = router;
