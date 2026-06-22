const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const { vendorIdCardUpload, storeImageUpload, productImageUpload } = require('../middleware/upload');
const validateImageContent = require('../middleware/validateImageContent');
const vendorApplicationController = require('../controllers/vendorApplication.controller');
const storeController = require('../controllers/store.controller');
const productController = require('../controllers/product.controller');
const vendorOrderController = require('../controllers/vendorOrder.controller');
const vendorChatController = require('../controllers/vendorChat.controller');
const storeRepo = require('../repositories/store.repo');

router.get('/apply', requireRole('customer'), vendorApplicationController.showForm);
router.post(
  '/apply',
  requireRole('customer'),
  vendorIdCardUpload.fields([
    { name: 'idCardFront', maxCount: 1 },
    { name: 'idCardBack', maxCount: 1 }
  ]),
  validateImageContent,
  vendorApplicationController.submit
);

router.use(requireRole('vendor'));

function loadOwnStore(req, res, next) {
  const store = storeRepo.findByOwner(req.session.user.id);
  if (!store) {
    req.session.flash = { type: 'error', text: 'مفيش محل مربوط بحسابك.' };
    return res.redirect('/');
  }
  req.store = store;
  next();
}

router.use(loadOwnStore);

router.get('/dashboard', storeController.dashboard);

router.get('/store/preview', storeController.storePreview);
router.get('/store/edit', storeController.showEditForm);
router.post(
  '/store/edit',
  storeImageUpload.fields([
    { name: 'logoImage', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  validateImageContent,
  storeController.update
);

router.get('/products', productController.list);
router.get('/products/new', productController.showCreateForm);
router.post('/products/new', productImageUpload.array('images', 5), validateImageContent, productController.create);
router.get('/products/:id/edit', productController.showEditForm);
router.post('/products/:id/edit', productImageUpload.array('images', 5), validateImageContent, productController.update);
router.post('/products/:id/delete', productController.remove);
router.post('/products/:id/toggle-status', productController.toggleStatus);

router.get('/api/pending-count', function (req, res) {
  const db = require('../config/db');
  const count = db.prepare(
    "SELECT COUNT(*) AS c FROM orders WHERE store_id = ? AND order_status = 'pending'"
  ).get(req.store.id).c;
  res.json({ count });
});

router.get('/orders', vendorOrderController.list);
router.get('/orders/:id', vendorOrderController.detail);
router.post('/orders/:id/status', vendorOrderController.updateStatus);

router.get('/messages', vendorChatController.list);
router.get('/messages/:id', vendorChatController.view);
router.post('/messages/:id/send', vendorChatController.send);
router.get('/messages/:id/poll', vendorChatController.poll);

module.exports = router;
