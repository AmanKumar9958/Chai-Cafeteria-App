import React, { useEffect, useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast'; // Import toast

export default function AddPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');

  const [itemCat, setItemCat] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState('');

  useEffect(() => { loadCats() }, []);

  async function loadCats() {
    try {
      const res = await API.get('/menu/categories');
      setCategories(res.data.categories || []);
      if (res.data.categories?.[0]) {
        setItemCat(res.data.categories[0]._id);
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not load categories');
    }
  }

  async function addCategory(e) {
    e.preventDefault();
    const promise = API.post('/menu/categories', { name, image });
    toast.promise(promise, {
      loading: 'Adding category...',
      success: () => {
        setName('');
        setImage('');
        loadCats(); // Refresh category list
        return 'Category added!';
      },
      error: (err) => err.response?.data?.msg || 'Failed to add category',
    });
  }

  async function addItem(e) {
    e.preventDefault();
    const promise = API.post('/menu/items', { 
      name: itemName, 
      price: parseFloat(itemPrice) || 0, 
      image: itemImage, 
      category: itemCat 
    });
    
    toast.promise(promise, {
      loading: 'Adding item...',
      success: () => {
        setItemName('');
        setItemPrice('');
        setItemImage('');
        return 'Item added!';
      },
      error: (err) => err.response?.data?.msg || 'Failed to add item',
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className='text-red-500'>1. Upload image on admin.chaicafeteria.com/images folder</h1>
        <h1 className='text-red-500'>2. Copy the image URL and paste it below</h1>
        <h3 className='text-red-500'>Sample http://admin.chaicafeteria.com/images/menu_pizza.webp (change the format as needed)</h3>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Category</h2>
        <form onSubmit={addCategory} className="space-y-4">
          <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Category Name (e.g., Pizza)" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Image URL (optional)" value={image} onChange={e => setImage(e.target.value)} />
          <button className="w-full px-4 py-3 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors">Add Category</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Menu Item</h2>
        <form onSubmit={addItem} className="space-y-4">
          <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none bg-white" value={itemCat} onChange={e => setItemCat(e.target.value)}>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Item Name (e.g., Margherita)" value={itemName} onChange={e => setItemName(e.target.value)} required />
          <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Price" type="number" step="0.01" value={itemPrice} onChange={e => setItemPrice(e.target.value)} required />
          <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Image URL" value={itemImage} onChange={e => setItemImage(e.target.value)} />
          <button className="w-full px-4 py-3 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors">Add Item</button>
        </form>
      </div>
    </div>
  );
}
