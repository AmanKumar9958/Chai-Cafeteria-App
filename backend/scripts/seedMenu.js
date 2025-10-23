require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Item = require('../models/Item');

const MONGO = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO);
  console.log('Connected');

  await Category.deleteMany({});
  await Item.deleteMany({});

  const categories = [
    { name: 'Burgers', slug: 'burgers' },
    { name: 'Pizza', slug: 'pizza' },
    { name: 'Rolls', slug: 'rolls' },
    { name: 'Noodles', slug: 'noodles' },
    { name: 'Biryani', slug: 'biryani' },
    { name: 'Chowmein', slug: 'chowmein' },
    { name: 'Fries', slug: 'fries' },
    { name: 'Thali', slug: 'thali' },
    { name: 'Sandwich', slug: 'sandwich' },
    { name: 'Chilli', slug: 'chilli' },
    { name: 'Muffins', slug: 'muffins' },
    { name: 'Cookies', slug: 'cookies' },
  ];

  const savedCats = await Category.insertMany(categories);

  const catByName = savedCats.reduce((acc, c) => ((acc[c.name] = c), acc), {});

  const items = [
    { name: 'Veg Burger', price: 99, category: catByName['Burgers']._id },
    { name: 'Chicken Burger', price: 129, category: catByName['Burgers']._id },
    { name: 'Margherita Pizza', price: 249, category: catByName['Pizza']._id },
    { name: 'Pepperoni Pizza', price: 299, category: catByName['Pizza']._id },
    { name: 'Egg Roll', price: 89, category: catByName['Rolls']._id },
    { name: 'Veg Noodles', price: 119, category: catByName['Noodles']._id },
    { name: 'Chicken Biryani', price: 199, category: catByName['Biryani']._id },
    { name: 'Veg Chowmein', price: 129, category: catByName['Chowmein']._id },
    { name: 'French Fries', price: 79, category: catByName['Fries']._id },
    { name: 'Veg Thali', price: 199, category: catByName['Thali']._id },
    { name: 'Non-Veg Thali', price: 249, category: catByName['Thali']._id },
    { name: 'Chicken Sandwich', price: 149, category: catByName['Sandwich']._id },
    { name: 'Chicken Cheese Sandwich', price: 149, category: catByName['Sandwich']._id },
    { name: 'Mushroom Sandwich', price: 129, category: catByName['Sandwich']._id },
    { name: 'Chilli Chicken', price: 179, category: catByName['Chilli']._id },
    { name: 'Veg Chilli', price: 149, category: catByName['Chilli']._id },
    { name: 'Blueberry Muffin', price: 59, category: catByName['Muffins']._id },
    { name: 'Chocolate Chip Cookie', price: 39, category: catByName['Cookies']._id },
    
  ];

  await Item.insertMany(items);

  console.log('Seeded');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
