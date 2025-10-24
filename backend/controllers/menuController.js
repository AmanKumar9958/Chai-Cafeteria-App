const Category = require('../models/Category');
const Item = require('../models/Item');

function slugify(name = '') {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

exports.getCategories = async (req, res) => {
  try {
    const withItems = req.query.withItems === '1' || req.query.withItems === 'true';
    const cats = await Category.find().sort({ name: 1 });

    if (withItems) {
      const catIds = cats.map(c => c._id);
      const items = await Item.find({ category: { $in: catIds }, active: true }).lean();
      const itemsByCat = items.reduce((acc, it) => {
        const k = String(it.category);
        (acc[k] = acc[k] || []).push(it);
        return acc;
      }, {});
      const enriched = cats.map(c => ({ ...c.toObject(), items: itemsByCat[String(c._id)] || [] }));
      return res.json({ categories: enriched });
    }

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

// admin: create category
exports.createCategory = async (req, res) => {
  try {
    const { name, image } = req.body || {};
    if (!name) return res.status(400).json({ msg: 'Name is required' });
    const cat = new Category({ name, image, slug: slugify(name) });
    await cat.save();
    res.status(201).json({ category: cat });
  } catch (err) {
    console.error('createCategory', err);
    if (err.code === 11000) return res.status(400).json({ msg: 'Category already exists' });
    res.status(500).send('Server error');
  }
};

// admin: delete category (and its items)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ msg: 'Category not found' });
    await Item.deleteMany({ category: id });
    res.json({ msg: 'Category deleted' });
  } catch (err) {
    console.error('deleteCategory', err);
    res.status(500).send('Server error');
  }
};

// admin: create item
exports.createItem = async (req, res) => {
  try {
    const { name, price, category, image, description } = req.body || {};
    if (!name || typeof price === 'undefined' || !category) {
      return res.status(400).json({ msg: 'name, price and category are required' });
    }
    const item = new Item({ name, price, category, image, description });
    await item.save();
    res.status(201).json({ item });
  } catch (err) {
    console.error('createItem', err);
    res.status(500).send('Server error');
  }
};

// admin: delete item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    console.error('deleteItem', err);
    res.status(500).send('Server error');
  }
};
