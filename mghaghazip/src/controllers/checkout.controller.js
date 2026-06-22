const cartRepo = require('../repositories/cart.repo');
const storeRepo = require('../repositories/store.repo');
const orderSplittingService = require('../services/orderSplitting.service');
const { isNonEmptyString } = require('../utils/validators');

function groupItemsByStore(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.store_id)) {
      const store = storeRepo.findById(item.store_id);
      const shippingFee = (store && store.shipping_fee) ? store.shipping_fee : 0;
      map.set(item.store_id, { storeId: item.store_id, storeName: item.store_name, items: [], subtotal: 0, shippingFee });
    }
    const group = map.get(item.store_id);
    const lineTotal = item.current_price * item.quantity;
    group.items.push({ ...item, lineTotal });
    group.subtotal += lineTotal;
  }
  return Array.from(map.values());
}

function showCheckout(req, res) {
  const { items } = cartRepo.findCartWithItems(req.session.user.id);

  if (items.length === 0) {
    req.session.flash = { type: 'error', text: 'السلة بتاعتك فاضية.' };
    return res.redirect('/customer/cart');
  }

  const groups = groupItemsByStore(items);
  const grandTotal = groups.reduce((sum, g) => sum + g.subtotal + g.shippingFee, 0);

  res.render('customer/checkout', {
    title: 'كمّل الطلب',
    groups,
    grandTotal,
    errors: null,
    old: {}
  });
}

function placeOrder(req, res) {
  const { customerAddress, customerPhone } = req.body;
  const errors = [];

  if (!isNonEmptyString(customerAddress)) errors.push('العنوان مطلوب.');
  if (!isNonEmptyString(customerPhone)) errors.push('رقم التليفون مطلوب.');

  const renderWithErrors = (errorList) => {
    const { items } = cartRepo.findCartWithItems(req.session.user.id);
    const groups = groupItemsByStore(items);
    const grandTotal = groups.reduce((sum, g) => sum + g.subtotal + g.shippingFee, 0);
    return res.status(400).render('customer/checkout', {
      title: 'كمّل الطلب',
      groups,
      grandTotal,
      errors: errorList,
      old: { customerAddress, customerPhone }
    });
  };

  if (errors.length > 0) {
    return renderWithErrors(errors);
  }

  try {
    const result = orderSplittingService.processCheckout({
      userId: req.session.user.id,
      customerAddress: customerAddress.trim(),
      customerPhone: customerPhone.trim()
    });

    req.session.flash = { type: 'success', text: 'طلبك اتعمل بنجاح! هنتواصل معاك قريباً.' };
    return res.redirect(`/customer/orders/checkout/${result.checkoutId}`);
  } catch (err) {
    if (err instanceof orderSplittingService.CheckoutError) {
      return renderWithErrors([err.message]);
    }
    throw err;
  }
}

module.exports = { showCheckout, placeOrder };
