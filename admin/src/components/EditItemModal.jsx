import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';

export default function EditItemModal({ item, onClose, onUpdate }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  const [image, setImage] = useState(item.image || '');
  const [variantType, setVariantType] = useState(item.variantType || (item.hasPortions ? 'portion' : 'none'));
  const [halfPrice, setHalfPrice] = useState('');
  const [fullPrice, setFullPrice] = useState('');
  const [piecesVariants, setPiecesVariants] = useState([{ name: '', price: '' }, { name: '', price: '' }]);

  useEffect(() => {
    if (item.portions && item.portions.length > 0) {
      if (variantType === 'portion') {
        const half = item.portions.find(p => p.name === 'Half');
        const full = item.portions.find(p => p.name === 'Full');
        if (half) setHalfPrice(half.price);
        if (full) setFullPrice(full.price);
      } else if (variantType === 'pieces') {
        setPiecesVariants(item.portions.map(p => ({ name: p.name, price: p.price })));
      }
    }
  }, [item, variantType]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name,
      price: parseFloat(price) || 0,
      image,
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
        payload.price = payload.portions[0].price;
        payload.hasPortions = true;
      } else {
        payload.hasPortions = false;
        payload.variantType = 'none';
      }
    } else {
      payload.portions = [];
      payload.hasPortions = false;
    }

    const promise = API.put(`/menu/items/${item._id}`, payload);
    
    toast.promise(promise, {
      loading: 'Updating item...',
      success: () => {
        onUpdate();
        onClose();
        return 'Item updated!';
      },
      error: (err) => {
        console.error(err);
        return err.response?.data?.msg || err.message || 'Failed to update item';
      },
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className="w-full p-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Item Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="editVariantType" value="none" checked={variantType === 'none'} onChange={e => setVariantType(e.target.value)} className="w-4 h-4 text-amber-500" />
                <span>Single</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="editVariantType" value="portion" checked={variantType === 'portion'} onChange={e => setVariantType(e.target.value)} className="w-4 h-4 text-amber-500" />
                <span>Half/Full</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="editVariantType" value="pieces" checked={variantType === 'pieces'} onChange={e => setVariantType(e.target.value)} className="w-4 h-4 text-amber-500" />
                <span>Pieces</span>
              </label>
            </div>
          </div>

          {variantType === 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input className="w-full p-2 border rounded" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
            </div>
          )}

          {variantType === 'portion' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Half Price</label>
                <input className="w-full p-2 border rounded" type="number" step="0.01" value={halfPrice} onChange={e => setHalfPrice(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Price</label>
                <input className="w-full p-2 border rounded" type="number" step="0.01" value={fullPrice} onChange={e => setFullPrice(e.target.value)} required />
              </div>
            </div>
          )}

          {variantType === 'pieces' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Variants (Name & Price)</label>
              {piecesVariants.map((pv, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    className="flex-1 p-2 border rounded" 
                    placeholder="Name (e.g. 6 pcs)" 
                    value={pv.name} 
                    onChange={e => updatePieceVariant(idx, 'name', e.target.value)} 
                    required={idx < 1}
                  />
                  <input 
                    className="w-24 p-2 border rounded" 
                    placeholder="Price" 
                    type="number" 
                    step="0.01" 
                    value={pv.price} 
                    onChange={e => updatePieceVariant(idx, 'price', e.target.value)} 
                    required={idx < 1}
                  />
                  {piecesVariants.length > 1 && (
                    <button type="button" onClick={() => removePieceRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPieceRow} className="text-sm text-amber-600 hover:text-amber-800 font-medium">
                + Add another option
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input className="w-full p-2 border rounded" value={image} onChange={e => setImage(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
