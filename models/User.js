// models/User.js

const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

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
	tax_rate: {
		type: Number,
		default: 0,
		min: 0,
		max: 100,
	},
	accounts: [
		{
			type: { type: String, required: true },
			number: { type: String, required: true },
			balance: { type: Number, default: 0 },
		},
	],
	broker: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Broker",
	},
	role: {
		type: String,
		enum: ["user", "admin"],
		default: "user", // Default role is 'user'
	},
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
