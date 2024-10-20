// models/Broker.js
const mongoose = require("mongoose");

// Define the Account schema for brokers
const AccountSchema = new mongoose.Schema({
  type: {
    type: String,   // Account type (e.g., "Individual", "Corporate", "Retirement")
    required: true,
  },
  rate_per_share: {
    type: Number,   // Per-share rate for commission (e.g., $0.0005/share)
    required: true,
    default: 0
  },
  min_amount: {
    type: Number,   // Minimum commission per order (e.g., $0.50)
    required: true,
    default: 0.5
  },
  max_amount: {
    type: Number,   // Maximum commission per order (e.g., 1% of trade value)
    required: true,
    default: 1
  },
  percentage_rate: {
    type: Number,   // Percentage commission based on trade value (e.g., 0.05%)
    required: true,
    default: 0.05
  },
  ecn_fees: {
    type: Number,   // ECN fee for taking liquidity (e.g., $0.003/share)
    default: 0.003
  },
  inactivity_fee: {
    type: Number,   // Inactivity fee for inactive accounts (e.g., $17 per 30 days)
    default: 17
  },
  market_data_fee: {
    type: Number,   // Monthly real-time market data fee
    default: 15
  },
  platform_fee: {
    type: Number,   // Platform subscription fee
    default: 0
  },
  withdrawal_fee: {
    type: Number,   // Withdrawal wire fee
    default: 60
  },
  extended_hours_trading_fee: {
    type: Number,   // Fee for trading outside regular hours (e.g., $0.0045/share)
    default: 0.0045
  },
  minimumDeposit: {
    type: Number, // Minimum deposit required for this account type
    default: 0
  }
});

// Define the Broker schema with account types
const BrokerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: "" // A short description of the broker
  },
  accountTypes: [AccountSchema],  // Array of account types
  active: {
    type: Boolean,
    default: true // Broker status
  }
});

module.exports = mongoose.model("Broker", BrokerSchema);
