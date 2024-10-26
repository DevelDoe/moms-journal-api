const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeSummarySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    date: {
        type: String, // We will use a string in the format "YYYY-MM-DD" for easy filtering
        required: true,
    },
    totalProfitLoss: {
        type: Number,
        required: true,
    },
    accuracy: {
        type: Number,
        required: true,
    },
    profitToLossRatio: {
        type: Number,
        required: true,
    },
    totalTrades: {
        type: Number,
        required: true,
    },
    wins: {
        type: Number,
        required: true,
    },
    losses: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model('TradeSummary', TradeSummarySchema);