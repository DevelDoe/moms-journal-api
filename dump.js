/**
 * This function calculates trades based on the given orders.
 * It detects buy/sell pairs and calculates profits/losses for each completed trade.
 *
 * @param {Array} orders - The list of orders for trade calculation
 * @param {String} accountId - The ID of the account associated with these orders
 * @returns {Array} - List of calculated trades
 */
function calculateTrades(orders, accountId) {
	// Sort orders by date to ensure trades are calculated in the correct sequence
	orders.sort((a, b) => new Date(a.date) - new Date(b.date));

	const trades = []; // Array to hold calculated trade details
	const positions = {}; // Track positions by symbol to calculate P&L accurately

	for (const order of orders) {
		const key = order.symbol; // Use the symbol as the unique key to track each position

		// Initialize tracking for each new symbol if it doesn't already exist
		if (!positions[key]) {
			positions[key] = {
				avgPrice: 0, // Average price of the current position
				position: 0, // Quantity of shares in the current position
			};
		}

		const currentPosition = positions[key]; // Reference to the current position data for the symbol

		// Handle Buy or BOT orders (Opening or adding to a long position, or covering a short)
		if (order.side.toLowerCase() === "buy" || order.side === "BOT") {
			if (currentPosition.position < 0) {
				// Case: Covering a short position (current position is negative)
				let quantityToCover = Math.min(-currentPosition.position, order.quantity); // Cover as much as available
				let remainingQuantity = order.quantity - quantityToCover;

				// Calculate profit/loss for covering shorts
				const profitLoss = (currentPosition.avgPrice - order.price) * quantityToCover;

				// Record the trade details for short covering
				trades.push({
					accountId,  // Associate trade with account
					symbol: order.symbol,
					quantity: quantityToCover,
					shortPrice: currentPosition.avgPrice,
					coverPrice: order.price,
					side: "short_cover",
					date: order.date,
					profitLoss: profitLoss,
				});

				// Update the position by reducing the short position
				currentPosition.position += quantityToCover;

				// If there's remaining quantity in the buy order, establish or add to a new long position
				if (remainingQuantity > 0) {
					currentPosition.avgPrice = order.price;
					currentPosition.position += remainingQuantity;
				}
			} else {
				// Case: Adding to an existing long position or creating a new one
				const newTotalQuantity = currentPosition.position + order.quantity;

				// Calculate the new average price of the long position
				currentPosition.avgPrice = (currentPosition.avgPrice * currentPosition.position + order.price * order.quantity) / newTotalQuantity;

				// Update the position quantity
				currentPosition.position = newTotalQuantity;
			}
		}
		// Handle Sell or SLD orders (Selling from a long position or initiating/adding to a short position)
		else if (order.side.toLowerCase() === "sell" || order.side === "SLD") {
			if (currentPosition.position > 0) {
				// Case: Selling from an existing long position
				let quantityToSell = Math.min(currentPosition.position, order.quantity); // Sell as much as available
				let remainingQuantity = order.quantity - quantityToSell;

				// Calculate profit/loss for selling from the long position
                const profitLoss = Number(((order.price - currentPosition.avgPrice) * quantityToSell).toFixed(2));

				// Record the trade details for long sell
				trades.push({
					accountId,  // Associate trade with account
					symbol: order.symbol,
					quantity: quantityToSell,
					buyPrice: currentPosition.avgPrice,
					sellPrice: order.price,
					side: "long_sell",
					date: order.date,
					profitLoss: profitLoss,
				});

				// Update the position by reducing the long position
				currentPosition.position -= quantityToSell;

				// If there's remaining quantity in the sell order, initiate a short position
				if (remainingQuantity > 0) {
					currentPosition.avgPrice = order.price;
					currentPosition.position -= remainingQuantity;
				}
			} else {
				// Case: Initiating or adding to a short position (current position is zero or negative)
				const newTotalQuantity = currentPosition.position - order.quantity;

				// Calculate the new average price of the short position
				currentPosition.avgPrice =
					(Math.abs(currentPosition.avgPrice * currentPosition.position) + order.price * order.quantity) / Math.abs(newTotalQuantity);

				// Update the position to reflect the increased short position
				currentPosition.position = newTotalQuantity;
			}
		}
	}

	// Return the array of completed trades with profit/loss details
	return trades;
}

module.exports = calculateTrades;
