/**
 * This function calculates trades based on the given orders.
 * It detects buy/sell pairs and calculates profits/losses and hold times for each completed trade.
 *
 * @param {Array} orders - The list of orders for trade calculation
 * @param {String} accountId - The ID of the account associated with these orders
 * @returns {Array} - List of calculated trades
 */
function calculateTrades(orders, accountId) {
    // Sort orders by date
    orders.sort((a, b) => new Date(a.date) - new Date(b.date));

    const trades = [];
    const positions = {};

    for (const order of orders) {
        const key = order.symbol;

        if (!positions[key]) {
            positions[key] = {
                avgPrice: 0,
                position: 0,
                startDate: null,
            };
        }

        const currentPosition = positions[key];

        if (order.side.toLowerCase() === "buy" || order.side === "BOT") {
            if (currentPosition.position < 0) {
                let quantityToCover = Math.min(-currentPosition.position, order.quantity);
                let remainingQuantity = order.quantity - quantityToCover;

                const profitLoss = (currentPosition.avgPrice - order.price) * quantityToCover;
                const holdTime = currentPosition.startDate
                    ? (new Date(order.date) - new Date(currentPosition.startDate)) / (1000 * 60)
                    : null;

                trades.push({
                    accountId,
                    symbol: order.symbol,
                    quantity: quantityToCover,
                    shortPrice: currentPosition.avgPrice,
                    coverPrice: order.price,
                    side: "short_cover",
                    date: order.date,
                    profitLoss: profitLoss,
                    holdTime: holdTime ? holdTime.toFixed(2) : null,
                });

                currentPosition.position += quantityToCover;

                if (remainingQuantity > 0) {
                    currentPosition.avgPrice = order.price;
                    currentPosition.position += remainingQuantity;
                    currentPosition.startDate = order.date;
                } else {
                    currentPosition.startDate = null;
                }
            } else {
                const newTotalQuantity = currentPosition.position + order.quantity;
                currentPosition.avgPrice =
                    (currentPosition.avgPrice * currentPosition.position + order.price * order.quantity) / newTotalQuantity;

                currentPosition.position = newTotalQuantity;
                if (!currentPosition.startDate) {
                    currentPosition.startDate = order.date;
                }
            }
        } else if (order.side.toLowerCase() === "sell" || order.side === "SLD") {
            if (currentPosition.position > 0) {
                let quantityToSell = Math.min(currentPosition.position, order.quantity);
                let remainingQuantity = order.quantity - quantityToSell;

                const profitLoss = (order.price - currentPosition.avgPrice) * quantityToSell;
                const holdTime = currentPosition.startDate
                    ? (new Date(order.date) - new Date(currentPosition.startDate)) / (1000 * 60)
                    : null;

                trades.push({
                    accountId,
                    symbol: order.symbol,
                    quantity: quantityToSell,
                    buyPrice: currentPosition.avgPrice,
                    sellPrice: order.price,
                    side: "long_sell",
                    date: order.date,
                    profitLoss: profitLoss,
                    holdTime: holdTime ? holdTime.toFixed(2) : null,
                });

                currentPosition.position -= quantityToSell;

                if (remainingQuantity > 0) {
                    currentPosition.avgPrice = order.price;
                    currentPosition.position -= remainingQuantity;
                    currentPosition.startDate = order.date;
                } else {
                    currentPosition.startDate = null;
                }
            }
        }
    }

    return trades;
}


module.exports = calculateTrades;
