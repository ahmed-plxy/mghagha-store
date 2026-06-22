const personalListingRepo = require('../repositories/personalListing.repo');
const categoryRepo = require('../repositories/category.repo');
const popularSearchRepo = require('../repositories/popularSearch.repo');
const { productImageUpload, getRelativeUploadPath } = require('../middleware/upload');
const multer = require('multer');
const { containsBannedWord } = require('../utils/blacklist');

const CATEGORY_ICONS = {
  'العربيات': '🚗',
  'الموبايلات': '📱',
  'أجهزة منزلية': '❄️',
  'أثاث منزلي': '🛋️',
  'أدوات المطبخ': '🍳',
  'الحاسوب': '💻',
  'مواشي وحيوانات': '🐄',
  'المحاصيل الزراعية': '🌾',
  'العقارات والأراضي': '🏠',
  'قسم المهن': '🔧',
  'ملابس وأزياء': '👕',
  'عطور وإكسسوارات': '💎',
  'مركبات مائية': '⛵',
  'رياضة ولياقة': '🏋️'
};

const uploadMiddleware = productImageUpload.array('images', 6);

function slugify(text) {
  return text
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w-]/g, '')
    .toLowerCase()
    .substring(0, 60) + '-' + Date.now();
}

function buildAllSubs(mains) {
  const { subsMap } = categoryRepo.getStructuredCategories();
  const allSubs = {};
  mains.forEach(function(cat) {
    allSubs[cat.id] = (subsMap[cat.id] || []).map(function(s) {
      return { id: s.id, name: s.name };
    });
  });
  return allSubs;
}

function showSellForm(req, res) {
  const mains = categoryRepo.findMainCategories();
  const categoriesWithEmoji = mains.map(c => ({ ...c, emoji: CATEGORY_ICONS[c.name] || '📦' }));
  const allSubs = buildAllSubs(mains);
  res.render('customer/sell', {
    title: 'بيع حاجة',
    categories: categoriesWithEmoji,
    allSubs,
    errors: [],
    values: {}
  });
}

function submitListing(req, res) {
  uploadMiddleware(req, res, function (uploadErr) {
    const mains = categoryRepo.findMainCategories();
    const categoriesWithEmoji = mains.map(c => ({ ...c, emoji: CATEGORY_ICONS[c.name] || '📦' }));
    const allSubs = buildAllSubs(mains);

    const renderErrors = (errors, values = {}) => {
      res.status(422).render('customer/sell', {
        title: 'بيع حاجة',
        categories: categoriesWithEmoji,
        allSubs,
        errors,
        values
      });
    };

    if (uploadErr instanceof multer.MulterError || uploadErr) {
      return renderErrors(['حصل خطأ في رفع الصور. تأكد من الحجم والصيغة.'], req.body);
    }

    const { name, price, description, categoryId, condition, listingAttributes } = req.body;
    const errors = [];

    if (!name || !name.trim()) {
      errors.push('اكتب اسم الحاجة اللي بتبيعها');
    } else if (containsBannedWord(name)) {
      errors.push('اسم الإعلان فيه كلمة ممنوعة.');
    }
    if (description && containsBannedWord(description)) {
      errors.push('وصف الإعلان فيه كلمة ممنوعة.');
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      errors.push('اكتب سعر صح');
    }
    if (errors.length) return renderErrors(errors, req.body);

    // Build listing_attributes from dynamic attr_* fields + explicit listingAttributes JSON
    let attrsObj = {};
    try { attrsObj = JSON.parse(listingAttributes || '{}'); } catch (e) { attrsObj = {}; }
    // Also sweep for any attr_* fields sent directly (fallback)
    Object.keys(req.body).forEach(function(key) {
      if (key.startsWith('attr_') && req.body[key]) {
        const attrKey = key.replace('attr_', '');
        if (!attrsObj[attrKey]) attrsObj[attrKey] = req.body[key];
      }
    });

    const slug = slugify(name.trim());
    const listing = personalListingRepo.create({
      userId: req.session.user.id,
      categoryId: categoryId ? Number(categoryId) : null,
      name: name.trim(),
      slug,
      description: (description || '').trim(),
      price: Number(price),
      condition: condition || 'used',
      listingAttributes: JSON.stringify(attrsObj)
    });

    if (req.files && req.files.length > 0) {
      req.files.forEach((file, i) => {
        const relPath = getRelativeUploadPath(file);
        personalListingRepo.addImage(listing.id, relPath, i);
      });
    }

    req.session.flash = { type: 'success', text: 'تمام! إعلانك اتنشر بنجاح 🎉' };
    res.redirect('/classifieds/' + listing.slug);
  });
}

function myListings(req, res) {
  const listings = personalListingRepo.findByUser(req.session.user.id);
  const listingsWithImages = listings.map(l => ({
    ...l,
    images: personalListingRepo.findImages(l.id)
  }));
  res.render('customer/my-listings', {
    title: 'إعلاناتي',
    listings: listingsWithImages
  });
}

function markSold(req, res) {
  const listing = personalListingRepo.findById(req.params.id);
  if (!listing || listing.user_id !== req.session.user.id) {
    return res.status(403).render('errors/error', { title: 'ممنوع', message: 'مش ليك حق' });
  }
  personalListingRepo.updateStatus(req.params.id, 'sold');
  req.session.flash = { type: 'success', text: 'تم تعليم الإعلان كـ "متباع"' };
  res.redirect('/customer/my-listings');
}

function browseClassifieds(req, res) {
  const { search, categoryId } = req.query;
  const listings = personalListingRepo.findActive({
    search: search && search.trim() ? search.trim() : null,
    categoryId: categoryId ? Number(categoryId) : null
  });
  const listingsWithImages = listings.map(l => ({
    ...l,
    images: personalListingRepo.findImages(l.id)
  }));
  const categories = categoryRepo.findMainCategories();
  const popularSearches = popularSearchRepo.findActive();
  res.render('public/classifieds', {
    title: 'المستعمل — بيع وشراء في مغاغة',
    listings: listingsWithImages,
    categories,
    popularSearches,
    filters: { search: search || '', categoryId: categoryId || '' }
  });
}

function classifiedDetail(req, res) {
  const listing = personalListingRepo.findBySlug(req.params.slug);
  if (!listing || listing.status === 'inactive') {
    return res.status(404).render('errors/error', { title: 'غير موجود', message: 'الإعلان ده مش موجود' });
  }
  const images = personalListingRepo.findImages(listing.id);
  res.render('public/classified-detail', {
    title: listing.name,
    listing,
    images
  });
}

module.exports = { showSellForm, submitListing, myListings, markSold, browseClassifieds, classifiedDetail };
