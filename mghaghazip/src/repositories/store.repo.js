const db = require('../config/db');

function findById(id) {
  return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
}

function findByOwner(ownerUserId) {
  return db.prepare('SELECT * FROM stores WHERE owner_user_id = ?').get(ownerUserId);
}

function findBySlug(slug) {
  return db.prepare('SELECT * FROM stores WHERE store_slug = ?').get(slug);
}

function slugExists(slug) {
  return !!findBySlug(slug);
}

function create({ ownerUserId, storeName, storeSlug, areaId }) {
  const stmt = db.prepare(`
    INSERT INTO stores (owner_user_id, store_name, store_slug, area_id, status)
    VALUES (?, ?, ?, ?, 'active')
  `);
  const result = stmt.run(ownerUserId, storeName, storeSlug, areaId);
  return findById(result.lastInsertRowid);
}

function updateProfile(id, { description, logoImage, coverImage, shippingFee }) {
  const current = findById(id);
  db.prepare(`
    UPDATE stores SET description = ?, logo_image = ?, cover_image = ?, shipping_fee = ? WHERE id = ?
  `).run(
    description !== undefined ? description : current.description,
    logoImage !== undefined ? logoImage : current.logo_image,
    coverImage !== undefined ? coverImage : current.cover_image,
    shippingFee !== undefined ? shippingFee : (current.shipping_fee || 0),
    id
  );
  return findById(id);
}

function findAllActive({ search, areaId } = {}) {
  let query = `
    SELECT s.*, a.name AS area_name
    FROM stores s
    JOIN areas a ON a.id = s.area_id
    WHERE s.status = 'active'
  `;
  const params = [];

  if (search) {
    query += ' AND s.store_name LIKE ?';
    params.push(`%${search}%`);
  }
  if (areaId) {
    query += ' AND s.area_id = ?';
    params.push(areaId);
  }

  query += ' ORDER BY s.created_at DESC';
  return db.prepare(query).all(...params);
}

function findActiveBySlug(slug) {
  return db.prepare(`
    SELECT s.*, a.name AS area_name, u.phone AS owner_phone
    FROM stores s
    JOIN areas a ON a.id = s.area_id
    JOIN users u ON u.id = s.owner_user_id
    WHERE s.store_slug = ? AND s.status = 'active'
  `).get(slug);
}

function findAllForAdmin() {
  return db.prepare(`
    SELECT s.*, a.name AS area_name, u.full_name AS owner_name, u.phone AS owner_phone
    FROM stores s
    JOIN areas a ON a.id = s.area_id
    JOIN users u ON u.id = s.owner_user_id
    ORDER BY s.created_at DESC
  `).all();
}

function setStatus(id, status) {
  db.prepare('UPDATE stores SET status = ? WHERE id = ?').run(status, id);
}

module.exports = {
  findById, findByOwner, findBySlug, slugExists, create, updateProfile,
  findAllActive, findActiveBySlug, findAllForAdmin, setStatus
};
