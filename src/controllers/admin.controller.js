const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../config/db');
const vendorApplicationRepo = require('../repositories/vendorApplication.repo');
const storeRepo = require('../repositories/store.repo');
const productRepo = require('../repositories/product.repo');
const userRepo = require('../repositories/user.repo');
const orderRepo = require('../repositories/order.repo');
const reviewRepo = require('../repositories/review.repo');
const bannerRepo = require('../repositories/banner.repo');
const popularSearchRepo = require('../repositories/popularSearch.repo');
const conversationRepo = require('../repositories/conversation.repo');
const messageRepo = require('../repositories/message.repo');
const reportRepo = require('../repositories/report.repo');

const bannerStorage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'public', 'banners');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `banner-${Date.now()}${ext}`);
  }
});
const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

function dashboard(req, res) {
  const pendingApplications = vendorApplicationRepo.findAllByStatus('pending');
  const storeCount = db.prepare('SELECT COUNT(*) AS c FROM stores').get().c;
  const customerCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'").get().c;
  const todayOrderCount = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE date(created_at) = date('now')").get().c;

  const topProducts = db.prepare(`
    SELECT p.id, p.name, p.price, s.store_name,
           SUM(oi.quantity) AS total_sold,
           SUM(oi.subtotal) AS total_revenue,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS image_url
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN stores s ON s.id = p.store_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.order_status IN ('delivered','confirmed','preparing','out_for_delivery')
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 8
  `).all();

  let flaggedCount = 0;
  try {
    flaggedCount = db.prepare('SELECT COUNT(*) AS c FROM conversations WHERE is_flagged = 1').get().c;
  } catch (e) {}

  res.render('admin/dashboard', {
    title: 'لوحة تحكم الإدارة',
    pendingCount: pendingApplications.length,
    storeCount,
    customerCount,
    todayOrderCount,
    topProducts,
    flaggedCount
  });
}

function listVendorApplications(req, res) {
  const status = req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)
    ? req.query.status
    : 'pending';
  const applications = vendorApplicationRepo.findAllByStatus(status);
  res.render('admin/vendor-applications', {
    title: 'طلبات انضمام البائعين',
    applications,
    currentStatus: status
  });
}

function viewIdCardImage(req, res) {
  const { id, side } = req.params;
  const application = vendorApplicationRepo.findById(id);

  if (!application) {
    return res.status(404).render('errors/error', { title: 'غير موجود', message: 'الطلب غير موجود.' });
  }

  const relativePath = side === 'front' ? application.id_card_image_front : application.id_card_image_back;
  if (!relativePath) {
    return res.status(404).render('errors/error', { title: 'غير موجود', message: 'الصورة غير موجودة.' });
  }

  const absolutePath = path.join(__dirname, '..', '..', 'uploads', relativePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).render('errors/error', { title: 'غير موجود', message: 'الصورة غير موجودة على الخادم.' });
  }

  res.sendFile(absolutePath);
}

function approveVendorApplication(req, res) {
  const { id } = req.params;
  const application = vendorApplicationRepo.findById(id);

  if (!application || application.status !== 'pending') {
    req.session.flash = { type: 'error', text: 'الطلب ده مش صالح أو اتعالج قبل كده.' };
    return res.redirect('/admin/vendor-applications');
  }

  const approveTransaction = db.transaction(() => {
    storeRepo.create({
      ownerUserId: application.user_id,
      storeName: application.store_name,
      storeSlug: application.store_slug,
      areaId: application.area_id
    });
    db.prepare(`UPDATE users SET role = 'vendor' WHERE id = ?`).run(application.user_id);
    vendorApplicationRepo.updateStatus(application.id, 'approved', req.session.user.id);
  });

  approveTransaction();

  req.session.flash = { type: 'success', text: 'الطلب اتوافق عليه والمحل اتفتح بنجاح.' };
  res.redirect('/admin/vendor-applications');
}

function rejectVendorApplication(req, res) {
  const { id } = req.params;
  const application = vendorApplicationRepo.findById(id);

  if (!application || application.status !== 'pending') {
    req.session.flash = { type: 'error', text: 'الطلب ده مش صالح أو اتعالج قبل كده.' };
    return res.redirect('/admin/vendor-applications');
  }

  vendorApplicationRepo.updateStatus(application.id, 'rejected', req.session.user.id);

  req.session.flash = { type: 'success', text: 'الطلب اترفض.' };
  res.redirect('/admin/vendor-applications');
}

function listOrders(req, res) {
  const status = req.query.status || null;
  const orders = orderRepo.findAllForAdmin({ status });
  res.render('admin/orders', { title: 'جميع الطلبات', orders, currentStatus: status || 'all' });
}

function viewOrder(req, res) {
  const order = orderRepo.findOrderForAdmin(Number(req.params.id));
  if (!order) {
    req.session.flash = { type: 'error', text: 'الطلب مش موجود.' };
    return res.redirect('/admin/orders');
  }
  const items = orderRepo.findItemsByOrder(order.id);
  res.render('admin/order-detail', { title: 'تفاصيل الطلب', order, items });
}

function listReviews(req, res) {
  const status = req.query.status && ['approved', 'hidden'].includes(req.query.status) ? req.query.status : null;
  const reviews = reviewRepo.findAllForAdmin(status);
  res.render('admin/reviews', { title: 'تقييمات المنتجات', reviews, currentStatus: status || 'all' });
}

function hideReview(req, res) {
  reviewRepo.setStatus(Number(req.params.id), 'hidden');
  req.session.flash = { type: 'success', text: 'التقييم اتخبى.' };
  res.redirect('/admin/reviews');
}

function unhideReview(req, res) {
  reviewRepo.setStatus(Number(req.params.id), 'approved');
  req.session.flash = { type: 'success', text: 'التقييم اتظهر.' };
  res.redirect('/admin/reviews');
}

function listStores(req, res) {
  const stores = storeRepo.findAllForAdmin();
  res.render('admin/stores', { title: 'المتاجر', stores });
}

function suspendStore(req, res) {
  storeRepo.setStatus(Number(req.params.id), 'suspended');
  req.session.flash = { type: 'success', text: 'المحل اتوقف مؤقتاً.' };
  res.redirect('/admin/stores');
}

function activateStore(req, res) {
  storeRepo.setStatus(Number(req.params.id), 'active');
  req.session.flash = { type: 'success', text: 'المحل اتفعّل تاني.' };
  res.redirect('/admin/stores');
}

function listStoreProducts(req, res) {
  const store = storeRepo.findById(Number(req.params.id));
  if (!store) {
    req.session.flash = { type: 'error', text: 'المحل مش موجود.' };
    return res.redirect('/admin/stores');
  }
  const products = productRepo.findAllByStore(store.id);
  res.render('admin/store-products', { title: 'منتجات ' + store.store_name, store, products });
}

function toggleStoreProduct(req, res) {
  const product = productRepo.findById(Number(req.params.productId));
  if (!product || product.store_id !== Number(req.params.id)) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود.' };
    return res.redirect(`/admin/stores/${req.params.id}/products`);
  }
  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  productRepo.update(product.id, { status: newStatus });
  req.session.flash = { type: 'success', text: 'حالة المنتج اتحدثت.' };
  res.redirect(`/admin/stores/${req.params.id}/products`);
}

function deleteStoreProduct(req, res) {
  const product = productRepo.findById(Number(req.params.productId));
  if (!product || product.store_id !== Number(req.params.id)) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود.' };
    return res.redirect(`/admin/stores/${req.params.id}/products`);
  }
  productRepo.remove(product.id);
  req.session.flash = { type: 'success', text: 'المنتج اتحذف نهائياً.' };
  res.redirect(`/admin/stores/${req.params.id}/products`);
}

// ─── Banner Ads ────────────────────────────────────────────────
function listBanners(req, res) {
  const banners = bannerRepo.findAll();
  res.render('admin/banners', { title: 'إدارة الإعلانات الممولة', banners });
}

function uploadBanner(req, res) {
  bannerUpload.single('bannerImage')(req, res, (err) => {
    if (err || !req.file) {
      req.session.flash = { type: 'error', text: 'فشل رفع الصورة. تأكد من اختيار صورة صحيحة (حجم أقصى 5MB).' };
      return res.redirect('/admin/banners');
    }
    const { title, linkUrl, sortOrder } = req.body;
    bannerRepo.create({
      imageUrl: `/banners/${req.file.filename}`,
      title: title || null,
      linkUrl: linkUrl || null,
      sortOrder: parseInt(sortOrder) || 0
    });
    req.session.flash = { type: 'success', text: 'الإعلان اتضاف بنجاح.' };
    res.redirect('/admin/banners');
  });
}

function deleteBanner(req, res) {
  const banner = bannerRepo.findById(Number(req.params.id));
  if (banner) {
    const filePath = path.join(__dirname, '..', '..', 'public', banner.image_url);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    bannerRepo.remove(banner.id);
  }
  req.session.flash = { type: 'success', text: 'الإعلان اتحذف.' };
  res.redirect('/admin/banners');
}

function toggleBanner(req, res) {
  bannerRepo.toggleActive(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'حالة الإعلان اتحدثت.' };
  res.redirect('/admin/banners');
}

// ─── Popular Searches ──────────────────────────────────────────
function listPopularSearches(req, res) {
  const searches = popularSearchRepo.findAll();
  res.render('admin/popular-searches', { title: 'الكلمات الشائعة في البحث', searches });
}

function createPopularSearch(req, res) {
  const term = (req.body.term || '').trim();
  if (!term) {
    req.session.flash = { type: 'error', text: 'اكتب كلمة البحث أولاً.' };
    return res.redirect('/admin/popular-searches');
  }
  popularSearchRepo.create({ term, sortOrder: Number(req.body.sortOrder) || 0 });
  req.session.flash = { type: 'success', text: 'تمت إضافة الكلمة بنجاح.' };
  res.redirect('/admin/popular-searches');
}

function deletePopularSearch(req, res) {
  popularSearchRepo.remove(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'تم حذف الكلمة.' };
  res.redirect('/admin/popular-searches');
}

function togglePopularSearch(req, res) {
  popularSearchRepo.toggleActive(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'تم تحديث حالة الكلمة.' };
  res.redirect('/admin/popular-searches');
}

// ─── Flagged Chats ─────────────────────────────────────────────
function listFlaggedChats(req, res) {
  const conversations = conversationRepo.findFlagged();
  res.render('admin/flagged-chats', { title: 'محادثات مشبوهة', conversations });
}

function viewFlaggedChat(req, res) {
  const conversation = conversationRepo.findById(Number(req.params.id));
  if (!conversation) {
    req.session.flash = { type: 'error', text: 'المحادثة مش موجودة.' };
    return res.redirect('/admin/flagged-chats');
  }
  const messages = messageRepo.findByConversation(conversation.id);
  res.render('admin/flagged-chat-detail', { title: 'تفاصيل المحادثة', conversation, messages });
}

function unflagChat(req, res) {
  conversationRepo.unflagConversation(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'المحادثة اتمسحت من قائمة المشبوهة.' };
  res.redirect('/admin/flagged-chats');
}

function listUsers(req, res) {
  const users = userRepo.findAllNonAdmin();
  res.render('admin/users', { title: 'المستخدمون', users });
}

function suspendUser(req, res) {
  userRepo.setStatus(Number(req.params.id), 'suspended');
  req.session.flash = { type: 'success', text: 'المستخدم اتوقف مؤقتاً.' };
  res.redirect('/admin/users');
}

function activateUser(req, res) {
  userRepo.setStatus(Number(req.params.id), 'active');
  req.session.flash = { type: 'success', text: 'المستخدم اتفعّل تاني.' };
  res.redirect('/admin/users');
}

function listReports(req, res) {
  const reports = reportRepo.findAll();
  res.render('admin/reports', { title: 'بلاغات المنتجات', reports });
}

function dismissReport(req, res) {
  reportRepo.dismiss(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'تم تجاهل البلاغ.' };
  res.redirect('/admin/reports');
}

function disableReportedProduct(req, res) {
  const report = reportRepo.findById(Number(req.params.id));
  if (report && report.product_id) {
    const product = productRepo.findById(report.product_id);
    if (product) {
      productRepo.update(report.product_id, { ...product, status: 'inactive' });
    }
    reportRepo.dismissByProduct(report.product_id);
    req.session.flash = { type: 'success', text: 'تم تعطيل المنتج وإغلاق البلاغات.' };
  }
  res.redirect('/admin/reports');
}

function deleteReportedProduct(req, res) {
  const report = reportRepo.findById(Number(req.params.id));
  if (report && report.product_id) {
    reportRepo.dismissByProduct(report.product_id);
    productRepo.remove(report.product_id);
    req.session.flash = { type: 'success', text: 'تم حذف المنتج نهائياً وإغلاق البلاغات.' };
  }
  res.redirect('/admin/reports');
}

module.exports = {
  dashboard,
  listVendorApplications, viewIdCardImage, approveVendorApplication, rejectVendorApplication,
  listOrders, viewOrder,
  listReviews, hideReview, unhideReview,
  listStores, suspendStore, activateStore, listStoreProducts, toggleStoreProduct, deleteStoreProduct,
  listUsers, suspendUser, activateUser,
  listBanners, uploadBanner, deleteBanner, toggleBanner,
  listPopularSearches, createPopularSearch, deletePopularSearch, togglePopularSearch,
  listFlaggedChats, viewFlaggedChat, unflagChat,
  listReports, dismissReport, disableReportedProduct, deleteReportedProduct
};

// ─── OneSignal Push Notifications ──────────────────────────────
const oneSignalService = require('../services/onesignal.service');
const pushLogRepo = require('../repositories/pushLog.repo');

async function listPushNotifications(req, res) {
  const logs = pushLogRepo.findAll(100);
  const env = require('../config/env');
  res.render('admin/push-notifications', {
    title: 'إشعارات الموبايل',
    logs,
    oneSignalAppId: env.oneSignalAppId
  });
}

async function sendPushNotification(req, res) {
  const { title, message, url } = req.body;
  if (!title || !message) {
    req.session.flash = { type: 'error', text: 'العنوان والرسالة مطلوبان.' };
    return res.redirect('/admin/push-notifications');
  }
  const result = await oneSignalService.sendPushToAll({ title, message, url: url || null });
  pushLogRepo.create({
    adminUserId: req.session.user.id,
    title,
    message,
    url: url || null,
    onesignalId: result ? result.id : null,
    recipients: result ? (result.recipients || 0) : 0
  });
  if (result && result.id) {
    req.session.flash = { type: 'success', text: `تم إرسال الإشعار بنجاح. المستلمون: ${result.recipients || '?'}` };
  } else {
    req.session.flash = { type: 'error', text: 'حدث خطأ أثناء إرسال الإشعار. تحقق من إعدادات OneSignal.' };
  }
  res.redirect('/admin/push-notifications');
}

// ─── App Version Management ─────────────────────────────────────
const appSettingsRepo = require('../repositories/appSettings.repo');

function appVersionSettings(req, res) {
  const settings = appSettingsRepo.getAll();
  res.render('admin/app-version', { title: 'إدارة إصدار التطبيق', settings });
}

function saveAppVersionSettings(req, res) {
  const { latestVersion, minVersion, apkUrl, updateMessage, forceUpdate } = req.body;
  if (latestVersion) appSettingsRepo.set('app_latest_version', latestVersion.trim());
  if (minVersion)    appSettingsRepo.set('app_min_version', minVersion.trim());
  if (apkUrl !== undefined) appSettingsRepo.set('app_apk_url', apkUrl.trim());
  if (updateMessage) appSettingsRepo.set('app_update_message', updateMessage.trim());
  appSettingsRepo.set('app_force_update', forceUpdate ? '1' : '0');
  req.session.flash = { type: 'success', text: 'تم حفظ إعدادات التطبيق.' };
  res.redirect('/admin/app-version');
}

// ─── Classifieds Moderation ─────────────────────────────────────
const personalListingRepo = require('../repositories/personalListing.repo');

function listClassifiedsModeration(req, res) {
  const { search, status } = req.query;
  const listings = personalListingRepo.findAllForAdmin({
    search: search || '',
    moderationStatus: status || ''
  });
  res.render('admin/classifieds-moderation', {
    title: 'إشراف على إعلانات البيع',
    listings,
    currentSearch: search || '',
    currentStatus: status || ''
  });
}

function hideListing(req, res) {
  personalListingRepo.setModerationStatus(Number(req.params.id), 'hidden', 'تم إخفاؤه من قبل الإدارة');
  req.session.flash = { type: 'success', text: 'تم إخفاء الإعلان.' };
  res.redirect('/admin/classifieds-moderation');
}

function restoreListing(req, res) {
  personalListingRepo.setModerationStatus(Number(req.params.id), 'active', null);
  req.session.flash = { type: 'success', text: 'تم استعادة الإعلان.' };
  res.redirect('/admin/classifieds-moderation');
}

function removeListing(req, res) {
  personalListingRepo.setModerationStatus(Number(req.params.id), 'removed', 'تمت إزالته من قبل الإدارة');
  req.session.flash = { type: 'success', text: 'تم إزالة الإعلان.' };
  res.redirect('/admin/classifieds-moderation');
}

function permanentDeleteListing(req, res) {
  personalListingRepo.permanentDelete(Number(req.params.id));
  req.session.flash = { type: 'success', text: 'تم حذف الإعلان نهائياً.' };
  res.redirect('/admin/classifieds-moderation');
}

module.exports.listPushNotifications = listPushNotifications;
module.exports.sendPushNotification = sendPushNotification;
module.exports.appVersionSettings = appVersionSettings;
module.exports.saveAppVersionSettings = saveAppVersionSettings;
module.exports.listClassifiedsModeration = listClassifiedsModeration;
module.exports.hideListing = hideListing;
module.exports.restoreListing = restoreListing;
module.exports.removeListing = removeListing;
module.exports.permanentDeleteListing = permanentDeleteListing;
