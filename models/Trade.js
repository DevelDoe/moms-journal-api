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
        required: true,
        enum: ['BUY', 'SELL', 'BOT', 'SLD', 'long_sell', 'short_cover'], // Add all valid side options here
    },
    quantity: {
        type: Number,
        required: true
    },
    buyPrice: {
        type: Number,
        default: null  // Default to null if value is calculated later
    },
    sellPrice: {
        type: Number,
        default: null
    },
    shortPrice: {
        type: Number,
        default: null
    },
    coverPrice: {
        type: Number,
        default: null
    },
    profitLoss: {
        type: Number,
        default: null
    },
    date: {
        type: Date,
        required: true
    }
}, { timestamps: true });  // Automatically add `createdAt` and `updatedAt` fields

// Index for performance optimization when querying by user, symbol, or date
TradeSchema.index({ user: 1, symbol: 1, date: -1 });

module.exports = mongoose.model('Trade', TradeSchema);
