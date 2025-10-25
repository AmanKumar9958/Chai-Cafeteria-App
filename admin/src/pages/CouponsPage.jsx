import React, { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState('percent');
  const [value, setValue] = useState(10);
  const [minSubtotal, setMinSubtotal] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(100);
  const [active, setActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/coupons');
      setList(data.coupons || []);
    } catch (err) {
      console.error('Load coupons failed', err?.response?.data || err?.message || err);
      toast.error(err?.response?.data?.msg || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coupons', { code, type, value: Number(value), minSubtotal: Number(minSubtotal), maxDiscount: Number(maxDiscount), active });
      toast.success('Coupon created');
      setCode(''); setType('percent'); setValue(10); setMinSubtotal(0); setMaxDiscount(100); setActive(true);
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id, next) => {
    try {
      await api.put(`/coupons/${id}/active`, { active: next });
      toast.success(`Coupon ${next ? 'activated' : 'deactivated'}`);
      setList(list.map(c => c._id === id ? { ...c, active: next } : c));
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={create} className="bg-white rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold text-lg">Create Coupon</h2>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Code</label>
          <input value={code} onChange={(e)=>setCode(e.target.value.toUpperCase())} className="w-full border rounded px-3 py-2" placeholder="CHAI10" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type</label>
          <select value={type} onChange={(e)=>setType(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="percent">Percent %</option>
            <option value="flat">Flat ₹</option>
            <option value="freeship">Free Delivery</option>
          </select>
        </div>
        {type !== 'freeship' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Value {type==='percent'?'(%)':'(₹)'}</label>
            <input type="number" value={value} onChange={(e)=>setValue(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Min Subtotal (₹)</label>
            <input type="number" value={minSubtotal} onChange={(e)=>setMinSubtotal(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Max Discount (₹)</label>
            <input type="number" value={maxDiscount} onChange={(e)=>setMaxDiscount(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} />
          <label htmlFor="active">Active</label>
        </div>
        <button disabled={saving} className="bg-amber-500 text-white px-4 py-2 rounded disabled:opacity-50">{saving? 'Saving...' : 'Create'}</button>
      </form>

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-lg mb-3">Coupons</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Code</th>
                <th className="py-2">Type</th>
                <th className="py-2">Value</th>
                <th className="py-2">Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c._id} className="border-t">
                  <td className="py-2 font-mono">{c.code}</td>
                  <td className="py-2">{c.type}</td>
                  <td className="py-2">{c.type==='percent'? `${c.value}%` : c.type==='flat' ? `₹${c.value}` : '-'}</td>
                  <td className="py-2">{c.active ? 'Yes' : 'No'}</td>
                  <td className="py-2">
                    <button onClick={()=>toggle(c._id, !c.active)} className="text-blue-600 hover:underline">{c.active ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
