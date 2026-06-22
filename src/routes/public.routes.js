const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const personalListingController = require('../controllers/personalListing.controller');
const reportRepo = require('../repositories/report.repo');

router.get('/', publicController.landing);
router.get('/stores', publicController.listStores);
router.get('/stores/:storeSlug', publicController.storeProfile);
router.get('/products', publicController.listProducts);
router.get('/stores/:storeSlug/products/:productSlug', publicController.productDetail);
router.get('/about', publicController.aboutPage);
router.get('/faq', publicController.faqPage);
router.get('/help', publicController.helpPage);
router.get('/privacy', publicController.privacyPage);
router.get('/terms', publicController.termsPage);

router.get('/classifieds', personalListingController.browseClassifieds);
router.get('/classifieds/:slug', personalListingController.classifiedDetail);

router.post('/products/:id/report', function(req, res) {
  try {
    const productId = Number(req.params.id);
    const reason = (req.body.reason || '').toString().trim();
    if (!productId || !reason) return res.status(400).json({ ok: false });
    const userId = req.session && req.session.user ? req.session.user.id : null;
    reportRepo.create({ productId, reporterUserId: userId, reason });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
});

router.get('/api/app-version', function(req, res) {
  const appSettingsRepo = require('../repositories/appSettings.repo');
  const settings = appSettingsRepo.getAll();
  res.json({
    latestVersion: settings.app_latest_version || '1.0.0',
    minVersion: settings.app_min_version || '1.0.0',
    apkUrl: settings.app_apk_url || '',
    updateMessage: settings.app_update_message || 'يوجد تحديث جديد للتطبيق.',
    forceUpdate: settings.app_force_update === '1',
  });
});

module.exports = router;
