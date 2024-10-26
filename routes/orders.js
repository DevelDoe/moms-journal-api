const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Trade = require("../models/Trade");
const auth = require("../middleware/auth");
const calculateTrades = require("../utils/calculateTrades");
const calculateSummary = require("../utils/calculateSummary");
const TradeSummary = require("../models/TradeSummary");

const router = express.Router();

// Function to generate a hash for the batch of orders
function generateBatchHash(orders) {
	const concatenatedData = orders.map((order) => `${order.side}-${order.price}-${order.quantity}-${order.symbol}-${order.date}`).join("|");
	return crypto.createHash("sha256").update(concatenatedData).digest("hex");
}

// @route   POST /api/orders
// @desc    Create a new batch of trade orders with transaction support
// @access  Private
router.post("/", auth, async (req, res) => {
	try {
		// Ensure collections are created before starting the transaction
		await Promise.all([
			Order.init(),
			Trade.init(),
			TradeSummary.init(),
		]);

		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const orders = req.body.orders;
			if (!Array.isArray(orders) || orders.length === 0) {
				throw new Error("No orders provided.");
			}

			const batchHash = generateBatchHash(orders);
			const existingBatch = await Order.findOne({ batchHash });
			if (existingBatch) {
				return res.status(400).json({ error: "Duplicate batch detected. No orders were saved." });
			}

			// Create new order objects
			const newOrders = orders.map((order) => ({
				side: order.side,
				price: order.price,
				quantity: order.quantity,
				symbol: order.symbol,
				date: order.date,
				user: req.user.id,
				batchHash: batchHash,
			}));

			await Order.insertMany(newOrders, { session });

			// After orders are inserted, calculate trades based on the orders
			const trades = calculateTrades(newOrders);

			// Save calculated trades in the Trade collection
			const newTrades = trades.map((trade) => ({
				user: req.user.id,
				symbol: trade.symbol,
				side: trade.side,
				quantity: trade.quantity,
				buyPrice: trade.buyPrice,
				sellPrice: trade.sellPrice,
				shortPrice: trade.shortPrice,
				coverPrice: trade.coverPrice,
				profitLoss: trade.profitLoss,
				date: trade.date,
			}));

			await Trade.insertMany(newTrades, { session });

			// Calculate the summaries
			const summaries = calculateSummary(newTrades);

			// Save each summary in the TradeSummary collection
			const newSummaries = summaries.map((summary) => ({
				user: req.user.id,
				date: summary.date,
				totalProfitLoss: summary.totalProfitLoss,
				accuracy: summary.accuracy,
				profitToLossRatio: summary.profitToLossRatio,
				totalTrades: summary.totalTrades,
				wins: summary.wins,
				losses: summary.losses,
			}));

			await TradeSummary.insertMany(newSummaries, { session });

			await session.commitTransaction();
			res.status(201).json({
				message: "Orders, trades, and summaries saved successfully.",
			});
		} catch (err) {
			await session.abortTransaction();
			console.error("Error saving orders, trades, and summaries:", err.message);
			res.status(500).json({ error: err.message });
		} finally {
			session.endSession();
		}
	} catch (err) {
		console.error("Error initializing collections:", err.message);
		res.status(500).json({ error: "Server error. Failed to initialize collections." });
	}
});

// @route   GET /api/orders
// @desc    Get all trade orders for the authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
	console.log("Fetching orders for user:", req.user.id);
	try {
		const orders = await Order.find({ user: req.user.id }).sort({ date: -1 });
		console.log("Orders fetched successfully");
		res.json(orders);
	} catch (err) {
		console.error("Error fetching orders:", err.message);
		res.status(500).send("Server error");
	}
});

module.exports = router;