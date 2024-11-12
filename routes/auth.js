const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Utility functions to generate tokens
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" }); // Short expiration for access token
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" }); // Longer expiration for refresh token
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create a new user
        user = new User({ name, email, password });
        await user.save();

        // Generate JWT token
        const token = generateToken(user);
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
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store the refresh token in the database
        user.refreshToken = refreshToken;
        await user.save();

        // Send tokens to client
        res.json({
            accessToken,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, accounts: user.accounts },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Generate a new access token using a valid refresh token
// @access  Public
router.post("/refresh-token", async (req, res) => {
    const { refreshToken } = req.body;

    // Check if refresh token is provided
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Find the user associated with this token
        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("Error during token refresh:", err);
        return res.status(403).json({ message: "Refresh token expired or invalid" });
    }
});

module.exports = router;
