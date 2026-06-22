const db = require('../config/db');

function create({ adminUserId, title, message, url, onesignalId, recipients }) {
  const result = db.prepare(`
    INSERT INTO push_notification_log (admin_user_id, title, message, url, onesignal_id, recipients)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminUserId, title, message, url || null, onesignalId || null, recipients || 0);
  return result.lastInsertRowid;
}

function findAll(limit = 50) {
  return db.prepare(`
    SELECT pnl.*, u.full_name AS admin_name
    FROM push_notification_log pnl
    LEFT JOIN users u ON u.id = pnl.admin_user_id
    ORDER BY pnl.created_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = { create, findAll };
