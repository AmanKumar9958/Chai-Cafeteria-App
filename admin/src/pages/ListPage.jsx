import React, { useEffect, useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast'; // Import toast

export default function ListPage() {
  const [cats, setCats] = useState([]);
  // Track which categories are expanded (true) or collapsed (false)
  const [openMap, setOpenMap] = useState({});

  useEffect(() => { load() }, []);

  async function load() {
    try {
        const res = await API.get('/menu/categories', { params: { withItems: 1 } });
      const list = res.data.categories || [];
      setCats(list);
      // Initialize newly loaded categories as collapsed unless we already have a state for them
      setOpenMap(prev => {
        const next = { ...prev };
        for (const c of list) {
          if (typeof next[c._id] === 'undefined') next[c._id] = false;
        }
        return next;
      });
    } catch (e) {
        console.error('Could not load categories', e);
      toast.error('Failed to load menu');
    }
  }

  async function delCat(id) {
    // We remove the confirm() and let toast.promise handle feedback
    const promise = API.delete('/menu/categories/' + id);
    toast.promise(promise, {
      loading: 'Deleting category...',
      success: 'Category deleted!',
      error: 'Delete failed',
    }).then(() => load()); // Refresh the list on success
  }

  async function delItem(id) {
    const promise = API.delete('/menu/items/' + id);
    toast.promise(promise, {
      loading: 'Deleting item...',
      success: 'Item deleted!',
      error: 'Delete failed',
    }).then(() => load()); // Refresh the list on success
  }

  function toggle(id){
    setOpenMap(m => ({ ...m, [id]: !m[id] }));
  }

  function toggleAll(expand){
    setOpenMap(m => {
      const next = { ...m };
      for (const c of cats) next[c._id] = !!expand;
      return next;
    });
  }

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Manage Categories & Items</h2>
          <div className="flex items-center gap-2">
            <button onClick={()=>toggleAll(true)} className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200">Expand all</button>
            <button onClick={()=>toggleAll(false)} className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200">Collapse all</button>
          </div>
        </div>
        <div className="space-y-6">
          {cats.map(c => (
            <div key={c._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-amber-600">{c.name}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggle(c._id)} className="text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100 text-sm">
                    {openMap[c._id] ? 'Collapse' : 'Expand'}
                  </button>
                  <button onClick={() => delCat(c._id)} className="text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded-md hover:bg-red-50 text-sm">Delete Category</button>
                </div>
              </div>
              {openMap[c._id] && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(c.items || []).map(it => (
                    <div key={it._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <img 
                        src={it.image || 'https://placehold.co/300x200?text=No+Image'} 
                        alt={it.name} 
                        className="w-full h-32 object-cover" 
                      />
                      <div className="p-3">
                        <div className="font-semibold text-gray-700">{it.name}</div>
                        <div className="text-sm text-gray-600">₹{it.price}</div>
                        <button onClick={() => delItem(it._id)} className="mt-2 text-red-500 hover:text-red-700 text-xs font-medium">
                          Delete Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
