// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // User model for checking/creating the root user

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ROOT_ADMIN_EMAIL = "admin@example.com";
const ROOT_ADMIN_PASSWORD = "password123"; // Hardcoded root password for initial setup

// Middleware
app.use(cors({ origin: "http://localhost:8080" })); // Allow only this origin
app.use(express.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose
	.connect(process.env.MONGO_URI, { autoIndex: true })
	.then(() => {
		console.log("MongoDB connected");

		// Only create root admin in development
		if (process.env.NODE_ENV === "development") {
			createRootAdmin();
		} else {
			// Ensure the root admin doesn't exist in production
			removeRootAdminInProduction();
		}
	})
	.catch((err) => console.error(err));

// Function to create root admin in development
async function createRootAdmin() {
	try {
	  const admin = await User.findOne({ email: ROOT_ADMIN_EMAIL });
	  if (!admin) {
		console.log("No admin found, creating root admin...");
  
		const rootAdmin = new User({
		  name: "Root Admin",
		  email: ROOT_ADMIN_EMAIL,
		  password: ROOT_ADMIN_PASSWORD, // Store the plaintext password; it will be hashed by the pre-save middleware
		  role: "admin",
		});
  
		await rootAdmin.save();
		console.log(
		  "Root admin created with email 'admin@example.com' and password 'password123'. Please change the credentials!"
		);
	  } else {
		console.log("Admin already exists.");
	  }
	} catch (err) {
	  console.error("Error creating root admin:", err);
	}
  }

// Function to delete root admin in production
async function removeRootAdminInProduction() {
	try {
	  // Find the root admin user with matching email
	  const rootAdmin = await User.findOne({ email: ROOT_ADMIN_EMAIL });
  
	  if (rootAdmin) {
		const isMatch = await bcrypt.compare(ROOT_ADMIN_PASSWORD, rootAdmin.password);
		if (isMatch) {
		  await User.deleteOne({ _id: rootAdmin._id });
		  console.log("Root admin deleted from production environment.");
		} else {
		  console.log("Root admin with matching credentials not found.");
		}
	  }
	} catch (err) {
	  console.error("Error deleting root admin in production:", err);
	}
  }

const VERBOSE = process.argv.includes('-v');
if (VERBOSE) {
  console.log("Verbose mode enabled");
}

// Add additional logs if needed
if (VERBOSE) {
  app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Routes and other middleware
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const ordersRoutes = require("./routes/orders");
const brokerRoutes = require("./routes/brokers");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/brokers", brokerRoutes);

// Add this middleware to log unhandled errors
app.use((err, req, res, next) => {
	console.error("Unhandled server error:", err);
	res.status(500).json({ msg: "Unhandled server error" });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
