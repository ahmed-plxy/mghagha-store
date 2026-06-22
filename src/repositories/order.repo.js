const db = require('../config/db');

function findById(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function createOrder({ userId, storeId, checkoutId, orderNumber, totalAmount, customerAddress, customerPhone }) {
  const stmt = db.prepare(`
    INSERT INTO orders (user_id, store_id, checkout_id, order_number, total_amount, customer_address, customer_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, storeId, checkoutId, orderNumber, totalAmount, customerAddress, customerPhone);
  return findById(result.lastInsertRowid);
}

function createOrderItem(orderId, productId, quantity, unitPrice, subtotal) {
  db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
    VALUES (?, ?, ?, ?, ?)
  `).run(orderId, productId, quantity, unitPrice, subtotal);
}

function findItemsByOrder(orderId) {
  return db.prepare(`
    SELECT oi.*, p.name AS product_name, p.slug AS product_slug
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `).all(orderId);
}

function findOrdersByCheckoutId(checkoutId) {
  return db.prepare(`
    SELECT o.*, s.store_name, s.store_slug
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.checkout_id = ?
    ORDER BY o.id
  `).all(checkoutId);
}

function findOrdersByUser(userId) {
  return db.prepare(`
    SELECT o.*, s.store_name, s.store_slug
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC, o.id DESC
  `).all(userId);
}

function findOrderForCustomer(orderId, userId) {
  return db.prepare(`
    SELECT o.*, s.store_name, s.store_slug
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = ? AND o.user_id = ?
  `).get(orderId, userId);
}

function findOrdersByStore(storeId, status) {
  let query = 'SELECT * FROM orders WHERE store_id = ?';
  const params = [storeId];
  if (status) {
    query += ' AND order_status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC, id DESC';
  return db.prepare(query).all(...params);
}

function findOrderForVendor(orderId, storeId) {
  return db.prepare('SELECT * FROM orders WHERE id = ? AND store_id = ?').get(orderId, storeId);
}

function updateOrderStatus(orderId, status) {
  db.prepare('UPDATE orders SET order_status = ? WHERE id = ?').run(status, orderId);
}

function findAllForAdmin({ status } = {}) {
  let query = `
    SELECT
      o.*,
      s.store_name,
      u.full_name AS customer_name,
      u.phone AS customer_phone
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    JOIN users u ON u.id = o.user_id
  `;
  const params = [];

  if (status) {
    query += ' WHERE o.order_status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC, o.id DESC';
  return db.prepare(query).all(...params);
}

function findOrderForAdmin(orderId) {
  return db.prepare(`
    SELECT
      o.*,
      s.store_name,
      u.full_name AS customer_name,
      u.phone AS customer_phone
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    JOIN users u ON u.id = o.user_id
    WHERE o.id = ?
  `).get(orderId);
}

module.exports = {
  findById,
  createOrder,
  createOrderItem,
  findItemsByOrder,
  findOrdersByCheckoutId,
  findOrdersByUser,
  findOrderForCustomer,
  findOrdersByStore,
  findOrderForVendor,
  updateOrderStatus,
  findAllForAdmin,
  findOrderForAdmin
};
