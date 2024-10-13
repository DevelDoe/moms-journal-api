// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const orderRoutes = require('./routes/order');

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
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB connected"))
	.catch((err) => console.error(err));

    
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes); // Use the order routes    

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
