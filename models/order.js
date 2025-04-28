const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  products: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'product',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  totalPrice: {
    type: Number,
    required: true
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;