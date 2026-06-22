const db = require('../config/db');

function findAll() {
  return db.prepare('SELECT * FROM banners ORDER BY sort_order ASC, id ASC').all();
}

function findActive() {
  return db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
}

function create({ imageUrl, title, linkUrl, sortOrder }) {
  const result = db.prepare(
    'INSERT INTO banners (image_url, title, link_url, sort_order) VALUES (?, ?, ?, ?)'
  ).run(imageUrl, title || null, linkUrl || null, sortOrder || 0);
  return findById(result.lastInsertRowid);
}

function remove(id) {
  db.prepare('DELETE FROM banners WHERE id = ?').run(id);
}

function toggleActive(id) {
  db.prepare('UPDATE banners SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
}

module.exports = { findAll, findActive, findById, create, remove, toggleActive };
