const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const customerController = require('../controllers/customer.controller');
const cartController = require('../controllers/cart.controller');
const checkoutController = require('../controllers/checkout.controller');
const orderController = require('../controllers/order.controller');
const wishlistController = require('../controllers/wishlist.controller');
const reviewController = require('../controllers/review.controller');
const chatController = require('../controllers/chat.controller');
const personalListingController = require('../controllers/personalListing.controller');

router.use(requireRole('customer'));

router.get('/dashboard', customerController.dashboard);
router.post('/profile/update', customerController.updateProfile);
router.get('/cart', cartController.view);
router.post('/cart/add', cartController.addItem);
router.post('/cart/items/:id/update', cartController.updateItem);
router.post('/cart/items/:id/remove', cartController.removeItem);

router.get('/checkout', checkoutController.showCheckout);
router.post('/checkout', checkoutController.placeOrder);

router.get('/orders', orderController.listOrders);
router.get('/orders/checkout/:checkoutId', orderController.viewCheckoutGroup);
router.get('/orders/:id', orderController.viewOrder);

router.get('/wishlist', wishlistController.list);
router.post('/wishlist/toggle', wishlistController.toggle);

router.post('/reviews', reviewController.submit);

router.get('/messages', chatController.list);
router.post('/messages/start', chatController.start);
router.get('/messages/:id', chatController.view);
router.post('/messages/:id/send', chatController.send);
router.get('/messages/:id/poll', chatController.poll);

router.get('/sell', personalListingController.showSellForm);
router.post('/sell', personalListingController.submitListing);
router.get('/my-listings', personalListingController.myListings);
router.post('/my-listings/:id/sold', personalListingController.markSold);

module.exports = router;
