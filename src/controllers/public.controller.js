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
  'العربيات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 17H2a1 1 0 01-1-1v-3l2.3-5.8A2 2 0 015.2 6h13.6a2 2 0 011.9 1.2L23 13v3a1 1 0 01-1 1h-2"/>
    <circle cx="7" cy="17" r="2.5"/>
    <circle cx="17" cy="17" r="2.5"/>
    <path d="M9.5 17h5"/>
    <path d="M1 13h22"/>
  </svg>`,
  'الموبايلات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="3"/>
    <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>
    <line x1="9" y1="6" x2="15" y2="6"/>
    <line x1="9" y1="9.5" x2="15" y2="9.5" opacity=".4"/>
    <line x1="9" y1="12" x2="13" y2="12" opacity=".4"/>
  </svg>`,
  'أجهزة منزلية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <line x1="5" y1="10" x2="19" y2="10"/>
    <line x1="9" y1="6" x2="9" y2="8"/>
    <line x1="9" y1="14" x2="9" y2="18"/>
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
  </svg>`,
  'أثاث منزلي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 11V8a1 1 0 011-1h16a1 1 0 011 1v3"/>
    <rect x="1" y="11" width="22" height="7" rx="2"/>
    <line x1="4" y1="18" x2="4" y2="21"/>
    <line x1="20" y1="18" x2="20" y2="21"/>
    <path d="M3 14.5h4M17 14.5h4"/>
    <path d="M7 11v7M17 11v7"/>
  </svg>`,
  'أدوات المطبخ': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 10h16l-1.6 9a2 2 0 01-2 1.7H7.6A2 2 0 015.6 19L4 10z"/>
    <path d="M3 10h18"/>
    <path d="M8 10V7a1 1 0 011-1h6a1 1 0 011 1v3"/>
    <path d="M20 7c1.8.5 2.5 1.5 2.5 2.5"/>
    <path d="M4 7C2.2 7.5 1.5 8.5 1.5 9.5"/>
  </svg>`,
  'الحاسوب': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="13" rx="2"/>
    <path d="M2 20h20"/>
    <path d="M9.5 20L11 17h2l1.5 3"/>
    <rect x="5" y="7" width="14" height="7" rx="1" opacity=".25" fill="currentColor" stroke="none"/>
    <path d="M8 11h4M8 13.5h2" opacity=".5"/>
  </svg>`,
  'مواشي وحيوانات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 5c-1-3 1-5 3-4M16 5c1-3-1-5-3-4"/>
    <ellipse cx="12" cy="11.5" rx="6" ry="5"/>
    <path d="M6 11c-2.5.5-4 2-3.5 4.5M18 11c2.5.5 4 2 3.5 4.5"/>
    <circle cx="10" cy="11" r=".7" fill="currentColor" stroke="none"/>
    <circle cx="14" cy="11" r=".7" fill="currentColor" stroke="none"/>
    <path d="M10 15c.6.8 3.4.8 4 0"/>
    <path d="M10 8.5c.6-.5 3.4-.5 4 0"/>
  </svg>`,
  'المحاصيل الزراعية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="22" x2="12" y2="6"/>
    <path d="M12 17c-2-1.5-4-4-3-7 2 1 4 4 3 7z"/>
    <path d="M12 17c2-1.5 4-4 3-7-2 1-4 4-3 7z"/>
    <path d="M12 13c-1.5-1-2.5-3-2-5 1.5 1 2.5 3 2 5z"/>
    <path d="M12 13c1.5-1 2.5-3 2-5-1.5 1-2.5 3-2 5z"/>
    <path d="M12 9c-.8-.8-1-2-.5-3.5 1 .8 1.2 2 .5 3.5z"/>
    <path d="M12 9c.8-.8 1-2 .5-3.5-1 .8-1.2 2-.5 3.5z"/>
  </svg>`,
  'العقارات والأراضي': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 10.5L12 3l9 7.5V21H3V10.5z"/>
    <path d="M9 21V14h6v7"/>
    <rect x="10" y="6.5" width="4" height="3.5" rx=".5" opacity=".4" fill="currentColor" stroke="none"/>
    <path d="M3 21h18"/>
  </svg>`,
  'قسم المهن': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.8-3.8a6 6 0 01-7.94 7.94L6.6 20.4a2.12 2.12 0 01-3-3l6.94-6.94A6 6 0 0114.7 6.3z"/>
  </svg>`,
  'ملابس وأزياء': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
  </svg>`,
  'عطور وإكسسوارات': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9l6-7 6 7-6 13-6-13z"/>
    <path d="M6 9h12"/>
    <path d="M3 9l3-7M21 9l-3-7"/>
    <path d="M3 9L12 22M21 9L12 22"/>
  </svg>`,
  'مركبات مائية': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 20c1.5-1.5 4-1.5 5.5 0s4 1.5 5.5 0 4-1.5 5.5 0"/>
    <path d="M4 16l2-8h12l2 8H4z"/>
    <path d="M12 4v4"/>
    <path d="M12 4L7 10h5"/>
  </svg>`,
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

  res.render('public/products', {
    title: 'المنتجات',
    products,
    mainCategories,
    categories: allCategories,
    subCategories,
    areas,
    localSections,
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
