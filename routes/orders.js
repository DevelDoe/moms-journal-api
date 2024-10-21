const crypto = require('crypto');
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const router = express.Router();

// Function to generate a hash for the batch of orders
// This will help in identifying if the same batch is being uploaded again
function generateBatchHash(orders) {
  const concatenatedData = orders.map(order => 
    `${order.side}-${order.price}-${order.quantity}-${order.symbol}-${order.account}-${order.date}`).join('|');
  
  return crypto.createHash('sha256').update(concatenatedData).digest('hex');
}

// @route   POST /api/orders
// @desc    Create a new batch of trade orders with transaction support
// @access  Private
router.post("/", auth, async (req, res) => {
	const session = await mongoose.startSession(); // Start MongoDB session
	session.startTransaction(); // Begin transaction
  
	try {
	  const orders = req.body.orders; // Retrieve batch of orders from the frontend
  
	  if (!Array.isArray(orders) || orders.length === 0) {
		throw new Error("No orders provided."); // If no orders are provided, throw an error
	  }
  
	  // Generate a hash for the entire batch of orders
	  const batchHash = generateBatchHash(orders);
  
	  // Check if a batch with the same batchHash already exists in the database
	  const existingBatch = await Order.findOne({ batchHash });
	  if (existingBatch) {
		// Instead of throwing an error, handle it more gracefully
		return res.status(400).json({ error: "Duplicate batch detected. No orders were saved." });
	  }
  
	  // Prepare the new orders by adding batchHash and user ID to each order
	  const newOrders = orders.map(order => ({
		side: order.side,
		price: order.price,
		quantity: order.quantity,
		symbol: order.symbol,
		account: order.account,
		date: order.date,
		user: req.user.id, // Attach the authenticated user's ID
		batchHash: batchHash, // Attach the batchHash to each order
	  }));
  
	  // Insert the new orders into the database
	  await Order.insertMany(newOrders, { session });
  
	  // Commit the transaction if the orders are successfully inserted
	  await session.commitTransaction();
	  session.endSession();
	  
	  // Send a response to the client confirming the orders were saved
	  res.status(201).json({ message: "Orders saved successfully.", orders: newOrders });
	} catch (err) {
	  // If an error occurs, abort the transaction and end the session
	  await session.abortTransaction();
	  session.endSession();
	  
	  console.error("Error in saving orders:", err.message); // Log the error for debugging
  
	  // Send an error response to the client
	  res.status(500).json({ error: err.message });
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
