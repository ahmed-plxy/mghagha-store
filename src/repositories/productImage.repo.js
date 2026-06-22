const db = require('../config/db');

function findByProduct(productId) {
  return db.prepare(`
    SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC
  `).all(productId);
}

function findById(id) {
  return db.prepare('SELECT * FROM product_images WHERE id = ?').get(id);
}

function create(productId, imageUrl, sortOrder = 0) {
  const stmt = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)');
  const result = stmt.run(productId, imageUrl, sortOrder);
  return findById(result.lastInsertRowid);
}

function remove(id) {
  db.prepare('DELETE FROM product_images WHERE id = ?').run(id);
}

module.exports = { findByProduct, findById, create, remove };
