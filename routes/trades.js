const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const auth = require('../middleware/auth');
const TradeSummary = require("../models/TradeSummary");

// @route   GET /api/trades
// @desc    Get all trades for the authenticated user, optionally filtered by date range
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { start, end } = req.query;

        // Build the date range filter if start or end dates are provided
        let dateFilter = {};
        if (start) dateFilter.$gte = new Date(start); // Inclusive start date
        if (end) dateFilter.$lte = new Date(end); // Inclusive end date

        // Construct the filter object with optional date filtering
        const filter = {
            user: req.user.id,
            ...(start || end ? { date: dateFilter } : {}), // Apply date filter only if start or end is present
        };

        // Fetch trades with the filter applied
        const trades = await Trade.find(filter).sort({ date: -1 });

        // If no trades are found, return a message
        if (!trades || trades.length === 0) {
            return res.status(404).json({ msg: 'No trades found within the specified date range.' });
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
router.get('/historical', auth, async (req, res) => {
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


module.exports = router;
