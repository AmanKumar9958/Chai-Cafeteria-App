const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true },
    subtotal: { type: Number },
    deliveryFee: { type: Number },
    discount: { type: Number },
    couponCode: { type: String },
    orderType: { type: String, enum: ['Pickup', 'Delivery'] },
    paymentMethod: { type: String },
    status: {
      type: String,
      enum: ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'],
      default: 'Order Placed',
    },
    customerName: { type: String },
    phone: { type: String },
    address1: { type: String },
    address2: { type: String },
    landmark: { type: String },
    pincode: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
