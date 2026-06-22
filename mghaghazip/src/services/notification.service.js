const notificationRepo = require('../repositories/notification.repo');
const { statusLabel } = require('../utils/orderStatus');

function notifyOrderStatusChange(order) {
  const title = `تحديث حالة الطلب ${order.order_number}`;
  const body = `تم تحديث حالة طلبك إلى: ${statusLabel(order.order_status)}`;
  const link = `/customer/orders/${order.id}`;
  notificationRepo.create(order.user_id, title, body, link);
}

function notifyNewMessage(recipientUserId, conversationLink, senderName) {
  notificationRepo.create(recipientUserId, 'رسالة جديدة', `لديك رسالة جديدة من ${senderName}`, conversationLink);
}

module.exports = { notifyOrderStatusChange, notifyNewMessage };
