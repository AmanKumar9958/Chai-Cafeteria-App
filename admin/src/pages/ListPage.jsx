import React, { useEffect, useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast'; // Import toast
import EditItemModal from '../components/EditItemModal';

export default function ListPage() {
  const [cats, setCats] = useState([]);
  // Track which categories are expanded (true) or collapsed (false)
  const [openMap, setOpenMap] = useState({});
  const [editingItem, setEditingItem] = useState(null);

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
                        {(it.hasPortions || (it.portions && it.portions.length > 0)) ? (
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            {it.portions.map((p, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                                <span className="text-xs font-medium">{p.name}</span>
                                <span className="text-xs font-bold">₹{p.price}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 mt-1">₹{it.price}</div>
                        )}
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => setEditingItem(it)} className="text-blue-500 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            Edit
                          </button>
                          <button onClick={() => delItem(it._id)} className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {editingItem && (
        <EditItemModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onUpdate={load} 
        />
      )}
    </div>
  );
}
