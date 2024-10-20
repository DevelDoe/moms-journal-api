const express = require("express");
const Broker = require("../models/Broker");
const auth = require("../middleware/auth"); // Auth middleware
const router = express.Router();

// @route   GET /api/brokers
// @desc    Get all brokers
// @access  Public
router.get("/", async (req, res) => {
	try {
		const brokers = await Broker.find();
		res.json(brokers);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   POST /api/brokers
// @desc    Create a new broker (Admins only)
// @access  Private
router.post("/", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const { name, description, accountTypes } = req.body;

	try {
		const broker = new Broker({ name, description, accountTypes });
		await broker.save();
		res.status(201).json(broker);
	} catch (err) {
		console.error("Error creating broker:", err.message);
		res.status(500).send("Server error");
	}
});

// Update an existing broker
// @route   PUT /api/brokers/:id
// @desc    Update a broker by ID (Admins only)
// @access  Private
router.put("/:id", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const { name, description } = req.body;

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Update broker fields
		broker.name = name || broker.name;
		broker.description = description || broker.description;

		await broker.save();
		res.status(200).json(broker);
	} catch (err) {
		console.error("Error updating broker:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   DELETE /api/brokers/:id
// @desc    Delete a broker (Admins only)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		await broker.remove();
		res.json({ msg: "Broker deleted successfully." });
	} catch (err) {
		console.error("Error deleting broker:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   POST /api/brokers/:id/accounts
// @desc    Add a new account type to a broker (Admins only)
// @access  Private
router.post("/:id/accounts", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const {
		type,
		rate_per_share,
		min_amount,
		max_amount,
		percentage_rate,
		ecn_fees,
		inactivity_fee,
		market_data_fee,
		platform_fee,
		withdrawal_fee,
		extended_hours_trading_fee,
		minimumDeposit,
	} = req.body;

	// Ensure that type is provided as it's required
	if (!type || type.trim() === "") {
		return res.status(400).json({ msg: "Account type is required" });
	}

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Add the new account type to the broker's accountTypes array
		broker.accountTypes.push({
			type: type.trim(),
			rate_per_share: rate_per_share ?? undefined,
			min_amount: min_amount ?? undefined,
			max_amount: max_amount ?? undefined,
			percentage_rate: percentage_rate ?? undefined,
			ecn_fees: ecn_fees ?? undefined,
			inactivity_fee: inactivity_fee ?? undefined,
			market_data_fee: market_data_fee ?? undefined,
			platform_fee: platform_fee ?? undefined,
			withdrawal_fee: withdrawal_fee ?? undefined,
			extended_hours_trading_fee: extended_hours_trading_fee ?? undefined,
			minimumDeposit: minimumDeposit ?? undefined,
		});

		await broker.save();
		res.status(201).json(broker);
	} catch (err) {
		console.error("Error adding account type:", err.message);
		res.status(500).send("Server error");
	}
});

// Update an account type for a broker
// @route   PUT /api/brokers/:id/accounts/:accountType
// @desc    Update an account type for a broker (Admins only)
// @access  Private
router.put("/:id/accounts/:accountType", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const {
		type,
		rate_per_share,
		min_amount,
		max_amount,
		percentage_rate,
		ecn_fees,
		inactivity_fee,
		market_data_fee,
		platform_fee,
		withdrawal_fee,
		extended_hours_trading_fee,
		minimumDeposit,
	} = req.body;

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Find the account to update
		const account = broker.accountTypes.find((account) => account.type === req.params.accountType);
		if (!account) {
			return res.status(404).json({ msg: "Account type not found" });
		}

		// Update account fields
		account.type = type || account.type;
		account.rate_per_share = rate_per_share;
		account.min_amount = min_amount;
		account.max_amount = max_amount;
		account.percentage_rate = percentage_rate;
		account.ecn_fees = ecn_fees;
		account.inactivity_fee = inactivity_fee;
		account.market_data_fee = market_data_fee;
		account.platform_fee = platform_fee;
		account.withdrawal_fee = withdrawal_fee;
		account.extended_hours_trading_fee = extended_hours_trading_fee;
		account.minimumDeposit = minimumDeposit;

		await broker.save();
		res.status(200).json(broker);
	} catch (err) {
		console.error("Error updating account type:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   DELETE /api/brokers/:id/accounts/:accountType
// @desc    Delete an account type from a broker (Admins only)
// @access  Private
router.delete("/:id/accounts/:accountType", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Filter out the account to delete
		broker.accountTypes = broker.accountTypes.filter((account) => account.type !== req.params.accountType);

		await broker.save();
		res.json({ msg: "Account deleted successfully." });
	} catch (err) {
		console.error("Error deleting account:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   GET /api/brokers/account/:accountType
// @desc    Get broker details by account type
// @access  Public (or Private if needed)
router.get("/account/:accountType", async (req, res) => {
	const { accountType } = req.params;

	try {
		// Search for a broker with the specified account type
		const broker = await Broker.findOne({ "accountTypes.type": accountType });

		if (!broker) {
			return res.status(404).json({ msg: "Broker with the specified account type not found" });
		}

		res.json(broker); // Return the broker details
	} catch (err) {
		console.error("Error fetching broker by account type:", err.message);
		res.status(500).send("Server error");
	}
});

module.exports = router;
