// routes/orders.js
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const auth = require("../middleware/auth"); // Middleware to protect routes
const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new trade order with transaction
// @access  Private
router.post("/", auth, async (req, res) => {
	const session = await mongoose.startSession(); // Start MongoDB session
	session.startTransaction(); // Begin transaction

	try {
		const orders = req.body.orders; // Receive batch orders from frontend

		if (!Array.isArray(orders) || orders.length === 0) {
			throw new Error("No orders provided.");
		}

		// Prepare the order objects for insertion
		const newOrders = orders.map(order => ({
			side: order.side,
			price: order.price,
			quantity: order.quantity,
			symbol: order.symbol,
			account: order.account,
			date: order.date,
			user: req.user.id, // Attach the user ID to each order
		}));

		// Insert the orders in a transaction
		await Order.insertMany(newOrders, { session });

		// Commit the transaction if everything goes well
		await session.commitTransaction();
		session.endSession();
		
		res.status(201).json({ message: "All orders saved successfully.", orders: newOrders });
	} catch (err) {
		// If any error occurs, abort the transaction
		await session.abortTransaction();
		session.endSession();
		console.error("Error in saving orders:", err.message);
		
		if (err.code === 11000) {
			return res.status(400).json({ error: "Duplicate order detected. No orders were saved." });
		}
		res.status(500).send("Server error. No orders were saved.");
	}
});


// @route   GET /api/orders
// @desc    Get all trade orders for the authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
    console.log("Fetching orders for user:", req.user.id); // Log the user ID

    try {
        const orders = await Order.find({ user: req.user.id }).sort({ date: -1 });
        console.log("Orders fetched:"); // Log fetched orders for debugging
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// Get historical trades (for example, trades from the last 7 days)
router.get("/historical", auth, async (req, res) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    try {
        const historicalTrades = await Order.find({
            date: { $gte: sevenDaysAgo, $lt: today },
        });
        res.json(historicalTrades);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
