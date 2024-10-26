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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  batchHash: {
    type: String,
    required: true, // Store the batch hash
  },
});

module.exports = mongoose.model('Order', orderSchema);
