const db = require('../config/db');

function findAll() {
  return db.prepare('SELECT * FROM popular_searches ORDER BY sort_order ASC, id ASC').all();
}

function findActive() {
  return db.prepare('SELECT * FROM popular_searches WHERE is_active = 1 ORDER BY sort_order ASC, id ASC').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM popular_searches WHERE id = ?').get(id);
}

function create({ term, sortOrder }) {
  const result = db.prepare(
    'INSERT INTO popular_searches (term, sort_order) VALUES (?, ?)'
  ).run(term, sortOrder || 0);
  return findById(result.lastInsertRowid);
}

function remove(id) {
  db.prepare('DELETE FROM popular_searches WHERE id = ?').run(id);
}

function toggleActive(id) {
  db.prepare('UPDATE popular_searches SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
}

module.exports = { findAll, findActive, findById, create, remove, toggleActive };
