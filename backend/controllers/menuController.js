const Category = require('../models/Category');
const Item = require('../models/Item');

exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json({ categories: cats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.getItems = async (req, res) => {
  try {
    const { category } = req.query; // category id or 'all'
    const filter = { active: true };
    if (category && category !== 'all') {
      filter.category = category;
    }
    const items = await Item.find(filter).populate('category');
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// search across categories and items by name
exports.search = async (req, res) => {
  try {
    const q = req.query.q || '';
    const items = await Item.find({ name: new RegExp(q, 'i'), active: true }).populate('category');
    const categories = await Category.find({ name: new RegExp(q, 'i') });
    res.json({ items, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
