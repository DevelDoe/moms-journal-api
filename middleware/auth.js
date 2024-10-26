const jwt = require("jsonwebtoken");
const User = require("../models/User");  // Import User model for role check

// Middleware to protect routes
module.exports = async function (req, res, next) {
    // Get the token from the header
    const token = req.header("Authorization");

    // Check if no token is provided
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }
    try {
        // Verify and decode the token (split "Bearer" prefix if present)
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;  // Attach the decoded token data to req.user

        // Fetch the user from the database using the decoded ID
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        req.user = user;  // Attach full user data to request

        next();  // Proceed to the next middleware or route handler
    } catch (err) {
        console.error("Auth error:", err);

        // Check for specific token expiration error
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired", expiredAt: err.expiredAt });
        }

        // Generic server error response for other issues
        return res.status(500).json({ msg: 'Server Error' });
    }
};
