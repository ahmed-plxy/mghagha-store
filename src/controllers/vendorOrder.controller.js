const orderRepo = require('../repositories/order.repo');
const orderManagementService = require('../services/orderManagement.service');
const { nextPossibleStatuses } = require('../utils/orderStatus');

function list(req, res) {
  const status = req.query.status || null;
  const orders = orderRepo.findOrdersByStore(req.store.id, status);

  res.render('vendor/orders/list', {
    title: 'الطلبات الواردة',
    orders,
    currentStatus: status || 'all'
  });
}

function detail(req, res) {
  const order = orderRepo.findOrderForVendor(Number(req.params.id), req.store.id);

  if (!order) {
    req.session.flash = { type: 'error', text: 'الطلب مش موجود أو معكش صلاحية تشوفه.' };
    return res.redirect('/vendor/orders');
  }

  const items = orderRepo.findItemsByOrder(order.id);

  res.render('vendor/orders/detail', {
    title: 'تفاصيل الطلب',
    order,
    items,
    nextStatuses: nextPossibleStatuses(order.order_status)
  });
}

function updateStatus(req, res) {
  const { status } = req.body;

  try {
    orderManagementService.updateOrderStatusForVendor(Number(req.params.id), req.store.id, status);
    req.session.flash = { type: 'success', text: 'حالة الطلب اتحدثت.' };
  } catch (err) {
    if (err instanceof orderManagementService.OrderStatusError) {
      req.session.flash = { type: 'error', text: err.message };
    } else {
      throw err;
    }
  }

  res.redirect(`/vendor/orders/${req.params.id}`);
}

module.exports = { list, detail, updateStatus };
