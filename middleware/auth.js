// /middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import User model for role check

module.exports = async function (req, res, next) {
    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
        console.log("JWT_SECRET value in auth middleware:", process.env.JWT_SECRET);
        console.error("Error: Missing JWT_SECRET in environment variables.");
        return res.status(500).json({ msg: "Server configuration error" });
    }

    // Get the token from the header
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Extract token part after "Bearer"
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Token format is invalid" });
    }

    try {
        
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Fetch the user from the database using the decoded ID
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Attach the full user document to req.user
        req.user = user;

        next();
    } catch (err) {
        console.error("Auth error:", err);

        // Handle specific token expiration error
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired. Please log in again.",
                expiredAt: err.expiredAt,
            });
        }

        // General error for other token issues
        return res.status(401).json({ msg: "Token is invalid or expired" });
    }
};
