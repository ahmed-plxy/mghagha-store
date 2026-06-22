const db = require('../config/db');

function findPendingByUser(userId) {
  return db.prepare(`
    SELECT * FROM vendor_applications WHERE user_id = ? AND status = 'pending'
  `).get(userId);
}

function findById(id) {
  return db.prepare(`
    SELECT va.*, u.full_name AS applicant_name, u.phone AS applicant_phone, a.name AS area_name
    FROM vendor_applications va
    JOIN users u ON u.id = va.user_id
    JOIN areas a ON a.id = va.area_id
    WHERE va.id = ?
  `).get(id);
}

function create(data) {
  const stmt = db.prepare(`
    INSERT INTO vendor_applications
      (user_id, store_name, store_slug, phone, full_address, area_id, id_card_image_front, id_card_image_back, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(
    data.userId, data.storeName, data.storeSlug, data.phone,
    data.fullAddress, data.areaId, data.idCardFront, data.idCardBack
  );
  return findById(result.lastInsertRowid);
}

function findAllByStatus(status) {
  return db.prepare(`
    SELECT va.*, u.full_name AS applicant_name, u.phone AS applicant_phone, a.name AS area_name
    FROM vendor_applications va
    JOIN users u ON u.id = va.user_id
    JOIN areas a ON a.id = va.area_id
    WHERE va.status = ?
    ORDER BY va.created_at DESC
  `).all(status);
}

function updateStatus(id, status, reviewedBy) {
  db.prepare(`
    UPDATE vendor_applications
    SET status = ?, reviewed_by = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).run(status, reviewedBy, id);
  return findById(id);
}

function storeSlugExists(slug) {
  const inStores = db.prepare('SELECT id FROM stores WHERE store_slug = ?').get(slug);
  if (inStores) return true;
  const inApps = db.prepare(`
    SELECT id FROM vendor_applications WHERE store_slug = ? AND status != 'rejected'
  `).get(slug);
  return !!inApps;
}

module.exports = {
  findPendingByUser, findById, create, findAllByStatus, updateStatus, storeSlugExists
};
