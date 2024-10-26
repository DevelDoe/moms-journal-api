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
  accountId: { // Reference to the account
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountType', // Assuming you have an AccountType model
    required: true
  },
  accountNr: { // New field for the account number
    type: String, // Keep this as a string for account number representation
    required: true, // Make this required if you want to enforce it
  },
  batchHash: {
    type: String,
    required: true, // Store the batch hash
  },
});

module.exports = mongoose.model('Order', orderSchema);
