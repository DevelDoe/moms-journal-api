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

// @route   PUT /api/brokers/:id
// @desc    Update an existing broker (Admins only)
// @access  Private
router.put("/:id", auth, async (req, res) => {
	if (req.user.role !== "admin") {
		return res.status(403).json({ msg: "Access denied: Admins only." });
	}

	const { name, description, accountTypes, platforms } = req.body;

	try {
		// Find the broker by ID
		let broker = await Broker.findById(req.params.id);
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Update the broker's fields
		if (name) broker.name = name;
		if (description) broker.description = description;
		if (accountTypes) broker.accountTypes = accountTypes;
		if (platforms) broker.platforms = platforms;

		// Save the updated broker
		await broker.save();

		res.json({ msg: "Broker updated successfully", broker });
	} catch (err) {
		console.error("Error updating broker:", err.message);
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
		// Find the broker by ID and delete it
		const broker = await Broker.findByIdAndDelete(req.params.id);

		// If broker not found
		if (!broker) {
			return res.status(404).json({ msg: "Broker not found" });
		}

		// Return success message after deletion
		res.json({ msg: "Broker deleted successfully." });
	} catch (err) {
		console.error("Error deleting broker:", err.message);
		res.status(500).send("Server error");
	}
});



// @route   GET /api/brokers/account/:accountType
// @desc    Get broker details by account type
// @access  Public
router.get("/account/:accountType", async (req, res) => {
	const { accountType } = req.params;

	try {
		const broker = await Broker.findOne({ "accountTypes.type": accountType });

		if (!broker) {
			return res.status(404).json({ msg: "Broker with the specified account type not found" });
		}

		res.json(broker); 
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

		const brokers = await Broker.find();
		const account = brokers
			.flatMap((broker) => broker.accountTypes)
			.find((account) => account._id.toString() === accountId);

		if (!account) {
			return res.status(404).json({ msg: "Account not found" });
		}

		res.json(account); 
	} catch (err) {
		console.error("Error fetching account specifications:", err.message);
		res.status(500).send("Server error");
	}
});

module.exports = router;
