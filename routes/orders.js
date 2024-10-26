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
// This will help in identifying if the same batch is being uploaded again
function generateBatchHash(orders) {
	const concatenatedData = orders.map((order) => `${order.side}-${order.price}-${order.quantity}-${order.symbol}-${order.account}-${order.date}`).join("|");

	return crypto.createHash("sha256").update(concatenatedData).digest("hex");
}

// @route   POST /api/orders
// @desc    Create a new batch of trade orders with transaction support
// @access  Private
router.post("/", auth, async (req, res) => {
	try {
	  // Ensure collections are created before starting the transaction
	  await Promise.all([
		Order.init(), // Creates the 'orders' collection if it doesn't exist
		Trade.init(), // Creates the 'trades' collection if it doesn't exist
		TradeSummary.init(), // Creates the 'tradesummaries' collection if it doesn't exist
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
		session.endSession();
  
		res.status(201).json({ message: "Orders, trades, and summaries saved successfully.", orders: newOrders, trades: newTrades, summaries: newSummaries });
	  } catch (err) {
		await session.abortTransaction();
		session.endSession();
  
		console.error("Error saving orders, trades, and summaries:", err.message);
		res.status(500).json({ error: err.message });
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
	console.log("Fetching orders for user:", req.user.id); // Log the user ID for debugging

	try {
		// Fetch all orders for the authenticated user, sorted by date in descending order
		const orders = await Order.find({ user: req.user.id }).sort({ date: -1 });
		console.log("Orders fetched successfully"); // Log that orders were fetched successfully
		res.json(orders); // Return the orders to the client
	} catch (err) {
		console.error("Error fetching orders:", err.message); // Log the error
		res.status(500).send("Server error"); // Return a server error to the client
	}
});

// @route   GET /api/orders/historical
// @desc    Get trade orders from the last 7 days for the authenticated user
// @access  Private
router.get("/historical", auth, async (req, res) => {
	const today = new Date(); // Get the current date
	const sevenDaysAgo = new Date(today);
	sevenDaysAgo.setDate(today.getDate() - 7); // Calculate the date 7 days ago

	try {
		// Fetch orders placed in the last 7 days
		const historicalTrades = await Order.find({
			date: { $gte: sevenDaysAgo, $lt: today }, // Filter for orders within the last 7 days
			user: req.user.id, // Only fetch orders for the authenticated user
		});
		res.json(historicalTrades); // Return the orders to the client
	} catch (err) {
		console.error("Error fetching historical orders:", err.message); // Log the error
		res.status(500).send("Server error"); // Return a server error to the client
	}
});

module.exports = router;
