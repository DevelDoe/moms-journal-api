const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const Broker = require("../models/Broker");
const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get the authenticated user's profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   PUT /api/auth/update-profile
// @desc    Update user's profile information
// @access  Private
router.put("/update-profile", auth, async (req, res) => {
	const { tax, commission, commission_min, commission_max } = req.body;

	try {
		// Find the user by ID
		let user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Update the user's profile fields
		user.tax_rate = tax || user.tax_rate;
		user.commission_rate = commission || user.commission_rate;
		user.commission_min = commission_min || user.commission_min;
		user.commission_max = commission_max || user.commission_max;

		// Save the updated user to the database
		await user.save();

		res.json(user); // Return the updated user data
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   GET /api/user/accounts
// @desc    Get all accounts for the authenticated user
// @access  Private
router.get("/accounts", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("accounts");
		res.json(user.accounts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   POST /api/user/add-account
// @desc    Add a new account to the authenticated user's profile
// @access  Private
router.post("/add-account", auth, async (req, res) => {
    const { type, number, balance, brokerId, accountId } = req.body;

    try {
        // Fetch the user based on the authenticated token
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Ensure required fields are present
        if (!brokerId || !accountId || !number) {
            return res.status(400).json({ msg: "Broker ID, Account ID, and Account Number are required." });
        }

        // Fetch the broker to get account specifications
        const broker = await Broker.findById(brokerId);
        if (!broker) {
            return res.status(404).json({ msg: "Broker not found" });
        }

        // Find the account type specifications based on accountId
        const accountTypeDetails = broker.accountTypes.find((accountType) => accountType._id.toString() === accountId);
        if (!accountTypeDetails) {
            return res.status(404).json({ msg: "Account type not found in the broker." });
        }

        // Construct the new account object with specifications
        const newAccount = {
            type: accountTypeDetails.type, // Using account type name from specifications
            number, // Account number
            balance: balance || 0, // Account balance, default to 0 if not provided
            broker: brokerId, // Broker ID reference
            accountId, // Include account ID for reference
            specifications: accountTypeDetails // Include specifications
        };

        // Check if the user already has this account number to avoid duplicates
        const accountExists = user.accounts.some(account => account.number === newAccount.number);
        if (accountExists) {
            return res.status(400).json({ msg: "An account with this number already exists." });
        }

        // Push new account to user's accounts
        user.accounts.push(newAccount);

        // Save the updated user with the new account
        await user.save(); // Save updated user

        // Return the newly added account object
        res.status(201).json(newAccount);
    } catch (err) {
        console.error("Error adding account:", err.message);
        res.status(500).send("Server error");
    }
});




 

// @route   DELETE /api/user/remove-account/:accountId
// @desc    Remove an account from the user's profile by account ID
// @access  Private
router.delete("/remove-account/:accountId", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Check if the account with the given _id exists
        const accountExists = user.accounts.some((acc) => acc._id.toString() === req.params.accountId);
        if (!accountExists) {
            return res.status(400).json({ msg: "Account not found" });
        }

        // Filter out the account to be removed by _id
        user.accounts = user.accounts.filter((acc) => acc._id.toString() !== req.params.accountId);

        await user.save();
        res.json(user); // Return updated user data
    } catch (err) {
        console.error("Error removing account:", err.message);
        res.status(500).send("Server error");
    }
});


module.exports = router;
