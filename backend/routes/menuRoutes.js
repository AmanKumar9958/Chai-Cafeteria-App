const express = require('express');
const router = express.Router();
const {
	getCategories,
	getItems,
	search,
	createCategory,
	deleteCategory,
	createItem,
	deleteItem,
} = require('../controllers/menuController');

router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/search', search);

// admin write routes
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/items', createItem);
router.delete('/items/:id', deleteItem);

module.exports = router;
