const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TradeSummarySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    accountId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',  // Assuming you have an Account model
        required: true,
    },
    date: {
        type: String, // Using "YYYY-MM-DD" format for filtering
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
