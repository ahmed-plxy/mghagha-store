const db = require('../config/db');

function findByUser(userId) {
  return db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
}

function createForUser(userId) {
  db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
  return findByUser(userId);
}

function findOrCreateByUser(userId) {
  const existing = findByUser(userId);
  if (existing) return existing;
  return createForUser(userId);
}

function findItemsWithDetails(cartId) {
  return db.prepare(`
    SELECT ci.id AS cart_item_id, ci.quantity, ci.unit_price AS cart_unit_price,
           p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
           p.price AS current_price, p.quantity AS available_quantity, p.status AS product_status,
           s.id AS store_id, s.store_name, s.store_slug, s.status AS store_status,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1) AS image_url
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    JOIN stores s ON s.id = p.store_id
    WHERE ci.cart_id = ?
    ORDER BY s.id, ci.id
  `).all(cartId);
}

function findItem(cartId, productId) {
  return db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cartId, productId);
}

function findItemById(cartItemId) {
  return db.prepare('SELECT * FROM cart_items WHERE id = ?').get(cartItemId);
}

function addItem(cartId, productId, quantity, unitPrice) {
  const existing = findItem(cartId, productId);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ?, unit_price = ? WHERE id = ?')
      .run(existing.quantity + quantity, unitPrice, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)')
      .run(cartId, productId, quantity, unitPrice);
  }
}

function updateItemQuantity(cartItemId, quantity) {
  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, cartItemId);
}

function removeItem(cartItemId) {
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartItemId);
}

function clearCart(cartId) {
  db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);
}

function findCartWithItems(userId) {
  const cart = findOrCreateByUser(userId);
  const items = findItemsWithDetails(cart.id);
  return { cart, items };
}

module.exports = {
  findByUser, findOrCreateByUser, findItemsWithDetails, findItem, findItemById,
  addItem, updateItemQuantity, removeItem, clearCart, findCartWithItems
};
