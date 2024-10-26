const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    side: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    buyPrice: Number,
    sellPrice: Number,
    shortPrice: Number,
    coverPrice: Number,
    profitLoss: Number,
    date: {
        type: Date,
        required: true
    },
    accountNr: { // New field for the account number
        type: String, // Keep this as a string for account number representation
        required: true,
    }
});

module.exports = mongoose.model('Trade', TradeSchema);
