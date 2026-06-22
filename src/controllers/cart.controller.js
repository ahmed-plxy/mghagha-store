const cartRepo = require('../repositories/cart.repo');
const productRepo = require('../repositories/product.repo');

function groupItemsByStore(items) {
  const map = new Map();
  for (const item of items) {
    if (!map.has(item.store_id)) {
      map.set(item.store_id, {
        storeId: item.store_id,
        storeName: item.store_name,
        storeSlug: item.store_slug,
        items: [],
        subtotal: 0
      });
    }
    const group = map.get(item.store_id);
    const lineTotal = item.current_price * item.quantity;
    group.items.push({ ...item, lineTotal });
    group.subtotal += lineTotal;
  }
  return Array.from(map.values());
}

function view(req, res) {
  const { items } = cartRepo.findCartWithItems(req.session.user.id);
  const groups = groupItemsByStore(items);
  const grandTotal = groups.reduce((sum, g) => sum + g.subtotal, 0);

  res.render('customer/cart', {
    title: 'سلة المشتريات',
    groups,
    grandTotal,
    isEmpty: items.length === 0
  });
}

function addItem(req, res) {
  const redirectTo = req.get('Referer') || '/products';
  const { productId, quantity } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = productRepo.findById(productId);
  if (!product || product.status !== 'active') {
    req.session.flash = { type: 'error', text: 'المنتج ده مش متاح دلوقتي.' };
    return res.redirect(redirectTo);
  }

  if (product.quantity < qty) {
    req.session.flash = { type: 'error', text: 'الكمية اللي طالبها مش موجودة في المخزن.' };
    return res.redirect(redirectTo);
  }

  const cart = cartRepo.findOrCreateByUser(req.session.user.id);
  cartRepo.addItem(cart.id, product.id, qty, product.price);

  req.session.flash = { type: 'success', text: 'المنتج اتضاف للسلة.' };
  res.redirect('/customer/cart');
}

function updateItem(req, res) {
  const cart = cartRepo.findOrCreateByUser(req.session.user.id);
  const item = cartRepo.findItemById(Number(req.params.id));

  if (!item || item.cart_id !== cart.id) {
    req.session.flash = { type: 'error', text: 'المنتج ده مش في سلتك.' };
    return res.redirect('/customer/cart');
  }

  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);
  const product = productRepo.findById(item.product_id);

  if (!product || quantity > product.quantity) {
    req.session.flash = { type: 'error', text: 'الكمية دي أكتر من اللي في المخزن.' };
    return res.redirect('/customer/cart');
  }

  cartRepo.updateItemQuantity(item.id, quantity);
  req.session.flash = { type: 'success', text: 'الكمية اتحدثت.' };
  res.redirect('/customer/cart');
}

function removeItem(req, res) {
  const cart = cartRepo.findOrCreateByUser(req.session.user.id);
  const item = cartRepo.findItemById(Number(req.params.id));

  if (!item || item.cart_id !== cart.id) {
    req.session.flash = { type: 'error', text: 'المنتج ده مش في سلتك.' };
    return res.redirect('/customer/cart');
  }

  cartRepo.removeItem(item.id);
  req.session.flash = { type: 'success', text: 'المنتج اتشال من السلة.' };
  res.redirect('/customer/cart');
}

module.exports = { view, addItem, updateItem, removeItem };
