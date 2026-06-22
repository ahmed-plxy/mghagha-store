const productRepo = require('../repositories/product.repo');
const productImageRepo = require('../repositories/productImage.repo');
const categoryRepo = require('../repositories/category.repo');
const slugService = require('../services/slug.service');
const { getRelativeUploadPath } = require('../middleware/upload');
const { isNonEmptyString } = require('../utils/validators');
const { containsBannedWord } = require('../utils/blacklist');

function buildRenderData(overrides = {}) {
  const { mains, subsMap } = categoryRepo.getStructuredCategories();
  return {
    mainCategories: mains,
    subsMap: JSON.stringify(subsMap),
    ...overrides
  };
}

function parseAttributes(body) {
  const attrs = {};
  const attrKeys = Object.keys(body).filter(k => k.startsWith('attr_'));
  for (const key of attrKeys) {
    const field = key.replace('attr_', '');
    if (body[key] && body[key].toString().trim()) {
      attrs[field] = body[key].toString().trim();
    }
  }
  return Object.keys(attrs).length > 0 ? attrs : null;
}

function list(req, res) {
  const products = productRepo.findAllByStore(req.store.id);
  res.render('vendor/products/list', {
    title: 'منتجاتي',
    products
  });
}

function showCreateForm(req, res) {
  const { mains, subsMap } = categoryRepo.getStructuredCategories();
  res.render('vendor/products/form', {
    title: 'إضافة منتج جديد',
    mode: 'create',
    mainCategories: mains,
    subsMap: JSON.stringify(subsMap),
    product: null,
    productAttrs: {},
    images: [],
    errors: null,
    old: {}
  });
}

function validateProductInput(body) {
  const errors = [];
  const { name, description, price, quantity, shippingCost } = body;

  if (!isNonEmptyString(name)) {
    errors.push('اسم المنتج مطلوب.');
  } else if (containsBannedWord(name)) {
    errors.push('اسم المنتج فيه كلمة ممنوعة.');
  }

  if (description && containsBannedWord(description)) {
    errors.push('وصف المنتج فيه كلمة ممنوعة.');
  }

  const priceNum = Number(price);
  if (!price || isNaN(priceNum) || priceNum < 0) errors.push('حط سعر صح للمنتج.');

  const quantityNum = Number(quantity);
  if (quantity === undefined || quantity === '' || isNaN(quantityNum) || quantityNum < 0 || !Number.isInteger(quantityNum)) {
    errors.push('حط كمية صح.');
  }

  const shippingCostNum = Number(shippingCost);
  if (shippingCost === undefined || shippingCost === '' || isNaN(shippingCostNum) || shippingCostNum < 0) {
    errors.push('حط مصاريف شحن صحيحة لهذا المنتج.');
  }

  return errors;
}

function create(req, res) {
  const { mains, subsMap } = categoryRepo.getStructuredCategories();
  const { name, categoryId, description, price, quantity } = req.body;
  const errors = validateProductInput(req.body);

  if (errors.length > 0) {
    return res.status(400).render('vendor/products/form', {
      title: 'إضافة منتج جديد',
      mode: 'create',
      mainCategories: mains,
      subsMap: JSON.stringify(subsMap),
      product: null,
      productAttrs: {},
      images: [],
      errors,
      old: req.body
    });
  }

  const slug = slugService.generateUniqueSlug(
    name,
    (candidate) => productRepo.slugExistsInStore(req.store.id, candidate)
  );

  const productAttributes = parseAttributes(req.body);

  const product = productRepo.create({
    storeId: req.store.id,
    categoryId: categoryId ? Number(categoryId) : null,
    name: name.trim(),
    slug,
    description: isNonEmptyString(description) ? description.trim() : null,
    productAttributes,
    price: Number(price),
    quantity: Number(quantity),
    status: 'active',
    shippingCost: Number(req.body.shippingCost)
  });

  const files = req.files || [];
  files.forEach((file, index) => {
    productImageRepo.create(product.id, getRelativeUploadPath(file), index);
  });

  req.session.flash = { type: 'success', text: 'المنتج اتضاف بنجاح.' };
  res.redirect('/vendor/products');
}

function showEditForm(req, res) {
  const product = productRepo.findById(req.params.id);
  if (!product || product.store_id !== req.store.id) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود أو معكش صلاحية تشوفه.' };
    return res.redirect('/vendor/products');
  }
  const { mains, subsMap } = categoryRepo.getStructuredCategories();
  const images = productImageRepo.findByProduct(product.id);

  let parsedAttrs = {};
  try {
    parsedAttrs = product.product_attributes ? JSON.parse(product.product_attributes) : {};
  } catch (e) { parsedAttrs = {}; }

  res.render('vendor/products/form', {
    title: 'تعديل المنتج',
    mode: 'edit',
    mainCategories: mains,
    subsMap: JSON.stringify(subsMap),
    product,
    productAttrs: parsedAttrs,
    images,
    errors: null,
    old: {}
  });
}

function update(req, res) {
  const product = productRepo.findById(req.params.id);
  if (!product || product.store_id !== req.store.id) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود أو معكش صلاحية تشوفه.' };
    return res.redirect('/vendor/products');
  }

  const { mains, subsMap } = categoryRepo.getStructuredCategories();
  const { name, categoryId, description, price, quantity } = req.body;
  const errors = validateProductInput(req.body);

  if (errors.length > 0) {
    const images = productImageRepo.findByProduct(product.id);
    let parsedAttrs = {};
    try { parsedAttrs = product.product_attributes ? JSON.parse(product.product_attributes) : {}; } catch (e) {}
    return res.status(400).render('vendor/products/form', {
      title: 'تعديل المنتج',
      mode: 'edit',
      mainCategories: mains,
      subsMap: JSON.stringify(subsMap),
      product,
      productAttrs: parsedAttrs,
      images,
      errors,
      old: req.body
    });
  }

  let slug = product.slug;
  if (name.trim() !== product.name) {
    slug = slugService.generateUniqueSlug(
      name,
      (candidate) => productRepo.slugExistsInStore(req.store.id, candidate)
    );
  }

  const productAttributes = parseAttributes(req.body);

  productRepo.update(product.id, {
    categoryId: categoryId ? Number(categoryId) : null,
    name: name.trim(),
    slug,
    description: isNonEmptyString(description) ? description.trim() : null,
    productAttributes,
    price: Number(price),
    quantity: Number(quantity),
    shippingCost: Number(req.body.shippingCost)
  });

  const files = req.files || [];
  if (files.length > 0) {
    const existingImages = productImageRepo.findByProduct(product.id);
    const startOrder = existingImages.length;
    files.forEach((file, index) => {
      productImageRepo.create(product.id, getRelativeUploadPath(file), startOrder + index);
    });
  }

  req.session.flash = { type: 'success', text: 'المنتج اتحدث بنجاح.' };
  res.redirect('/vendor/products');
}

function remove(req, res) {
  const product = productRepo.findById(req.params.id);
  if (!product || product.store_id !== req.store.id) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود أو معكش صلاحية تشوفه.' };
    return res.redirect('/vendor/products');
  }

  try {
    productRepo.remove(product.id);
    req.session.flash = { type: 'success', text: 'المنتج اتمسح.' };
  } catch (err) {
    req.session.flash = {
      type: 'error',
      text: 'مش ممكن تمسح المنتج ده عشان في طلبات مرتبطة بيه. قفّله بدل ما تمسحه.'
    };
  }

  res.redirect('/vendor/products');
}

function toggleStatus(req, res) {
  const product = productRepo.findById(req.params.id);
  if (!product || product.store_id !== req.store.id) {
    req.session.flash = { type: 'error', text: 'المنتج مش موجود أو معكش صلاحية تشوفه.' };
    return res.redirect('/vendor/products');
  }

  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  productRepo.update(product.id, { status: newStatus });

  req.session.flash = { type: 'success', text: 'حالة المنتج اتحدثت.' };
  res.redirect('/vendor/products');
}

module.exports = {
  list, showCreateForm, create, showEditForm, update, remove, toggleStatus
};
