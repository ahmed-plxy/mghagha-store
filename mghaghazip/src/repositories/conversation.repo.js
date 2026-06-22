const db = require('../config/db');

function findById(id) {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
}

function findByCustomerAndStore(customerId, storeId) {
  return db.prepare('SELECT * FROM conversations WHERE customer_id = ? AND store_id = ?').get(customerId, storeId);
}

function create(customerId, storeId) {
  const stmt = db.prepare('INSERT INTO conversations (customer_id, store_id) VALUES (?, ?)');
  const result = stmt.run(customerId, storeId);
  return findById(result.lastInsertRowid);
}

function findOrCreate(customerId, storeId) {
  const existing = findByCustomerAndStore(customerId, storeId);
  if (existing) return existing;
  return create(customerId, storeId);
}

function findByCustomer(customerId) {
  return db.prepare(`
    SELECT c.*, s.store_name, s.store_slug,
      (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_sender_id
    FROM conversations c
    JOIN stores s ON s.id = c.store_id
    WHERE c.customer_id = ?
    ORDER BY c.last_message_at DESC
  `).all(customerId);
}

function findByStore(storeId) {
  return db.prepare(`
    SELECT c.*, u.full_name AS customer_name, u.phone AS customer_phone,
      (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_sender_id
    FROM conversations c
    JOIN users u ON u.id = c.customer_id
    WHERE c.store_id = ?
    ORDER BY c.last_message_at DESC
  `).all(storeId);
}

function touchLastMessage(id) {
  db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(id);
}

function flagConversation(id, reason) {
  db.prepare('UPDATE conversations SET is_flagged = 1, flagged_reason = ? WHERE id = ?').run(reason || null, id);
}

function findFlagged() {
  return db.prepare(`
    SELECT c.*, u.full_name AS customer_name, u.phone AS customer_phone,
           s.store_name, s.store_slug,
      (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message_at_msg
    FROM conversations c
    JOIN users u ON u.id = c.customer_id
    JOIN stores s ON s.id = c.store_id
    WHERE c.is_flagged = 1
    ORDER BY c.last_message_at DESC
  `).all();
}

function unflagConversation(id) {
  db.prepare('UPDATE conversations SET is_flagged = 0, flagged_reason = NULL WHERE id = ?').run(id);
}

module.exports = { findById, findByCustomerAndStore, create, findOrCreate, findByCustomer, findByStore, touchLastMessage, flagConversation, findFlagged, unflagConversation };
