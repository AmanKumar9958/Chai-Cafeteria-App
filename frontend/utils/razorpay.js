// Lightweight wrapper for Razorpay checkout in React Native
// Requires: react-native-razorpay (build-time native module). Works in Expo via EAS + config plugin.

let RazorpayCheckout;
try {
  RazorpayCheckout = require('react-native-razorpay');
} catch (_e) {
  RazorpayCheckout = null;
}

/**
 * Open Razorpay native checkout UI
 * @param {Object} opts
 * @param {string} opts.key - Razorpay Key ID (public)
 * @param {number} opts.amount - Amount in paise (integer)
 * @param {string} opts.orderId - Razorpay order_id from backend
 * @param {string} [opts.name]
 * @param {string} [opts.description]
 * @param {{name?: string, contact?: string, email?: string}} [opts.prefill]
 * @param {Object} [opts.notes]
 * @returns {Promise<{razorpay_payment_id: string, razorpay_order_id: string, razorpay_signature: string}>}
 */
export async function openRazorpayCheckout({ key, amount, orderId, name, description, prefill, notes }) {
  if (!key) throw new Error('Missing Razorpay Key ID');
  if (!amount) throw new Error('Missing payment amount');
  if (!orderId) throw new Error('Missing Razorpay orderId');

  if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
    throw new Error(
      'Razorpay native module not available. Install "react-native-razorpay" and rebuild the app (Expo Dev Client/EAS).'
    );
  }

  const options = {
    key,
    amount,
    currency: 'INR',
    name: name || 'Payment',
    description: description || 'Order payment',
    order_id: orderId,
    prefill: prefill || {},
    notes: notes || {},
    theme: { color: '#F97316' }, // chai primary-ish
  };

  const res = await RazorpayCheckout.open(options);
  return {
    razorpay_payment_id: res?.razorpay_payment_id,
    razorpay_order_id: res?.razorpay_order_id || orderId,
    razorpay_signature: res?.razorpay_signature,
  };
}
