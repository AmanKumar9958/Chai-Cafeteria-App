import React, { useEffect, useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast'; // Import toast

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => { load() }, []);

  async function load() {
    try {
      const res = await API.get('/orders');
      setOrders(res.data?.orders || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    }
  }

  async function update(id, status) {
    const promise = API.put('/orders/' + id, { status });
    toast.promise(promise, {
      loading: 'Updating status...',
      success: 'Status updated!',
      error: 'Update failed',
    }).then(() => load()); // Refresh list on success
  }

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Incoming Orders</h2>
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o._id || o.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                  <strong className="text-gray-800">Order ID: {o._id || o.id}</strong>
                  <div className="text-sm text-gray-600">{(o.items || []).length} items • <span className="font-medium">₹{o.total || o.amount || 0}</span></div>
                  <div className="mt-1 text-xs text-gray-500">Payment: {o.paymentMethod || 'N/A'}</div>
                </div>
                <div className="mt-2 sm:mt-0">
                  <select 
                    defaultValue={o.status} 
                    onChange={e => update(o._id || o.id, e.target.value)} 
                    className="w-full sm:w-auto border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option>Order Placed</option>
                    <option>Packing</option>
                    <option>Shipped</option>
                    <option>Out for delivery</option>
                    <option>Delivered</option>
                  </select>
                </div>
              </div>
              {/* Customer details */}
              <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                <div><span className="text-gray-500">Name:</span> {o.customerName || '—'}</div>
                <div><span className="text-gray-500">Phone:</span> {o.phone || '—'}</div>
                <div className="sm:col-span-2"><span className="text-gray-500">Address:</span> {[o.address1, o.address2, o.landmark].filter(Boolean).join(', ') || '—'}</div>
                <div><span className="text-gray-500">Pincode:</span> {o.pincode || '—'}</div>
              </div>
              {/* Coupon details */}
              {(o.couponCode || o.discount) && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Coupon:</span> {o.couponCode || '—'} {o.discount ? (<span className="text-green-700">(−₹{Number(o.discount).toFixed(2)})</span>) : null}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Items:</h4>
                {(o.items || []).map(it => (
                  <div key={it._id || it.id} className="text-sm text-gray-600">
                    {it.name} x {it.qty || it.quantity || 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
