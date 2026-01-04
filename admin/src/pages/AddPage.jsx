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
  const [variantType, setVariantType] = useState('none'); // none, portion, pieces
  const [halfPrice, setHalfPrice] = useState('');
  const [fullPrice, setFullPrice] = useState('');
  const [piecesVariants, setPiecesVariants] = useState([{ name: '', price: '' }, { name: '', price: '' }]);

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
    const payload = { 
      name: itemName, 
      price: parseFloat(itemPrice) || 0, 
      image: itemImage, 
      category: itemCat,
      variantType
    };

    if (variantType === 'portion') {
      payload.portions = [
        { name: 'Half', price: parseFloat(halfPrice) || 0 },
        { name: 'Full', price: parseFloat(fullPrice) || 0 }
      ];
      payload.price = parseFloat(fullPrice) || 0;
      payload.hasPortions = true;
    } else if (variantType === 'pieces') {
      payload.portions = piecesVariants
        .filter(p => p.name && p.price)
        .map(p => ({ name: p.name, price: parseFloat(p.price) || 0 }));
      
      if (payload.portions.length > 0) {
        payload.price = payload.portions[0].price; // Set base price to first option
        payload.hasPortions = true;
      } else {
        // Fallback if user selected pieces but didn't enter any
        payload.hasPortions = false;
        payload.variantType = 'none';
      }
    } else {
      payload.portions = [];
      payload.hasPortions = false;
    }

    const promise = API.post('/menu/items', payload);
    
    toast.promise(promise, {
      loading: 'Adding item...',
      success: () => {
        setItemName('');
        setItemPrice('');
        setItemImage('');
        setVariantType('none');
        setHalfPrice('');
        setFullPrice('');
        setPiecesVariants([{ name: '', price: '' }, { name: '', price: '' }]);
        return 'Item added!';
      },
      error: (err) => err.response?.data?.msg || 'Failed to add item',
    });
  }

  const updatePieceVariant = (index, field, value) => {
    const newVariants = [...piecesVariants];
    newVariants[index][field] = value;
    setPiecesVariants(newVariants);
  };

  const addPieceRow = () => {
    setPiecesVariants([...piecesVariants, { name: '', price: '' }]);
  };

  const removePieceRow = (index) => {
    const newVariants = piecesVariants.filter((_, i) => i !== index);
    setPiecesVariants(newVariants);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className='text-red-500'>1. Upload image on admin.chaicafeteria.com/images folder</h1>
        <h1 className='text-red-500'>2. Copy the image URL and paste it below</h1>
        <h3 className='text-red-500'>Sample http://chaicafeteria.com/images/menu_pizza.webp (change the format as needed)</h3>
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
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Item Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="variantType" value="none" checked={variantType === 'none'} onChange={e => setVariantType(e.target.value)} className="w-4 h-4 text-amber-500" />
                <span>Single Price</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="variantType" value="portion" checked={variantType === 'portion'} onChange={e => setVariantType(e.target.value)} className="w-4 h-4 text-amber-500" />
                <span>Half / Full</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="variantType" value="pieces" checked={variantType === 'pieces'} onChange={e => setVariantType(e.target.value)} className="w-4 h-4 text-amber-500" />
                <span>Pieces / Custom</span>
              </label>
            </div>
          </div>

          {variantType === 'none' && (
            <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Price" type="number" step="0.01" value={itemPrice} onChange={e => setItemPrice(e.target.value)} required />
          )}

          {variantType === 'portion' && (
            <div className="grid grid-cols-2 gap-4">
              <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Half Price" type="number" step="0.01" value={halfPrice} onChange={e => setHalfPrice(e.target.value)} required />
              <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Full Price" type="number" step="0.01" value={fullPrice} onChange={e => setFullPrice(e.target.value)} required />
            </div>
          )}

          {variantType === 'pieces' && (
            <div className="space-y-3">
              {piecesVariants.map((pv, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" 
                    placeholder="Name (e.g. 6 pcs)" 
                    value={pv.name} 
                    onChange={e => updatePieceVariant(idx, 'name', e.target.value)} 
                    required={idx < 1} // Require at least one
                  />
                  <input 
                    className="w-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" 
                    placeholder="Price" 
                    type="number" 
                    step="0.01" 
                    value={pv.price} 
                    onChange={e => updatePieceVariant(idx, 'price', e.target.value)} 
                    required={idx < 1}
                  />
                  {piecesVariants.length > 1 && (
                    <button type="button" onClick={() => removePieceRow(idx)} className="text-red-500 hover:text-red-700 p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPieceRow} className="text-sm text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1">
                + Add another option
              </button>
            </div>
          )}

          <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Image URL" value={itemImage} onChange={e => setItemImage(e.target.value)} />
          <button className="w-full px-4 py-3 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 transition-colors">Add Item</button>
        </form>
      </div>
    </div>
  );
}
