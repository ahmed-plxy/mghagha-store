const db = require('../config/db');

function findByUser(userId, limit = 20) {
  return db.prepare(`
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(userId, limit);
}

function countUnread(userId) {
  const row = db.prepare(`
    SELECT COUNT(*) AS c
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(userId);
  return row ? row.c : 0;
}

function create(userId, title, body, link) {
  db.prepare(`
    INSERT INTO notifications (user_id, title, body, link, is_read)
    VALUES (?, ?, ?, ?, 0)
  `).run(userId, title, body || null, link || null);
}

function markRead(id, userId) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).run(id, userId);
}

function markAllRead(userId) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ?
  `).run(userId);
}

function markReadByLink(userId, link) {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ? AND link = ? AND is_read = 0
  `).run(userId, link);
}

function findUnread(userId, limit = 50) {
  return db.prepare(`
    SELECT *
    FROM notifications
    WHERE user_id = ? AND is_read = 0
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(userId, limit);
}

module.exports = { findByUser, findUnread, countUnread, create, markRead, markAllRead, markReadByLink };
