const express = require("express");
const router = express.Router();
const Trade = require("../models/Trade");
const auth = require("../middleware/auth");
const TradeSummary = require("../models/TradeSummary");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// @route   GET /api/trades
// @desc    Get all trades for the authenticated user, optionally filtered by date range
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const { start, end } = req.query;

        let dateFilter = {};
        if (start) {
            const startDate = new Date(start);
            startDate.setHours(0, 0, 0, 0); // Set to start of day
            dateFilter.$gte = startDate;
        }
        if (end) {
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999); // Set to end of day
            dateFilter.$lte = endDate;
        }

        // Construct the filter object with optional date filtering
        const filter = {
            user: req.user.id,
            ...(start || end ? { date: dateFilter } : {}), // Apply date filter only if start or end is present
        };

        // Fetch trades with the filter applied
        const trades = await Trade.find(filter).sort({ date: -1 });

        // If no trades are found, return a message
        if (!trades || trades.length === 0) {
            return res.status(404).json({ msg: "No trades found within the specified date range." });
        }

        // Return the filtered trades in the response
        res.json(trades);
    } catch (err) {
        console.error("Error fetching trades:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// @route   GET /api/trades/historical
// @desc    Get trade orders from the last 7 days for the authenticated user
// @access  Private
router.get("/historical", auth, async (req, res) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    try {
        const historicalTrades = await Trade.find({
            date: { $gte: sevenDaysAgo, $lt: today },
            user: req.user.id,
        });
        res.json(historicalTrades);
    } catch (err) {
        console.error("Error fetching historical trades:", err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET /api/trades/summaries
// @desc    Get all trade summaries for the authenticated user
// @access  Private
router.get("/summaries", auth, async (req, res) => {
    try {
        const summaries = await TradeSummary.find({ user: req.user.id });
        res.json(summaries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET /api/trades/summaries/filter
// @desc    Get trade summaries for the authenticated user based on threshold filters
// @access  Private
router.get("/summaries/filter", auth, async (req, res) => {
    const { minProfit, maxProfit, minTrades, maxTrades, date } = req.query;

    let filter = { user: req.user.id };

    if (minProfit) filter.totalProfitLoss = { $gte: Number(minProfit) };
    if (maxProfit) filter.totalProfitLoss = { ...filter.totalProfitLoss, $lte: Number(maxProfit) };
    if (minTrades) filter.totalTrades = { $gte: Number(minTrades) };
    if (maxTrades) filter.totalTrades = { ...filter.totalTrades, $lte: Number(maxTrades) };
    if (date) filter.date = date; // Specific date filtering

    try {
        const filteredSummaries = await TradeSummary.find(filter);
        res.json(filteredSummaries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   DELETE /api/trades/user/:userId
// @desc    Delete trades, trade summaries, and orders for a user within a date range
// @access  Private (Admin only)
router.delete("/user/:userId", auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { start, end } = req.query;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        console.log("Delete request for userId:", userId, "Dates:", { start, end });

        // Build the date filter
        const dateFilter = {};
        if (start) dateFilter.$gte = new Date(start); // Convert start to Date
        if (end) dateFilter.$lte = new Date(new Date(end).setHours(23, 59, 59, 999)); // Include the entire day

        // Build the overall filter
        const filter = {
            user: new mongoose.Types.ObjectId(userId), // Use ObjectId for user field
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
        };

        console.log("Filter for deletion:", filter);

        // Delete trades
        const deletedTrades = await Trade.deleteMany(filter);
        console.log("Deleted Trades:", deletedTrades);

        // Delete summaries
        const deletedSummaries = await TradeSummary.deleteMany(filter);
        console.log("Deleted Summaries:", deletedSummaries);

        // Delete orders
        const deletedOrders = await Order.deleteMany(filter);
        console.log("Deleted Orders:", deletedOrders);

        res.json({
            message: "Data deleted successfully",
            deletedTradesCount: deletedTrades.deletedCount,
            deletedSummariesCount: deletedSummaries.deletedCount,
            deletedOrdersCount: deletedOrders.deletedCount,
        });
    } catch (err) {
        console.error("Error deleting data:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
