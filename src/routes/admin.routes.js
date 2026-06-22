const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireRole } = require('../middleware/auth');

router.use(requireRole('admin'));

router.get('/dashboard', adminController.dashboard);

router.get('/vendor-applications', adminController.listVendorApplications);
router.get('/vendor-applications/:id/id-card/:side', adminController.viewIdCardImage);
router.post('/vendor-applications/:id/approve', adminController.approveVendorApplication);
router.post('/vendor-applications/:id/reject', adminController.rejectVendorApplication);

router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.viewOrder);

router.get('/reviews', adminController.listReviews);
router.post('/reviews/:id/hide', adminController.hideReview);
router.post('/reviews/:id/unhide', adminController.unhideReview);

router.get('/stores', adminController.listStores);
router.post('/stores/:id/suspend', adminController.suspendStore);
router.post('/stores/:id/activate', adminController.activateStore);
router.get('/stores/:id/products', adminController.listStoreProducts);
router.post('/stores/:id/products/:productId/toggle-status', adminController.toggleStoreProduct);
router.post('/stores/:id/products/:productId/delete', adminController.deleteStoreProduct);

router.get('/users', adminController.listUsers);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/activate', adminController.activateUser);

router.get('/banners', adminController.listBanners);
router.post('/banners/upload', adminController.uploadBanner);
router.post('/banners/:id/delete', adminController.deleteBanner);
router.post('/banners/:id/toggle', adminController.toggleBanner);

router.get('/popular-searches', adminController.listPopularSearches);
router.post('/popular-searches', adminController.createPopularSearch);
router.post('/popular-searches/:id/update', adminController.updatePopularSearch);
router.post('/popular-searches/:id/delete', adminController.deletePopularSearch);
router.post('/popular-searches/:id/toggle', adminController.togglePopularSearch);

router.get('/flagged-chats', adminController.listFlaggedChats);
router.get('/flagged-chats/:id', adminController.viewFlaggedChat);
router.post('/flagged-chats/:id/unflag', adminController.unflagChat);

router.get('/reports', adminController.listReports);
router.post('/reports/:id/dismiss', adminController.dismissReport);
router.post('/reports/:id/disable-product', adminController.disableReportedProduct);
router.post('/reports/:id/delete-product', adminController.deleteReportedProduct);

router.get('/push-notifications', adminController.listPushNotifications);
router.post('/push-notifications/send', adminController.sendPushNotification);

router.get('/app-version', adminController.appVersionSettings);
router.post('/app-version', adminController.saveAppVersionSettings);

router.get('/classifieds-moderation', adminController.listClassifiedsModeration);
router.post('/classifieds-moderation/:id/hide', adminController.hideListing);
router.post('/classifieds-moderation/:id/restore', adminController.restoreListing);
router.post('/classifieds-moderation/:id/remove', adminController.removeListing);
router.post('/classifieds-moderation/:id/delete', adminController.permanentDeleteListing);

module.exports = router;
