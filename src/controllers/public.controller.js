const storeRepo = require('../repositories/store.repo');
const productRepo = require('../repositories/product.repo');
const productImageRepo = require('../repositories/productImage.repo');
const categoryRepo = require('../repositories/category.repo');
const areaRepo = require('../repositories/area.repo');
const reviewRepo = require('../repositories/review.repo');
const wishlistRepo = require('../repositories/wishlist.repo');
const personalListingRepo = require('../repositories/personalListing.repo');
const bannerRepo = require('../repositories/banner.repo');
const popularSearchRepo = require('../repositories/popularSearch.repo');

const CATEGORY_ICONS = {
  // ── Cars ──────────────────────────────────────────────────────────────────
  'العربيات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 11L8.5 5.5h7l2.5 5.5"/>
    <rect x="1.5" y="11" width="21" height="5" rx="1.5"/>
    <circle cx="6.5" cy="17.5" r="1.8"/>
    <circle cx="17.5" cy="17.5" r="1.8"/>
    <path d="M8.3 17.5h7.4"/>
    <path d="M1.5 13.5H4M20 13.5h2.5"/>
    <line x1="6" y1="11" x2="18" y2="11"/>
    <path d="M10 7V11M14.5 7V11"/>
  </svg>`,
  // ── Phones ────────────────────────────────────────────────────────────────
  'الموبايلات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5.5" y="1.5" width="13" height="21" rx="2.5"/>
    <path d="M10 5.5h4"/>
    <circle cx="12" cy="19.5" r="1.2" fill="currentColor" stroke="none"/>
    <line x1="9" y1="9" x2="15" y2="9" stroke-width="1.1" opacity=".45"/>
    <line x1="9" y1="11.5" x2="15" y2="11.5" stroke-width="1.1" opacity=".45"/>
    <line x1="9" y1="14" x2="13" y2="14" stroke-width="1.1" opacity=".45"/>
  </svg>`,
  // ── Home Appliances (washing machine) ─────────────────────────────────────
  'أجهزة منزلية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2"/>
    <line x1="2" y1="8.5" x2="22" y2="8.5"/>
    <circle cx="12" cy="15.5" r="4"/>
    <circle cx="12" cy="15.5" r="2"/>
    <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="8.5" cy="5.5" r="1" fill="currentColor" stroke="none"/>
    <line x1="15" y1="5.5" x2="18.5" y2="5.5"/>
  </svg>`,
  // ── Furniture (sofa) ──────────────────────────────────────────────────────
  'أثاث منزلي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 11.5V8.5a2 2 0 00-2-2H6a2 2 0 00-2 2v3"/>
    <rect x="2" y="11.5" width="20" height="6" rx="2"/>
    <path d="M6 17.5v3M18 17.5v3"/>
    <line x1="4.5" y1="20.5" x2="19.5" y2="20.5"/>
  </svg>`,
  // ── Kitchen (fork & knife) ────────────────────────────────────────────────
  'أدوات المطبخ': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <line x1="8" y1="2" x2="8" y2="22"/>
    <path d="M6 2v6a2 2 0 004 0V2"/>
    <line x1="17" y1="2" x2="17" y2="22"/>
    <path d="M14 2c0 4.5 6 4.5 6 9a6 6 0 01-6 5.5"/>
  </svg>`,
  // ── Computer (laptop) ─────────────────────────────────────────────────────
  'الحاسوب': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h16a1 1 0 011 1v11H3V5a1 1 0 011-1z"/>
    <path d="M1 16h22l-1.5 3H2.5L1 16z"/>
    <rect x="5" y="6.5" width="10" height="7" rx=".5" opacity=".12" fill="currentColor" stroke="none"/>
    <line x1="7" y1="10" x2="12" y2="10" opacity=".5" stroke-width="1.2"/>
    <line x1="7" y1="12.5" x2="10" y2="12.5" opacity=".5" stroke-width="1.2"/>
    <rect x="17" y="8" width="2" height="2.5" rx=".4" opacity=".3" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="18" r=".8" fill="currentColor" stroke="none"/>
  </svg>`,
  // ── Livestock (cow head) ──────────────────────────────────────────────────
  'مواشي وحيوانات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="12" cy="14" rx="7" ry="6"/>
    <path d="M5 10C3 9 1.5 7.5 2 6c.5-1.5 2.5-1.5 3-.5"/>
    <path d="M19 10c2-.5 3.5-2 3-3.5-.5-1.5-2.5-1.5-3-.5"/>
    <path d="M7.5 8C7.5 5.5 9.5 3.5 12 3.5S16.5 5.5 16.5 8"/>
    <circle cx="9.5" cy="13" r=".8" fill="currentColor" stroke="none"/>
    <circle cx="14.5" cy="13" r=".8" fill="currentColor" stroke="none"/>
    <path d="M10 16.5c.5.8 3.5.8 4 0"/>
    <ellipse cx="10.5" cy="17.5" rx="1.2" ry=".6" opacity=".35" fill="currentColor" stroke="none"/>
    <ellipse cx="13.5" cy="17.5" rx="1.2" ry=".6" opacity=".35" fill="currentColor" stroke="none"/>
  </svg>`,
  // ── Agriculture (wheat) ───────────────────────────────────────────────────
  'المحاصيل الزراعية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="22" x2="12" y2="6"/>
    <path d="M12 18c-2.5-1-4.5-4-4-7 2 .5 4 3.5 4 7z"/>
    <path d="M12 18c2.5-1 4.5-4 4-7-2 .5-4 3.5-4 7z"/>
    <path d="M12 13.5c-2-.8-3.5-3-3-5.5 1.5.8 3 3 3 5.5z"/>
    <path d="M12 13.5c2-.8 3.5-3 3-5.5-1.5.8-3 3-3 5.5z"/>
    <path d="M12 9c-.8-1-1-2.5-.5-4.5.8 1 1.2 2.5.5 4.5z"/>
    <path d="M12 9c.8-1 1-2.5.5-4.5-.8 1-1.2 2.5-.5 4.5z"/>
    <line x1="9.5" y1="22" x2="14.5" y2="22"/>
  </svg>`,
  // ── Real Estate (house) ───────────────────────────────────────────────────
  'العقارات والأراضي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 10.5L12 3l9 7.5V21H3V10.5z"/>
    <rect x="9" y="13.5" width="6" height="7.5"/>
    <rect x="4.5" y="11.5" width="3.5" height="3.5" rx=".5"/>
    <rect x="16" y="11.5" width="3.5" height="3.5" rx=".5"/>
    <line x1="3" y1="21" x2="21" y2="21"/>
  </svg>`,
  // ── Professions (briefcase) ───────────────────────────────────────────────
  'قسم المهن': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7.5" width="20" height="13.5" rx="2"/>
    <path d="M8 7.5V5.5a2 2 0 012-2h4a2 2 0 012 2v2"/>
    <line x1="2" y1="14" x2="22" y2="14"/>
    <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" opacity=".5"/>
  </svg>`,
  // ── Clothes (shirt — unchanged, already clear) ────────────────────────────
  'ملابس وأزياء': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
    <path d="M12 2v4" opacity=".3"/>
  </svg>`,
  // ── Perfumes & Accessories (perfume bottle) ───────────────────────────────
  'عطور وإكسسوارات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="9" width="10" height="12" rx="2.5"/>
    <path d="M9.5 9V7a2.5 2.5 0 015 0v2"/>
    <line x1="12" y1="4.5" x2="12" y2="7"/>
    <path d="M10.5 4.5h3" stroke-linecap="round"/>
    <circle cx="12" cy="4" r=".9" fill="currentColor" stroke="none"/>
    <path d="M10 13.5c.5 1.5 3.5 1.5 4 0"/>
    <line x1="12" y1="16" x2="12" y2="17.5" opacity=".4"/>
  </svg>`,
  // ── Water Vehicles (boat) ─────────────────────────────────────────────────
  'مركبات مائية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 20c1.5-1.5 4-1.5 5.5 0s4 1.5 5.5 0 4-1.5 5.5 0"/>
    <path d="M5 15.5L7 8h10l2 7.5H5z"/>
    <line x1="12" y1="3" x2="12" y2="8"/>
    <path d="M9 5l3-2 3 2"/>
  </svg>`,
  // ── Sports & Fitness (barbell) ────────────────────────────────────────────
  'رياضة ولياقة': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="5" width="2.5" height="14" rx="1.2"/>
    <rect x="15.5" y="5" width="2.5" height="14" rx="1.2"/>
    <rect x="2" y="8.5" width="4" height="7" rx="1.2"/>
    <rect x="18" y="8.5" width="4" height="7" rx="1.2"/>
    <line x1="8.5" y1="12" x2="15.5" y2="12"/>
  </svg>`
};

function getIcon(name) {
  return CATEGORY_ICONS[name] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/></svg>';
}

function landing(req, res) {
  const mainCategories = categoryRepo.findAllActive().filter(c => !c.parent_id).map(c => ({
    ...c,
    icon: getIcon(c.name)
  }));

  const featuredStores = storeRepo.findAllActive({}).slice(0, 6);

  const productsByCategory = {};
  mainCategories.forEach(cat => {
    const catProducts = productRepo.findPublicProducts({ categoryId: cat.id, limit: 8 });
    if (catProducts.length > 0) {
      productsByCategory[cat.id] = { category: cat, products: catProducts };
    }
  });

  const recentListings = personalListingRepo.findActive({ limit: 4 });
  const recentClassifieds = recentListings.map(l => ({
    ...l,
    images: personalListingRepo.findImages(l.id)
  }));

  let activeBanners = [];
  try { activeBanners = bannerRepo.findActive(); } catch (e) {}

  let popularSearches = [];
  try { popularSearches = popularSearchRepo.findActive(); } catch (e) {}

  res.render('public/landing', {
    title: 'الرئيسية',
    featuredStores,
    mainCategories,
    productsByCategory,
    recentClassifieds,
    activeBanners,
    popularSearches
  });
}

function listStores(req, res) {
  const { search, areaId } = req.query;
  const stores = storeRepo.findAllActive({
    search: search && search.trim() !== '' ? search.trim() : null,
    areaId: areaId ? Number(areaId) : null
  });
  const areas = areaRepo.findAllActive();
  res.render('public/stores', {
    title: 'المتاجر',
    stores,
    areas,
    filters: { search: search || '', areaId: areaId || '' }
  });
}

function storeProfile(req, res) {
  const store = storeRepo.findActiveBySlug(req.params.storeSlug);
  if (!store) {
    return res.status(404).render('errors/error', { title: 'غير موجود', message: 'المتجر غير موجود.' });
  }
  const products = productRepo.findActiveByStore(store.id);
  res.render('public/store-profile', { title: store.store_name, store, products });
}

const LOCAL_DISCOVERY_SECTIONS = [
  { key: 'cars',         title: 'سيارات مستعملة في مغاغة',   emoji: '🚗', categoryName: 'العربيات' },
  { key: 'appliances',   title: 'أجهزة منزلية مستعملة',       emoji: '❄️', categoryName: 'أجهزة منزلية' },
  { key: 'livestock',   title: 'مواشي وحيوانات',              emoji: '🐄', categoryName: 'مواشي وحيوانات' },
  { key: 'agriculture', title: 'المحاصيل الزراعية',            emoji: '🌾', categoryName: 'المحاصيل الزراعية' },
];

function listProducts(req, res) {
  const { search, categoryId, subCategoryId, areaId, minPrice, maxPrice } = req.query;
  const hasFilters = (search && search.trim()) || categoryId || subCategoryId || areaId || minPrice || maxPrice;

  const effectiveCategoryId = subCategoryId ? Number(subCategoryId) : (categoryId ? Number(categoryId) : null);

  const products = productRepo.findPublicProducts({
    search: search && search.trim() !== '' ? search.trim() : null,
    categoryId: subCategoryId ? null : (categoryId ? Number(categoryId) : null),
    subCategoryId: subCategoryId ? Number(subCategoryId) : null,
    areaId: areaId ? Number(areaId) : null,
    minPrice: minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null,
    maxPrice: maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null
  });

  const allCategories = categoryRepo.findAllActive();
  const mainCategories = allCategories.filter(c => !c.parent_id).map(c => ({
    ...c,
    icon: getIcon(c.name)
  }));
  const areas = areaRepo.findAllActive();

  let subCategories = [];
  if (categoryId) {
    subCategories = categoryRepo.findByParent(Number(categoryId));
  }

  let localSections = [];
  if (!hasFilters) {
    const allProducts = productRepo.findPublicProducts({});
    localSections = LOCAL_DISCOVERY_SECTIONS.map(sec => {
      const cat = allCategories.find(c => c.name === sec.categoryName);
      const sectionProducts = cat
        ? allProducts.filter(p => p.category_id === cat.id).slice(0, 8)
        : [];
      return { ...sec, categoryId: cat ? cat.id : null, products: sectionProducts };
    }).filter(s => s.products.length > 0);
  }

  let popularSearches = [];
  try { popularSearches = popularSearchRepo.findActive(); } catch (e) {}

  res.render('public/products', {
    title: 'المنتجات',
    products,
    mainCategories,
    categories: allCategories,
    subCategories,
    areas,
    localSections,
    popularSearches,
    hasFilters: !!hasFilters,
    filters: {
      search: search || '',
      categoryId: categoryId || '',
      subCategoryId: subCategoryId || '',
      areaId: areaId || '',
      minPrice: minPrice || '',
      maxPrice: maxPrice || ''
    }
  });
}

function productDetail(req, res) {
  const { storeSlug, productSlug } = req.params;
  const product = productRepo.findPublicByStoreSlugAndProductSlug(storeSlug, productSlug);
  if (!product) {
    return res.status(404).render('errors/error', { title: 'غير موجود', message: 'المنتج غير موجود.' });
  }
  const images = productImageRepo.findByProduct(product.id);
  const reviews = reviewRepo.findApprovedByProduct(product.id);
  const isWishlisted = req.session.user && req.session.user.role === 'customer'
    ? wishlistRepo.isInWishlist(req.session.user.id, product.id)
    : false;

  let category = null;
  let parentCategory = null;
  let isMobileCategory = false;
  if (product.category_id) {
    category = categoryRepo.findById ? categoryRepo.findById(product.category_id) : null;
    if (!category) {
      try {
        const db = require('../config/db');
        category = db.prepare('SELECT * FROM categories WHERE id = ?').get(product.category_id);
      } catch (e) {}
    }
    if (category && category.parent_id) {
      try {
        const db = require('../config/db');
        parentCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(category.parent_id);
      } catch (e) {}
    }
    const catSlug = (parentCategory || category || {}).slug || '';
    isMobileCategory = catSlug === 'mobiles' || catSlug === 'mobile-phones';
  }

  let parsedAttributes = {};
  if (product.product_attributes) {
    try { parsedAttributes = JSON.parse(product.product_attributes); } catch (e) {}
  }

  let relatedProducts = [];
  try {
    relatedProducts = productRepo.findPublicProducts({
      categoryId: product.category_id || undefined,
      limit: 7
    }).filter(p => p.id !== product.id).slice(0, 6);
  } catch (e) {}

  res.render('public/product-detail', {
    title: product.name,
    product,
    images,
    reviews,
    isWishlisted,
    isMobileCategory,
    parsedAttributes,
    relatedProducts,
    category,
    parentCategory
  });
}

function aboutPage(req, res) {
  res.render('public/about', { title: 'من نحن' });
}

function faqPage(req, res) {
  res.render('public/faq', { title: 'الأسئلة الشائعة' });
}

function helpPage(req, res) {
  res.render('public/help', { title: 'المساعدة والدعم' });
}

function privacyPage(req, res) {
  res.render('public/privacy', { title: 'سياسة الخصوصية' });
}

function termsPage(req, res) {
  res.render('public/terms', { title: 'اتفاقية البيع والشراء وسياسة الخصوصية' });
}

module.exports = { landing, listStores, storeProfile, listProducts, productDetail, aboutPage, faqPage, helpPage, privacyPage, termsPage };
