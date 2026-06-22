const db = require('../config/db');

function findById(id) {
  return db.prepare(`
    SELECT pl.*, u.full_name AS seller_name, c.name AS category_name
    FROM personal_listings pl
    LEFT JOIN users u ON u.id = pl.user_id
    LEFT JOIN categories c ON c.id = pl.category_id
    WHERE pl.id = ?
  `).get(id);
}

function findBySlug(slug) {
  return db.prepare(`
    SELECT pl.*, u.full_name AS seller_name, c.name AS category_name
    FROM personal_listings pl
    LEFT JOIN users u ON u.id = pl.user_id
    LEFT JOIN categories c ON c.id = pl.category_id
    WHERE pl.slug = ?
  `).get(slug);
}

function findActive({ categoryId, search, limit } = {}) {
  let sql = `
    SELECT pl.*, u.full_name AS seller_name, c.name AS category_name
    FROM personal_listings pl
    LEFT JOIN users u ON u.id = pl.user_id
    LEFT JOIN categories c ON c.id = pl.category_id
    WHERE pl.status = 'active' AND (pl.moderation_status IS NULL OR pl.moderation_status = 'active')
  `;
  const params = [];

  if (categoryId) {
    sql += ' AND pl.category_id = ?';
    params.push(categoryId);
  }
  if (search && search.trim()) {
    sql += ' AND (pl.name LIKE ? OR pl.description LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  sql += ' ORDER BY pl.created_at DESC';
  if (limit) {
    sql += ` LIMIT ${parseInt(limit)}`;
  }
  return db.prepare(sql).all(...params);
}

function findByUser(userId) {
  return db.prepare(`
    SELECT pl.*, c.name AS category_name
    FROM personal_listings pl
    LEFT JOIN categories c ON c.id = pl.category_id
    WHERE pl.user_id = ?
    ORDER BY pl.created_at DESC
  `).all(userId);
}

function create({ userId, categoryId, name, slug, description, price, condition, listingAttributes }) {
  const result = db.prepare(`
    INSERT INTO personal_listings (user_id, category_id, name, slug, description, price, condition, listing_attributes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    categoryId || null,
    name,
    slug,
    description || '',
    price,
    condition || 'used',
    listingAttributes || '{}'
  );
  return findById(result.lastInsertRowid);
}

function updateStatus(id, status) {
  db.prepare('UPDATE personal_listings SET status = ? WHERE id = ?').run(status, id);
}

function addImage(listingId, imageUrl, sortOrder = 0) {
  db.prepare('INSERT INTO personal_listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)').run(listingId, imageUrl, sortOrder);
}

function findImages(listingId) {
  return db.prepare('SELECT * FROM personal_listing_images WHERE listing_id = ? ORDER BY sort_order ASC, id ASC').all(listingId);
}

module.exports = { findById, findBySlug, findActive, findByUser, create, updateStatus, addImage, findImages };

// ── Moderation ─────────────────────────────────────────────────

function findAllForAdmin({ search, moderationStatus } = {}) {
  let sql = `
    SELECT pl.*, u.full_name AS seller_name, u.phone AS seller_phone, c.name AS category_name
    FROM personal_listings pl
    LEFT JOIN users u ON u.id = pl.user_id
    LEFT JOIN categories c ON c.id = pl.category_id
    WHERE 1=1
  `;
  const params = [];
  if (moderationStatus && ['active','hidden','removed'].includes(moderationStatus)) {
    sql += ' AND pl.moderation_status = ?';
    params.push(moderationStatus);
  }
  if (search && search.trim()) {
    sql += ' AND (pl.name LIKE ? OR u.full_name LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  sql += ' ORDER BY pl.created_at DESC';
  return db.prepare(sql).all(...params);
}

function setModerationStatus(id, moderationStatus, note) {
  db.prepare(`UPDATE personal_listings SET moderation_status = ?, moderation_note = ? WHERE id = ?`)
    .run(moderationStatus, note || null, id);
}

function permanentDelete(id) {
  db.prepare('DELETE FROM personal_listings WHERE id = ?').run(id);
}

module.exports.findAllForAdmin = findAllForAdmin;
module.exports.setModerationStatus = setModerationStatus;
module.exports.permanentDelete = permanentDelete;
