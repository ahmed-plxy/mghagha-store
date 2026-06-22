const db = require('../config/db');

function findByConversation(conversationId) {
  return db.prepare(`
    SELECT m.*, u.full_name AS sender_name
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC, m.id ASC
  `).all(conversationId);
}

function create(conversationId, senderId, body) {
  const result = db.prepare('INSERT INTO messages (conversation_id, sender_id, body, is_read) VALUES (?, ?, ?, 0)')
    .run(conversationId, senderId, body);
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
}

function findSince(conversationId, sinceId) {
  return db.prepare(`
    SELECT m.*, u.full_name AS sender_name
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? AND m.id > ?
    ORDER BY m.created_at ASC, m.id ASC
  `).all(conversationId, sinceId);
}

function markConversationRead(conversationId, userId) {
  db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?')
    .run(conversationId, userId);
}

function countUnreadForUser(userId) {
  return db.prepare(`
    SELECT COUNT(*) AS c
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    LEFT JOIN stores s ON s.id = c.store_id
    WHERE m.is_read = 0 AND m.sender_id != ?
      AND (c.customer_id = ? OR s.owner_user_id = ?)
  `).get(userId, userId, userId).c;
}

module.exports = { findByConversation, create, findSince, markConversationRead, countUnreadForUser };
