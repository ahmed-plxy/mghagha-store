const db = require('../config/db');

function findById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function findByPhone(phone) {
  if (!phone) return null;
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
}

function findByEmail(email) {
  if (!email) return null;
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
}

function findByGoogleId(googleId) {
  if (!googleId) return null;
  return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
}

/**
 * Create a phone-based user (legacy flow — preserved for existing accounts).
 */
function createUser({ fullName, phone, email, passwordHash, role = 'customer' }) {
  const stmt = db.prepare(`
    INSERT INTO users (full_name, phone, email, password_hash, role, status, auth_provider, phone_verified, email_verified)
    VALUES (?, ?, ?, ?, ?, 'active', 'phone', 1, 0)
  `);
  const result = stmt.run(
    fullName,
    phone,
    email ? email.trim().toLowerCase() : null,
    passwordHash,
    role,
  );
  return findById(result.lastInsertRowid);
}

/**
 * Create an email-only user (email_verified = 0 until code is confirmed).
 */
function createEmailUser({ fullName, email, passwordHash }) {
  const stmt = db.prepare(`
    INSERT INTO users (full_name, phone, email, password_hash, role, status, auth_provider, phone_verified, email_verified)
    VALUES (?, NULL, ?, ?, 'customer', 'active', 'email', 0, 0)
  `);
  const result = stmt.run(fullName, email.trim().toLowerCase(), passwordHash);
  return findById(result.lastInsertRowid);
}

/**
 * Find or create a Google-authenticated user.
 */
function findOrCreateGoogleUser({ googleId, fullName, email, avatarUrl }) {
  // 1. Existing Google user
  let user = findByGoogleId(googleId);
  if (user) {
    if (avatarUrl && user.avatar_url !== avatarUrl) {
      db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, user.id);
    }
    return findById(user.id);
  }
  // 2. Existing account with same email — link Google to it
  if (email) {
    user = findByEmail(email);
    if (user) {
      db.prepare('UPDATE users SET google_id = ?, avatar_url = ?, auth_provider = ?, email_verified = 1 WHERE id = ?')
        .run(googleId, avatarUrl || null, 'google', user.id);
      return findById(user.id);
    }
  }
  // 3. Brand-new Google user
  const stmt = db.prepare(`
    INSERT INTO users (full_name, phone, email, password_hash, google_id, avatar_url, role, status, auth_provider, email_verified, phone_verified)
    VALUES (?, NULL, ?, '__google_no_password__', ?, ?, 'customer', 'active', 'google', 1, 0)
  `);
  const result = stmt.run(
    fullName,
    email ? email.trim().toLowerCase() : null,
    googleId,
    avatarUrl || null,
  );
  return findById(result.lastInsertRowid);
}

function findAllNonAdmin() {
  return db.prepare("SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC").all();
}

function setStatus(id, status) {
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
}

/**
 * Set area and optionally phone after profile completion.
 */
function updateAreaAndPhone(id, { areaId, phone }) {
  db.prepare('UPDATE users SET area_id = ?, phone = ?, phone_verified = ? WHERE id = ?')
    .run(areaId || null, phone || null, phone ? 1 : 0, id);
  return findById(id);
}

function updatePhone(id, phone) {
  db.prepare('UPDATE users SET phone = ?, phone_verified = 1 WHERE id = ?').run(phone, id);
  return findById(id);
}

function updateProfile(id, { fullName, email }) {
  db.prepare('UPDATE users SET full_name = ?, email = ? WHERE id = ?')
    .run(fullName, email ? email.trim().toLowerCase() : null, id);
  return findById(id);
}

function markEmailVerified(id) {
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(id);
}

module.exports = {
  findById, findByPhone, findByEmail, findByGoogleId,
  createUser, createEmailUser, findOrCreateGoogleUser,
  findAllNonAdmin, setStatus,
  updateAreaAndPhone, updatePhone, updateProfile, markEmailVerified,
};
