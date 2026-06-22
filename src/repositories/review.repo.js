const db = require('../config/db');

function findById(id) {
  return db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
}

function findByUserProductOrder(userId, productId, orderId) {
  return db.prepare(`
    SELECT *
    FROM reviews
    WHERE user_id = ? AND product_id = ? AND order_id = ?
  `).get(userId, productId, orderId);
}

function recalculateStoreRating(productId) {
  const product = db.prepare('SELECT store_id FROM products WHERE id = ?').get(productId);
  if (!product) return;

  const row = db.prepare(`
    SELECT AVG(r.rating) AS avgRating
    FROM reviews r
    JOIN products p ON p.id = r.product_id
    WHERE p.store_id = ? AND r.status = 'approved'
  `).get(product.store_id);

  const avg = row && row.avgRating ? Math.round(row.avgRating * 10) / 10 : 0;
  db.prepare('UPDATE stores SET rating_average = ? WHERE id = ?').run(avg, product.store_id);
}

function create({ userId, productId, orderId, rating, comment }) {
  const stmt = db.prepare(`
    INSERT INTO reviews (user_id, product_id, order_id, rating, comment, status)
    VALUES (?, ?, ?, ?, ?, 'approved')
  `);
  const result = stmt.run(userId, productId, orderId, rating, comment || null);
  recalculateStoreRating(productId);
  return findById(result.lastInsertRowid);
}

function findApprovedByProduct(productId) {
  return db.prepare(`
    SELECT r.*, u.full_name AS reviewer_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ? AND r.status = 'approved'
    ORDER BY r.created_at DESC, r.id DESC
  `).all(productId);
}

function findAllForAdmin(status) {
  let query = `
    SELECT r.*, u.full_name AS reviewer_name, p.name AS product_name, p.store_id
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN products p ON p.id = r.product_id
  `;
  const params = [];

  if (status) {
    query += ' WHERE r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.created_at DESC, r.id DESC';
  return db.prepare(query).all(...params);
}

function setStatus(id, status) {
  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);
  const review = findById(id);
  if (review) recalculateStoreRating(review.product_id);
}

module.exports = { findById, findByUserProductOrder, create, findApprovedByProduct, findAllForAdmin, setStatus };
