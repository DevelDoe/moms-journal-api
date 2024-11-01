// models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the Account schema as an embedded subdocument
const AccountSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ["live", "paper"],
		required: true,
	},
});

// Define the User schema
const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		unique: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: true,
	},
	role: {
		type: String,
		enum: ["user", "admin"],
		default: "user", // Default role is 'user'
	},
	accounts: [AccountSchema], // Array of accounts
});

UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) {
		return next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
