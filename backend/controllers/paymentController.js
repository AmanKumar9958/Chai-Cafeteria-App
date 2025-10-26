const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

function ensureConfigured() {
  if (!keyId || !keySecret) {
    const err = new Error('Razorpay keys not configured');
    err.status = 500;
    throw err;
  }
}

exports.createRazorpayOrder = async (req, res) => {
  try {
    ensureConfigured();
    const { amount, currency = 'INR', receipt, notes } = req.body || {};
    const amt = Number(amount);
    if (!amt || !Number.isInteger(amt) || amt <= 0) {
      return res.status(400).json({ message: 'Invalid amount (paise integer required)' });
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await instance.orders.create({ amount: amt, currency, receipt, notes });
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Failed to create order' });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    ensureConfigured();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const success = expected === razorpay_signature;
    if (!success) return res.status(400).json({ success: false, message: 'Invalid signature' });
    return res.json({ success: true });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Verification failed' });
  }
};
