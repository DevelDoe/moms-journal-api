// middleware/auth.js
const jwt = require("jsonwebtoken");

// Middleware to protect routes
module.exports = function (req, res, next) {
	// Get the token from the header
	const token = req.header("Authorization");

	// Check if no token
	if (!token) {
		return res
			.status(401)
			.json({ message: "No token, authorization denied" });
	}

	// Verify token
	try {
		const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
		req.user = decoded; // Attach the decoded user to the request object
		next(); // Proceed to the next middleware or route handler
	} catch (err) {
		res.status(401).json({ message: "Token is not valid" });
	}
};
