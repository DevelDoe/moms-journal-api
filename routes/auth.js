const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Utility functions to generate tokens
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "5m" }); // Short expiration for access token
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7h" }); // Longer expiration for refresh token
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

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Set the refresh token in an HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            accessToken,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (err) {
        console.error("Registration error:", err.message);
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

        // Set the refresh token in an HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Send access token and user data
        res.json({
            accessToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, accounts: user.accounts },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   POST /api/auth/refresh-token
// @desc    Generate a new access token using a valid refresh token
// @access  Public
router.post("/refresh-token", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    console.log("Received refresh token request. Cookies:", req.cookies);

    if (!refreshToken) {
        console.log("No refresh token provided.");
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log("Decoded refresh token:", decoded);

        const user = await User.findById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            console.log("Invalid refresh token for user:", user);
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log("New access token issued:", newAccessToken);
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error("Error during token refresh:", err.message);
        return res.status(403).json({ message: "Refresh token expired or invalid" });
    }
});



// @route   POST /api/auth/logout
// @desc    Log the user out and invalidate refresh token
// @access  Private
router.post("/logout", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null; // Remove refresh token
            await user.save();
        }

        // Clear the refresh token cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
        });

        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Error during logout:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});


// @route   GET /api/user/profile
// @desc    Fetch user profile
// @access  Private
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -refreshToken");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error("Error fetching profile:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});


module.exports = router;
