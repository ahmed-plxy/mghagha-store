const db = require('../config/db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS product_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
console.log('✔ product_reports table ready');
