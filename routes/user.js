const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
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

		// Save the updated user to the database
		await user.save();

		res.json(user); // Return the updated user data
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

module.exports = router;
