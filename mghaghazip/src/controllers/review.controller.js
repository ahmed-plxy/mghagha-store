const reviewRepo = require('../repositories/review.repo');
const reviewEligibilityService = require('../services/reviewEligibility.service');
const productRepo = require('../repositories/product.repo');

function submit(req, res) {
  const { productId, rating, comment, redirectTo } = req.body;
  const target = redirectTo || '/customer/orders';

  const product = productRepo.findById(productId);
  if (!product) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود.' };
    return res.redirect(target);
  }

  const ratingNum = Number(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    req.session.flash = { type: 'error', text: 'اختار تقييم من 1 لـ 5.' };
    return res.redirect(target);
  }

  const eligibleOrder = reviewEligibilityService.getEligibleOrderForReview(req.session.user.id, Number(productId));
  if (!eligibleOrder) {
    req.session.flash = { type: 'error', text: 'معكش صلاحية تقيّم المنتج ده. لازم تكون طلبته واتوصلك.' };
    return res.redirect(target);
  }

  reviewRepo.create({
    userId: req.session.user.id,
    productId: Number(productId),
    orderId: eligibleOrder.order_id,
    rating: ratingNum,
    comment: comment && comment.trim() !== '' ? comment.trim() : null
  });

  req.session.flash = { type: 'success', text: 'تقييمك اتضاف، شكراً ليك!' };
  res.redirect(target);
}

module.exports = { submit };
