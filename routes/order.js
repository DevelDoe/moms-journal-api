// routes/order.js
const express = require("express");
const Order = require("../models/Order");
const auth = require("../middleware/auth"); // Middleware to protect routes
const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new trade order
// @access  Private
router.post("/", auth, async (req, res) => {
	const { side, time, price, quantity, symbol, account, date } = req.body;

	try {
		const newOrder = new Order({
			side,
			time,
			price,
			quantity,
			symbol,
			account,
			date,
			user: req.user.id, // Attach the order to the logged-in user
		});

		const savedOrder = await newOrder.save();
		res.status(201).json(savedOrder);
	} catch (err) {
		// Catch duplicate key error (code 11000)
		if (err.code === 11000) {
			return res
				.status(400)
				.json({
					error: "Duplicate order: An order with the same date and time already exists.",
				});
		}
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   GET /api/orders
// @desc    Get all trade orders for the authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user.id }).sort({
			date: -1,
		});
		res.json(orders);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

module.exports = router;
