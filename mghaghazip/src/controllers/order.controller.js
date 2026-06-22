const orderRepo = require('../repositories/order.repo');
const reviewRepo = require('../repositories/review.repo');

function listOrders(req, res) {
  const orders = orderRepo.findOrdersByUser(req.session.user.id);

  const groupedMap = new Map();
  for (const order of orders) {
    if (!groupedMap.has(order.checkout_id)) {
      groupedMap.set(order.checkout_id, {
        checkoutId: order.checkout_id,
        createdAt: order.created_at,
        orders: []
      });
    }
    groupedMap.get(order.checkout_id).orders.push(order);
  }

  res.render('customer/orders', {
    title: 'طلباتي',
    groupedOrders: Array.from(groupedMap.values())
  });
}

function viewCheckoutGroup(req, res) {
  const { checkoutId } = req.params;
  const orders = orderRepo.findOrdersByCheckoutId(checkoutId);
  const ownOrders = orders.filter((o) => o.user_id === req.session.user.id);

  if (ownOrders.length === 0) {
    req.session.flash = { type: 'error', text: 'لا يمكن الوصول إلى هذا الطلب.' };
    return res.redirect('/customer/orders');
  }

  const ordersWithItems = ownOrders.map((order) => ({
    ...order,
    items: orderRepo.findItemsByOrder(order.id)
  }));

  res.render('customer/order-confirmation', {
    title: 'تفاصيل الطلب',
    checkoutId,
    orders: ordersWithItems
  });
}

function viewOrder(req, res) {
  const order = orderRepo.findOrderForCustomer(Number(req.params.id), req.session.user.id);

  if (!order) {
    req.session.flash = { type: 'error', text: 'الطلب غير موجود.' };
    return res.redirect('/customer/orders');
  }

  const rawItems = orderRepo.findItemsByOrder(order.id);
  const items = rawItems.map((item) => {
    const existingReview = order.order_status === 'delivered'
      ? reviewRepo.findByUserProductOrder(req.session.user.id, item.product_id, order.id)
      : null;

    return {
      ...item,
      canReview: order.order_status === 'delivered' && !existingReview,
      existingReview
    };
  });

  res.render('customer/order-track', { title: 'تتبع الطلب', order, items });
}

module.exports = { listOrders, viewCheckoutGroup, viewOrder };
