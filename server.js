// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/order");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
	cors({
		origin: "http://localhost:8080", // Allow only this origin
	})
);

// Middleware
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose
	.connect(process.env.MONGO_URI, {
		autoIndex: true, // This ensures indexes are created automatically
	})
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error(err));

mongoose.connection.on("open", () => {
	console.log("Connected to database:", mongoose.connection.name);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes); // Use the order routes
app.use(express.static(path.join(__dirname, "dist"))); // Serve static files from the "dist" directory
app.get("*", (req, res) => {
	F;
	res.sendFile(path.join(__dirname, "dist", "index.html"));
	// Handle client-side routing, return the index.html file for all other routes
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
