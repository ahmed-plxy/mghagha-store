const crypto = require('crypto');
const db = require('../config/db');

const EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function generateCode() {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new verification record for a user.
 * Deletes any existing unverified records first.
 */
function createVerification(userId) {
  db.prepare("DELETE FROM email_verifications WHERE user_id = ? AND verified_at IS NULL").run(userId);
  const code = generateCode();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO email_verifications (user_id, token, code, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, token, code, expiresAt);
  return { code, token };
}

/**
 * Find an active (unexpired, unverified) record by user_id.
 */
function findActiveByUser(userId) {
  return db.prepare(`
    SELECT * FROM email_verifications
    WHERE user_id = ? AND verified_at IS NULL AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(userId);
}

/**
 * Find any active record by token.
 */
function findActiveByToken(token) {
  return db.prepare(`
    SELECT * FROM email_verifications
    WHERE token = ? AND verified_at IS NULL AND expires_at > datetime('now')
  `).get(token);
}

/**
 * Attempt code verification. Returns 'ok', 'expired', 'too_many_attempts', or 'wrong_code'.
 */
function verifyCode(userId, inputCode) {
  const record = findActiveByUser(userId);
  if (!record) return 'expired';
  if (record.attempts >= MAX_ATTEMPTS) return 'too_many_attempts';

  db.prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?").run(record.id);

  if (record.code !== inputCode.trim()) return 'wrong_code';

  db.prepare("UPDATE email_verifications SET verified_at = datetime('now') WHERE id = ?").run(record.id);
  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(userId);
  return 'ok';
}

/**
 * Mark as verified by token (for link-based flow — unused currently but ready).
 */
function verifyToken(token) {
  const record = findActiveByToken(token);
  if (!record) return false;
  db.prepare("UPDATE email_verifications SET verified_at = datetime('now') WHERE id = ?").run(record.id);
  db.prepare("UPDATE users SET email_verified = 1 WHERE id = ?").run(record.user_id);
  return record.user_id;
}

module.exports = { createVerification, findActiveByUser, verifyCode, verifyToken, MAX_ATTEMPTS };
