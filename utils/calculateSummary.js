// utils/calculateSummary.js

const moment = require('moment');

// Helper function to calculate the trade summary
function calculateSummary(trades) {
    const tradesByDate = trades.reduce((acc, trade) => {
        const tradeDate = moment(trade.date).format('YYYY-MM-DD');
        if (!acc[tradeDate]) acc[tradeDate] = [];
        acc[tradeDate].push(trade);
        return acc;
    }, {});

    const summaries = [];

    for (const [tradeDate, tradesForDate] of Object.entries(tradesByDate)) {
        const totalTrades = tradesForDate.length;
        const wins = tradesForDate.filter(trade => trade.profitLoss > 0).length;
        const losses = tradesForDate.filter(trade => trade.profitLoss < 0).length;
        const totalProfitLoss = tradesForDate.reduce((total, trade) => total + trade.profitLoss, 0);
        const totalProfit = tradesForDate.filter(trade => trade.profitLoss > 0).reduce((sum, trade) => sum + trade.profitLoss, 0);
        const totalLoss = tradesForDate.filter(trade => trade.profitLoss < 0).reduce((sum, trade) => sum + Math.abs(trade.profitLoss), 0);
        const accuracy = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const profitToLossRatio = totalLoss > 0 ? (totalProfit / totalLoss) : 'Infinity';

        summaries.push({
            date: tradeDate,
            totalProfitLoss,
            accuracy,
            profitToLossRatio,
            totalTrades,
            wins,
            losses,
        });
    }

    return summaries;
}

module.exports = calculateSummary;
