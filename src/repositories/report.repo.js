const db = require('../config/db');

function create({ productId, reporterUserId, reason }) {
  const stmt = db.prepare(`
    INSERT INTO product_reports (product_id, reporter_user_id, reason)
    VALUES (?, ?, ?)
  `);
  return stmt.run(productId, reporterUserId || null, reason);
}

function findAll() {
  return db.prepare(`
    SELECT r.*,
           p.name AS product_name, p.status AS product_status, p.store_id,
           s.store_name, s.store_slug,
           u.full_name AS reporter_name
    FROM product_reports r
    LEFT JOIN products p ON p.id = r.product_id
    LEFT JOIN stores s ON s.id = p.store_id
    LEFT JOIN users u ON u.id = r.reporter_user_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `).all();
}

function findById(id) {
  return db.prepare(`SELECT * FROM product_reports WHERE id = ?`).get(id);
}

function dismiss(id) {
  return db.prepare(`UPDATE product_reports SET status = 'dismissed' WHERE id = ?`).run(id);
}

function dismissByProduct(productId) {
  return db.prepare(`UPDATE product_reports SET status = 'resolved' WHERE product_id = ?`).run(productId);
}

function countPending() {
  return db.prepare(`SELECT COUNT(*) AS c FROM product_reports WHERE status = 'pending'`).get().c;
}

module.exports = { create, findById, findAll, dismiss, dismissByProduct, countPending };
