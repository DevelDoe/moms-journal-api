const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  side: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date, 
    required: true,
  },
  account: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
});

orderSchema.index({ date: 1, symbol: 1, account: 1, side: 1, price: 1, quantity: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);