import React, { useEffect, useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast';

function OrderCard({ o, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const orderId = o._id || o.id;
  const shortId = `ChaiCafe-${orderId.toString().slice(-6).toUpperCase()}`;

  async function sendNotification(title, body) {
    setNotifyOpen(false);
    const promise = API.post(`/admin/orders/${orderId}/notify`, { title, body });
    toast.promise(promise, {
      loading: 'Sending notification...',
      success: 'Notification sent!',
      error: (err) => err?.response?.data?.message || 'Failed to send notification',
    });
  }

  const notifyOptions = [
    { label: 'Order Placed', title: 'Order Confirmed! 🎉', body: 'Your order has been placed successfully.' },
    { label: 'Order Ready', title: 'Order Ready! ☕', body: 'Your order is ready for pickup. See you soon!' },
    { label: 'Order Shipped', title: 'Order Shipped! 🚚', body: 'Your order is on the way.' },
    { label: 'Order Delivered', title: 'Order Delivered! ✅', body: 'Enjoy your meal!' }
  ];

  return (
    <div className={`border border-gray-200 rounded-lg p-4 border-l-4 ${
      o.status === 'Delivered' ? 'border-l-green-500' :
      o.status === 'Cancelled' ? 'border-l-red-500' :
      o.status === 'Order Placed' ? 'border-l-blue-500' :
      'border-l-amber-500'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start">
        <div className="flex-1">
          <strong className="text-gray-800">Order ID: {shortId}</strong>
          <div className="text-sm text-gray-600">{(o.items || []).length} items • <span className="font-medium">₹{o.total || o.amount || 0}</span></div>
          <div className="mt-1 text-xs flex gap-2 items-center">
            <span className={`px-2 py-0.5 rounded font-semibold text-xs 
              ${o.paymentMethod === 'Online Payment' ? 'bg-green-100 text-green-700' : o.paymentMethod === 'COD' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-700'}`}
            >{o.paymentMethod || 'N/A'}</span>
            <span className={`px-2 py-0.5 rounded font-semibold text-xs 
              ${o.orderType === 'Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}
            >{o.orderType || 'Pickup'}</span>
          </div>
          {o.createdAt && (
            <div className="mt-1 text-xs inline-block px-2 py-0.5 rounded bg-lime-300 text-gray-700 font-medium">Placed on: {new Date(o.createdAt).toLocaleString()}</div>
          )}
          
          {/* Order ready time */}
          {o.items && o.items.length > 0 && (
            (() => {
              const totalItems = o.items.reduce((sum, it) => sum + (it.qty || it.quantity || 1), 0);
              let readyMinutes = 25;
              if (totalItems <= 2) readyMinutes = 7;
              else if (totalItems <= 5) readyMinutes = 12;
              else if (totalItems <= 10) readyMinutes = 18;
              return (
                <div className="mt-1 ml-0 sm:ml-2 text-xs inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium" style={{ background: '#e6f9ec' }}>
                  Ready in <span className="font-bold">{readyMinutes}</span> mins
                </div>
              );
            })()
          )}
        </div>
        
        <div className="mt-3 sm:mt-0 flex flex-col items-start sm:items-end gap-2 relative">
          <select 
            value={o.status} 
            onChange={e => onUpdateStatus(orderId, e.target.value)} 
            className="w-full sm:w-auto border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          >
            <option value="Order Placed">Order Placed</option>
            <option value="Packing">Packing</option>
            {o.orderType !== 'Delivery' && <option value="Order Ready">Order Ready</option>}
            {o.orderType === 'Delivery' && <option value="Shipped">Shipped</option>}
            {o.orderType === 'Delivery' && <option value="Out for delivery">Out for delivery</option>}
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Notify Button with Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button 
                onClick={() => setNotifyOpen(!notifyOpen)}
                className="w-full px-3 py-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition text-sm flex items-center justify-between gap-1"
              >
                Notify User <span>▼</span>
              </button>
              {notifyOpen && (
                <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-1 w-full sm:w-40 bg-white border border-gray-200 rounded shadow-lg z-10 overflow-hidden">
                  {notifyOptions.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => sendNotification(opt.title, opt.body)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Expand / Collapse Button */}
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Items:</h4>
          <div className="space-y-1 mb-4">
            {(o.items || []).map((item, idx) => (
              <div key={item._id || item.id || idx} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-medium text-gray-800">{item.qty || item.quantity}x</span>
                <span>
                  {item.name}
                  {(item.variant || item.portion) && (
                    <span className="text-gray-500 font-medium ml-1">
                      {(() => {
                        const v = (item.variant || item.portion).toString().toLowerCase();
                        if (v.includes('half')) return '(H)';
                        if (v.includes('full')) return '(F)';
                        if (v.includes('6')) return '(6)';
                        if (v.includes('12')) return '(12)';
                        return `(${item.variant || item.portion})`;
                      })()}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <h4 className="font-semibold text-sm text-gray-700 mb-2">Customer Details:</h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div><span className="text-gray-500">Name:</span> {o.customerName || '—'}</div>
            <div className='bg-red-300 p-1 rounded-lg w-fit'><span className="text-black">Phone:</span> <span className='text-black'>{o.phone || '—'}</span></div>
            {o.orderType === 'Delivery' && (
              <>
                <div className="sm:col-span-2"><span className="text-gray-500">Address:</span> {[o.address1, o.address2, o.landmark].filter(Boolean).join(', ') || '—'}</div>
                <div><span className="text-gray-500">Pincode:</span> {o.pincode || '—'}</div>
              </>
            )}
          </div>
          
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Coupon:</span>{' '}
            {o.couponCode ? o.couponCode : 'N/A'}
            {Number(o.discount) > 0 && (
              <span className="text-green-700"> (−₹{Number(o.discount).toFixed(2)})</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load() }, []);

  async function load(withLoader = false) {
    if (withLoader) setLoading(true);
    try {
      const res = await API.get('/admin/orders');
      setOrders(res.data?.orders || res.data || []);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        toast.error('Please login to view orders');
      } else {
        toast.error('Failed to load orders');
      }
      setOrders([]);
    } finally {
      if (withLoader) setTimeout(() => setLoading(false), 600);
    }
  }

  async function updateStatus(id, status) {
    const promise = API.put('/admin/orders/' + id, { status });
    toast.promise(promise, {
      loading: 'Updating status...',
      success: 'Status updated!',
      error: 'Update failed',
    }).then(() => load());
  }

  return (
    <div className="p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Incoming Orders</h2>
          <button
            onClick={() => load(true)}
            className="hover:cursor-pointer ml-4 px-3 py-1 rounded bg-amber-500 text-white font-medium hover:bg-amber-600 transition flex items-center gap-2 min-w-[90px] justify-center"
            title="Refresh orders"
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="space-y-4">
          {orders.map(o => (
            <OrderCard key={o._id || o.id} o={o} onUpdateStatus={updateStatus} />
          ))}
        </div>
      </div>
    </div>
  );
}
