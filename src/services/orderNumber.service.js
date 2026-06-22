const db = require('../config/db');

/**
 * Generates a per-store order number in the format ORD-YYYYMMDD-XXXX.
 * Sequence resets daily per store. Must be called inside the same
 * transaction as the order insert to keep the count consistent.
 */
function generateOrderNumber(storeId) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  let sequence = db.prepare(`
    SELECT COUNT(*) AS c FROM orders WHERE store_id = ? AND date(created_at) = date('now')
  `).get(storeId).c + 1;

  let candidate = `ORD-${datePart}-${String(sequence).padStart(4, '0')}`;

  while (db.prepare('SELECT id FROM orders WHERE store_id = ? AND order_number = ?').get(storeId, candidate)) {
    sequence += 1;
    candidate = `ORD-${datePart}-${String(sequence).padStart(4, '0')}`;
  }

  return candidate;
}

module.exports = { generateOrderNumber };
