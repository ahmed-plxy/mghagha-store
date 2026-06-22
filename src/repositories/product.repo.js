const db = require('../config/db');

function findById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

function findByStoreAndSlug(storeId, slug) {
  return db.prepare('SELECT * FROM products WHERE store_id = ? AND slug = ?').get(storeId, slug);
}

function slugExistsInStore(storeId, slug) {
  return !!findByStoreAndSlug(storeId, slug);
}

function findAllByStore(storeId) {
  return db.prepare(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.store_id = ?
    ORDER BY p.created_at DESC
  `).all(storeId);
}

function create(data) {
  const stmt = db.prepare(`
    INSERT INTO products (store_id, category_id, name, slug, description, product_attributes, price, quantity, status, shipping_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.storeId,
    data.categoryId || null,
    data.name,
    data.slug,
    data.description || null,
    data.productAttributes ? JSON.stringify(data.productAttributes) : null,
    data.price,
    data.quantity,
    data.status || 'active',
    data.shippingCost !== undefined ? data.shippingCost : 0
  );
  return findById(result.lastInsertRowid);
}

function update(id, data) {
  const current = findById(id);
  db.prepare(`
    UPDATE products
    SET category_id = ?, name = ?, slug = ?, description = ?, product_attributes = ?, price = ?, quantity = ?, status = ?, shipping_cost = ?
    WHERE id = ?
  `).run(
    data.categoryId !== undefined ? data.categoryId : current.category_id,
    data.name !== undefined ? data.name : current.name,
    data.slug !== undefined ? data.slug : current.slug,
    data.description !== undefined ? data.description : current.description,
    data.productAttributes !== undefined ? JSON.stringify(data.productAttributes) : current.product_attributes,
    data.price !== undefined ? data.price : current.price,
    data.quantity !== undefined ? data.quantity : current.quantity,
    data.status !== undefined ? data.status : current.status,
    data.shippingCost !== undefined ? data.shippingCost : (current.shipping_cost || 0),
    id
  );
  return findById(id);
}

function remove(id) {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

function incrementStock(productId, amount) {
  db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(amount, productId);
}

function findActiveByStore(storeId) {
  return db.prepare(`
    SELECT
      p.*,
      (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      ) AS image_url
    FROM products p
    WHERE p.store_id = ? AND p.status = 'active'
    ORDER BY p.created_at DESC
  `).all(storeId);
}

function findPublicByStoreSlugAndProductSlug(storeSlug, productSlug) {
  return db.prepare(`
    SELECT p.*, s.id AS store_id, s.store_name, s.store_slug, s.status AS store_status,
           u.phone AS owner_phone
    FROM products p
    JOIN stores s ON s.id = p.store_id
    JOIN users u ON u.id = s.owner_user_id
    WHERE s.store_slug = ?
      AND p.slug = ?
      AND p.status = 'active'
      AND s.status = 'active'
  `).get(storeSlug, productSlug);
}

function findPublicProducts({ search, categoryId, subCategoryId, areaId, minPrice, maxPrice, limit = 60, offset = 0 } = {}) {
  let query = `
    SELECT
      p.*,
      s.store_name,
      s.store_slug,
      s.area_id,
      (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      ) AS image_url
    FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.status = 'active'
      AND s.status = 'active'
  `;
  const params = [];

  if (search) {
    query += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
  if (subCategoryId) {
    query += ' AND p.category_id = ?';
    params.push(subCategoryId);
  } else if (categoryId) {
    query += ' AND (p.category_id = ? OR p.category_id IN (SELECT id FROM categories WHERE parent_id = ?))';
    params.push(categoryId, categoryId);
  }
  if (areaId) {
    query += ' AND s.area_id = ?';
    params.push(areaId);
  }
  if (minPrice !== undefined && minPrice !== null) {
    query += ' AND p.price >= ?';
    params.push(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    query += ' AND p.price <= ?';
    params.push(maxPrice);
  }

  query += ' AND p.quantity > 0';
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

module.exports = {
  findById,
  findByStoreAndSlug,
  slugExistsInStore,
  findAllByStore,
  create,
  update,
  remove,
  incrementStock,
  findActiveByStore,
  findPublicByStoreSlugAndProductSlug,
  findPublicProducts
};
