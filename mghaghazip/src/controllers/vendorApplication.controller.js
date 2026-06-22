const vendorApplicationRepo = require('../repositories/vendorApplication.repo');
const areaRepo = require('../repositories/area.repo');
const slugService = require('../services/slug.service');
const { getRelativeUploadPath } = require('../middleware/upload');
const { isNonEmptyString } = require('../utils/validators');

function showForm(req, res) {
  const pending = vendorApplicationRepo.findPendingByUser(req.session.user.id);
  const areas = areaRepo.findAllActive();
  res.render('vendor/apply', {
    title: 'طلب انضمام كبائع',
    areas,
    pendingApplication: pending || null,
    errors: null,
    old: {}
  });
}

function submit(req, res) {
  const existingPending = vendorApplicationRepo.findPendingByUser(req.session.user.id);
  if (existingPending) {
    req.session.flash = { type: 'error', text: 'عندك طلب قيد المراجعة دلوقتي.' };
    return res.redirect('/vendor/apply');
  }

  const { storeName, phone, fullAddress, areaId } = req.body;
  const errors = [];
  const areas = areaRepo.findAllActive();

  if (!isNonEmptyString(storeName)) errors.push('اسم المحل مطلوب.');
  if (!isNonEmptyString(phone)) errors.push('رقم التليفون مطلوب.');
  if (!isNonEmptyString(fullAddress)) errors.push('العنوان بالتفصيل مطلوب.');
  if (!areaId || !areaRepo.findById(areaId)) errors.push('اختار المنطقة.');

  const files = req.files || {};
  const frontFile = files.idCardFront ? files.idCardFront[0] : null;
  const backFile = files.idCardBack ? files.idCardBack[0] : null;

  if (!frontFile) errors.push('صورة البطاقة (الوجه الأمامي) مطلوبة.');
  if (!backFile) errors.push('صورة البطاقة (الوجه الخلفي) مطلوبة.');

  if (errors.length > 0) {
    return res.status(400).render('vendor/apply', {
      title: 'طلب انضمام كبائع',
      areas,
      pendingApplication: null,
      errors,
      old: { storeName, phone, fullAddress, areaId }
    });
  }

  const storeSlug = slugService.generateUniqueSlug(
    storeName,
    (candidate) => vendorApplicationRepo.storeSlugExists(candidate)
  );

  vendorApplicationRepo.create({
    userId: req.session.user.id,
    storeName: storeName.trim(),
    storeSlug,
    phone: phone.trim(),
    fullAddress: fullAddress.trim(),
    areaId: Number(areaId),
    idCardFront: getRelativeUploadPath(frontFile),
    idCardBack: getRelativeUploadPath(backFile)
  });

  req.session.flash = { type: 'success', text: 'طلبك اتبعت بنجاح، هيتراجع من الإدارة قريباً.' };
  res.redirect('/vendor/apply');
}

module.exports = { showForm, submit };
