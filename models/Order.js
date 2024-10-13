// models/Order.js
const mongoose = require('mongoose');

// Define the Order schema
const OrderSchema = new mongoose.Schema({
  side: {
    type: String,
    required: true,
    enum: ['buy', 'sell'], // To restrict it to buy or sell
  },
  time: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  account: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Attach the order to a specific user
  },
});

module.exports = mongoose.model('Order', OrderSchema);