const db = require('../config/db');

/**
 * Atomically decrements stock only if enough is available.
 * Returns true if the decrement succeeded, false if stock was insufficient
 * or the product is no longer active. Must be called inside a db.transaction.
 */
function decrementStockIfAvailable(productId, amount) {
  const result = db.prepare(`
    UPDATE products
    SET quantity = quantity - ?
    WHERE id = ? AND quantity >= ? AND status = 'active'
  `).run(amount, productId, amount);
  return result.changes === 1;
}

module.exports = { decrementStockIfAvailable };
