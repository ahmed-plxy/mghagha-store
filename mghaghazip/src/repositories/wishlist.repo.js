const db = require('../config/db');

function isInWishlist(userId, productId) {
  return !!db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(userId, productId);
}

function add(userId, productId) {
  if (!isInWishlist(userId, productId)) {
    db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(userId, productId);
  }
}

function remove(userId, productId) {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(userId, productId);
}

function findByUser(userId) {
  return db.prepare(`
    SELECT
      w.id AS wishlist_id,
      p.*,
      s.store_name,
      s.store_slug,
      (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      ) AS image_url
    FROM wishlist w
    JOIN products p ON p.id = w.product_id
    JOIN stores s ON s.id = p.store_id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC, w.id DESC
  `).all(userId);
}

module.exports = { isInWishlist, add, remove, findByUser };
