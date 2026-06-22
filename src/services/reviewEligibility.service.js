const db = require('../config/db');

/**
 * Returns the most recent delivered order containing this product for this
 * user, provided no review already exists for that exact (user, product, order)
 * combination. Returns undefined if the customer isn't eligible to review.
 */
function getEligibleOrderForReview(userId, productId) {
  return db.prepare(`
    SELECT o.id AS order_id
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ?
      AND oi.product_id = ?
      AND o.order_status = 'delivered'
      AND NOT EXISTS (
        SELECT 1
        FROM reviews r
        WHERE r.user_id = ?
          AND r.product_id = ?
          AND r.order_id = o.id
      )
    ORDER BY o.created_at DESC, o.id DESC
    LIMIT 1
  `).get(userId, productId, userId, productId);
}

module.exports = { getEligibleOrderForReview };
