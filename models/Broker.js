const mongoose = require("mongoose");

// Define the Market Data schema
const MarketDataSchema = new mongoose.Schema({
	name: {
		type: String, // Market data feed name (e.g., "NYSE Tape A")
		required: true,
	},
	non_professional_fee: {
		type: Number, // Fee for non-professional users (e.g., $3.00)
		required: true,
	},
	professional_fee: {
		type: Number, // Fee for professional users (e.g., $32.50)
		required: true,
	},
});

// Define the Platform schema with platform-specific market data
const PlatformSchema = new mongoose.Schema({
	platform_name: {
		type: String, // Platform name (e.g., "DAS Trader Pro", "Sterling Trader Pro")
		required: true,
	},
	market_data: [MarketDataSchema], // Array of market data feeds for this platform
});

// Define the Account schema for brokers
const AccountSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true,
	},
	rate_per_share: {
		type: Number,
		default: 0,
	},
	min_amount: {
		type: Number,
		default: 0.5,
	},
	max_amount: {
		type: Number,
		default: 1,
	},
	percentage_rate: {
		type: Number,
		default: 0.05,
	},
	ecn_routes: [
		{
			name: { type: String, required: true },
			fees: { type: Number, required: true },
			extended_fees: { type: Number, required: true },
		},
	],
	inactivity_fee: { type: Number, default: 17 },
	market_data_fee: { type: Number, default: 15 },
	withdrawal_fee: { type: Number, default: 60 },
	minimumDeposit: { type: Number, default: 0 },
	leverage: { type: Number, default: 1 },
	regulatory_fee: { type: Number, default: 0.0005 },
	overnight_fee: { type: String, default: "Fed Funds Rate + 875 Basis Points" },
});

// Define the Broker schema with account types and platform-specific market data
const BrokerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	description: {
		type: String,
		default: "",
	},
	accountTypes: [AccountSchema], // Array of account types
	platforms: [PlatformSchema], // Array of platforms with market data feeds
	active: {
		type: Boolean,
		default: true,
	},
});

module.exports = mongoose.model("Broker", BrokerSchema);
