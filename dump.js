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

// @route   GET /api/brokers/:id
// @desc    Get a broker by ID
// @access  Public
router.get("/:id", async (req, res) => {
	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}
		res.json(broker);
	} catch (err) {
		console.error("Error fetching broker by ID:", err.message);
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
		ecn_routes, // Array of ECN routes { name, fees, extended_fees }
		inactivity_fee,
		market_data_fee,
		withdrawal_fee,
		minimumDeposit,
		leverage,
		regulatory_fee,
		overnight_fee,
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
			ecn_routes: ecn_routes ?? [], // Store ECN routes array
			inactivity_fee: inactivity_fee ?? undefined,
			market_data_fee: market_data_fee ?? undefined,
			withdrawal_fee: withdrawal_fee ?? undefined,
			minimumDeposit: minimumDeposit ?? undefined,
			leverage: leverage ?? undefined,
			regulatory_fee: regulatory_fee ?? undefined,
			overnight_fee: overnight_fee ?? undefined,
		});

		await broker.save();
		res.status(201).json(broker);
	} catch (err) {
		console.error("Error adding account type:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   PUT /api/brokers/:id/accounts/:accountId
// @desc    Update an account type for a broker (Admins only)
// @access  Private
router.put("/:id/accounts/:accountId", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const {
		type,
		rate_per_share,
		min_amount,
		max_amount,
		percentage_rate,
		ecn_routes, // Array of ECN routes { name, fees, extended_fees }
		inactivity_fee,
		market_data_fee,
		withdrawal_fee,
		minimumDeposit,
		leverage,
		regulatory_fee,
		overnight_fee,
	} = req.body;

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Find the account by its unique ID, not by type
		const account = broker.accountTypes.id(req.params.accountId);
		if (!account) {
			return res.status(404).json({ msg: "Account not found" });
		}

		// Update the account fields
		account.type = type || account.type;
		account.rate_per_share = rate_per_share ?? account.rate_per_share;
		account.min_amount = min_amount ?? account.min_amount;
		account.max_amount = max_amount ?? account.max_amount;
		account.percentage_rate = percentage_rate ?? account.percentage_rate;
		account.inactivity_fee = inactivity_fee ?? account.inactivity_fee;
		account.market_data_fee = market_data_fee ?? account.market_data_fee;
		account.withdrawal_fee = withdrawal_fee ?? account.withdrawal_fee;
		account.minimumDeposit = minimumDeposit ?? account.minimumDeposit;
		account.leverage = leverage ?? account.leverage;
		account.regulatory_fee = regulatory_fee ?? account.regulatory_fee;
		account.overnight_fee = overnight_fee ?? account.overnight_fee;

		// Update ECN routes if provided
		if (ecn_routes) {
			account.ecn_routes = ecn_routes; // Overwrite the ECN routes array with the new one
		}

		// Save the updated broker with the modified account
		await broker.save();
		res.status(200).json(broker);
	} catch (err) {
		console.error("Error updating account:", err.message);
		res.status(500).send("Server error");
	}
});


// @route   DELETE /api/brokers/:id/accounts/:accountId
// @desc    Delete an account type from a broker by account _id (Admins only)
// @access  Private
router.delete("/:id/accounts/:accountId", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Filter out the account to delete by _id
		broker.accountTypes = broker.accountTypes.filter((account) => account._id.toString() !== req.params.accountId);

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

// @route   GET /api/brokers/accounts/:accountId
// @desc    Get account specifications by account ID
// @access  Public
router.get("/accounts/:accountId", async (req, res) => {
	try {
		const { accountId } = req.params;

		// Fetch all brokers to find the account
		const brokers = await Broker.find();
		const account = brokers
			.flatMap((broker) => broker.accountTypes) // Flatten the array of account types
			.find((account) => account._id.toString() === accountId); // Find the account by ID

		if (!account) {
			return res.status(404).json({ msg: "Account not found" });
		}

		res.json(account); // Return the account specifications
	} catch (err) {
		console.error("Error fetching account specifications:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   GET /api/brokers/accounts/:accountId
// @desc    Get account specifications by account ID
// @access  Public
router.get("/accounts/:accountId", async (req, res) => {
	try {
		const { accountId } = req.params;

		// Fetch all brokers to find the account
		const brokers = await Broker.find();
		const account = brokers
			.flatMap((broker) => broker.accountTypes) // Flatten the array of account types
			.find((account) => account._id.toString() === accountId); // Find the account by ID

		if (!account) {
			return res.status(404).json({ msg: "Account not found" });
		}

		res.json(account); // Return the account specifications
	} catch (err) {
		console.error("Error fetching account specifications:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   POST /api/brokers/:id/platforms
// @desc    Add platform-specific market data to a broker (Admins only)
// @access  Private
router.post("/:id/platforms", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const { platform_name, market_data } = req.body;

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Add the new platform with market data
		broker.platforms.push({
			platform_name,
			market_data,
		});

		await broker.save();
		res.status(201).json(broker);
	} catch (err) {
		console.error("Error adding platform market data:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   PUT /api/brokers/:id/platforms/:platformId
// @desc    Update platform-specific market data for a broker (Admins only)
// @access  Private
router.put("/:id/platforms/:platformId", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const { platform_name, market_data } = req.body;

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Find the platform by its unique ID
		const platform = broker.platforms.id(req.params.platformId);
		if (!platform) {
			return res.status(404).json({ msg: "Platform not found" });
		}

		// Update platform name and market data
		platform.platform_name = platform_name || platform.platform_name;
		platform.market_data = market_data || platform.market_data;

		// Save the updated broker with the modified platform
		await broker.save();
		res.status(200).json(broker);
	} catch (err) {
		console.error("Error updating platform market data:", err.message);
		res.status(500).send("Server error");
	}
});

// @route   DELETE /api/brokers/:id/platforms/:platformId
// @desc    Delete platform-specific market data for a broker (Admins only)
// @access  Private
router.delete("/:id/platforms/:platformId", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	try {
		const broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Find the platform by its unique ID and remove it
		const platform = broker.platforms.id(req.params.platformId);
		if (!platform) {
			return res.status(404).json({ msg: "Platform not found" });
		}

		platform.remove(); // Mongoose method to remove embedded sub-document

		// Save the updated broker without the removed platform
		await broker.save();
		res.status(200).json({ msg: "Platform deleted", broker });
	} catch (err) {
		console.error("Error deleting platform market data:", err.message);
		res.status(500).send("Server error");
	}
});


module.exports = router;
