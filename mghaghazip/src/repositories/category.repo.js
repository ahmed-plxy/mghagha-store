const db = require('../config/db');

function findAllActive() {
  return db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY name').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function findByParent(parentId) {
  return db.prepare('SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY id').all(parentId);
}

function findMainCategories() {
  return db.prepare('SELECT * FROM categories WHERE parent_id IS NULL AND is_active = 1 ORDER BY id').all();
}

function getStructuredCategories() {
  const mains = findMainCategories();
  const subsMap = {};
  for (const m of mains) {
    subsMap[m.id] = findByParent(m.id);
  }
  return { mains, subsMap };
}

module.exports = { findAllActive, findById, findByParent, findMainCategories, getStructuredCategories };
