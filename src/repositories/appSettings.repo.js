const db = require('../config/db');

function get(key) {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function set(key, value) {
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, String(value));
}

function getAll() {
  const rows = db.prepare('SELECT key, value FROM app_settings').all();
  const result = {};
  rows.forEach(r => { result[r.key] = r.value; });
  return result;
}

module.exports = { get, set, getAll };
