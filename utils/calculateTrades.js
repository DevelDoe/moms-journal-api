/**
 * This function calculates trades based on the given orders.
 * It detects buy/sell pairs and calculates profits/losses.
 * 
 * @param {Array} orders - The list of orders for trade calculation
 * @returns {Array} - List of calculated trades
 */
function calculateTrades(orders) {
    // Sort orders by date
    orders.sort((a, b) => new Date(a.date) - new Date(b.date));

    const trades = [];
    const positions = {}; // Track positions by symbol 
    
    for (const order of orders) {
        const key = order.symbol; // Use only symbol as the key

        // Initialize position tracking for this symbol/account if it doesn't exist
        if (!positions[key]) {
            positions[key] = {
                avgPrice: 0,
                position: 0,
            };
        }

        const currentPosition = positions[key];

        if (order.side === "buy" || order.side === "BOT") {
            if (currentPosition.position < 0) {
                // Covering a short position
                let quantityToCover = Math.min(-currentPosition.position, order.quantity);
                let remainingQuantity = order.quantity - quantityToCover;

                // Calculate profit/loss for covering shorts
                const profitLoss = (currentPosition.avgPrice - order.price) * quantityToCover;

                trades.push({
                    symbol: order.symbol,
                    quantity: quantityToCover,
                    shortPrice: currentPosition.avgPrice,
                    coverPrice: order.price,
                    side: "short_cover",
                    date: order.date,
                    profitLoss: profitLoss,
                });

                currentPosition.position += quantityToCover;

                if (remainingQuantity > 0) {
                    currentPosition.avgPrice = order.price;
                    currentPosition.position += remainingQuantity;
                }
            } else {
                // Adding to a long position or initiating a new one
                const newTotalQuantity = currentPosition.position + order.quantity;
                currentPosition.avgPrice = (currentPosition.avgPrice * currentPosition.position + order.price * order.quantity) / newTotalQuantity;
                currentPosition.position = newTotalQuantity;
            }
        } else if (order.side === "sell" || order.side === "SLD") {
            if (currentPosition.position > 0) {
                // Selling from a long position
                let quantityToSell = Math.min(currentPosition.position, order.quantity);
                let remainingQuantity = order.quantity - quantityToSell;

                const profitLoss = (order.price - currentPosition.avgPrice) * quantityToSell;

                trades.push({
                    symbol: order.symbol,
                    quantity: quantityToSell,
                    buyPrice: currentPosition.avgPrice,
                    sellPrice: order.price,
                    side: "long_sell",
                    date: order.date,
                    profitLoss: profitLoss,
                });

                currentPosition.position -= quantityToSell;

                if (remainingQuantity > 0) {
                    currentPosition.avgPrice = order.price;
                    currentPosition.position -= remainingQuantity;
                }
            } else {
                // Initiating or adding to a short position
                const newTotalQuantity = currentPosition.position - order.quantity;
                currentPosition.avgPrice = (Math.abs(currentPosition.avgPrice * currentPosition.position) + order.price * order.quantity) / Math.abs(newTotalQuantity);
                currentPosition.position = newTotalQuantity;
            }
        }
    }

    return trades;
}

module.exports = calculateTrades;
