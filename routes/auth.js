// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
	const { name, email, password } = req.body;

	try {
		// Check if the user already exists
		let user = await User.findOne({ email });
		if (user) {
			return res.status(400).json({ message: "User already exists" });
		}

		// Create a new user
		user = new User({ name, email, password });
		await user.save();

		// Create and return a JWT
		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});
		res.json({
			token,
			user: { id: user._id, name: user.name, email: user.email },
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error");
	}
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Check if the password is correct
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Return a JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

  // Protected route: Get the authenticated user's profile
router.get('/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password'); // Exclude password from the response
      res.json(user);
    } catch (err) {
      res.status(500).send('Server error');
    }
  });

  module.exports = router;