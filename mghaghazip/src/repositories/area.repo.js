const db = require('../config/db');

function findAllActive() {
  return db.prepare('SELECT * FROM areas WHERE is_active = 1 ORDER BY name').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
}

module.exports = { findAllActive, findById };
