const wishlistRepo = require('../repositories/wishlist.repo');
const productRepo = require('../repositories/product.repo');

function list(req, res) {
  const items = wishlistRepo.findByUser(req.session.user.id);
  res.render('customer/wishlist', { title: 'المفضلة', items });
}

function toggle(req, res) {
  const { productId, redirectTo } = req.body;
  const target = redirectTo || req.get('Referer') || '/customer/wishlist';

  const product = productRepo.findById(productId);
  if (!product) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود.' };
    return res.redirect(target);
  }

  if (wishlistRepo.isInWishlist(req.session.user.id, product.id)) {
    wishlistRepo.remove(req.session.user.id, product.id);
    req.session.flash = { type: 'success', text: 'المنتج اتشال من المفضلة.' };
  } else {
    wishlistRepo.add(req.session.user.id, product.id);
    req.session.flash = { type: 'success', text: 'المنتج اتضاف للمفضلة.' };
  }

  res.redirect(target);
}

module.exports = { list, toggle };
