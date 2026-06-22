const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const cartRepo = require('../repositories/cart.repo');
const orderRepo = require('../repositories/order.repo');
const storeRepo = require('../repositories/store.repo');
const stockService = require('./stock.service');
const { generateOrderNumber } = require('./orderNumber.service');

class CheckoutError extends Error {}

/**
 * Groups the user's cart by store, and within a single DB transaction:
 *  - validates every product is still active and store still active
 *  - atomically decrements stock per item (aborts everything if any item fails)
 *  - creates one `orders` row per store, sharing one `checkout_id`
 *  - creates the corresponding `order_items` rows
 *  - clears the cart
 * If anything fails, the whole transaction rolls back — no partial orders,
 * no partial stock decrements (rule C).
 */
function processCheckout({ userId, customerAddress, customerPhone }) {
  const cartData = cartRepo.findCartWithItems(userId);

  if (!cartData || cartData.items.length === 0) {
    throw new CheckoutError('السلة فارغة، لا يمكن إتمام الطلب.');
  }

  const groups = new Map();
  for (const item of cartData.items) {
    if (item.product_status !== 'active' || item.store_status !== 'active') {
      throw new CheckoutError(`المنتج "${item.product_name}" غير متاح حاليًا، يرجى إزالته من السلة.`);
    }
    if (!groups.has(item.store_id)) {
      groups.set(item.store_id, { storeId: item.store_id, storeName: item.store_name, items: [] });
    }
    groups.get(item.store_id).items.push(item);
  }

  const checkoutId = uuidv4();
  const createdOrders = [];

  const runTransaction = db.transaction(() => {
    for (const group of groups.values()) {
      let storeTotal = 0;
      const orderItemsToInsert = [];

      for (const item of group.items) {
        const unitPrice = item.current_price;
        const decremented = stockService.decrementStockIfAvailable(item.product_id, item.quantity);

        if (!decremented) {
          throw new CheckoutError(`الكمية المتوفرة غير كافية للمنتج "${item.product_name}".`);
        }

        const subtotal = unitPrice * item.quantity;
        storeTotal += subtotal;
        orderItemsToInsert.push({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice,
          subtotal
        });
      }

      const storeData = storeRepo.findById(group.storeId);
      const shippingFee = (storeData && storeData.shipping_fee) ? storeData.shipping_fee : 0;
      const totalWithShipping = storeTotal + shippingFee;

      const orderNumber = generateOrderNumber(group.storeId);

      const order = orderRepo.createOrder({
        userId,
        storeId: group.storeId,
        checkoutId,
        orderNumber,
        totalAmount: totalWithShipping,
        customerAddress,
        customerPhone
      });

      for (const orderItem of orderItemsToInsert) {
        orderRepo.createOrderItem(order.id, orderItem.productId, orderItem.quantity, orderItem.unitPrice, orderItem.subtotal);
      }

      createdOrders.push(order);
    }

    cartRepo.clearCart(cartData.cart.id);
  });

  runTransaction();

  return { checkoutId, orders: createdOrders };
}

module.exports = { processCheckout, CheckoutError };
