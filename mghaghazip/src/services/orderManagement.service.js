const db = require('../config/db');
const orderRepo = require('../repositories/order.repo');
const productRepo = require('../repositories/product.repo');
const notificationService = require('./notification.service');
const { isValidTransition } = require('../utils/orderStatus');

class OrderStatusError extends Error {}

/**
 * Validates the requested transition, applies it inside a transaction,
 * and restocks products if the order is being cancelled (rule extension —
 * stock was decremented at checkout, so cancellation must give it back).
 */
function updateOrderStatusForVendor(orderId, storeId, newStatus) {
  const order = orderRepo.findOrderForVendor(orderId, storeId);

  if (!order) {
    throw new OrderStatusError('الطلب غير موجود أو لا تملك صلاحية الوصول إليه.');
  }

  if (!isValidTransition(order.order_status, newStatus)) {
    throw new OrderStatusError('لا يمكن تغيير حالة الطلب إلى هذه الحالة.');
  }

  const runTransaction = db.transaction(() => {
    orderRepo.updateOrderStatus(order.id, newStatus);

    if (newStatus === 'cancelled') {
      const items = orderRepo.findItemsByOrder(order.id);
      for (const item of items) {
        productRepo.incrementStock(item.product_id, item.quantity);
      }
    }
  });

  runTransaction();

  const updatedOrder = orderRepo.findById(order.id);
  notificationService.notifyOrderStatusChange(updatedOrder);
  return updatedOrder;
}

module.exports = { updateOrderStatusForVendor, OrderStatusError };
