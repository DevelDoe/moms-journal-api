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
  },
  batchHash: {
    type: String,
    required: true, // Add this to store the batch hash
  },
});

module.exports = mongoose.model('Order', orderSchema);
