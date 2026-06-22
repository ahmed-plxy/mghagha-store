const userRepo = require('../repositories/user.repo');
const db = require('../config/db');
const { isValidEmail, isValidFullName } = require('../utils/validators');
const { containsBannedWord } = require('../utils/blacklist');

function dashboard(req, res) {
  const user = userRepo.findById(req.session.user.id);
  let unreadMessageCount = 0;
  try {
    const row = db.prepare(`
      SELECT COUNT(*) AS c FROM messages m
      JOIN conversations cv ON cv.id = m.conversation_id
      WHERE cv.customer_id = ? AND m.sender_id != ? AND m.is_read = 0
    `).get(req.session.user.id, req.session.user.id);
    unreadMessageCount = row ? row.c : 0;
  } catch (e) {}

  res.render('customer/dashboard', {
    title: 'حسابي',
    fullUser: user,
    unreadMessageCount,
    errors: null,
    success: null
  });
}

function updateProfile(req, res) {
  const { fullName, email } = req.body;
  const errors = [];

  if (!isValidFullName(fullName)) errors.push('حط اسمك الحقيقي (3 حروف على الأقل).');
  else if (containsBannedWord(fullName)) errors.push('الاسم فيه كلمة ممنوعة.');
  if (email && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) errors.push('الإيميل مش صح.');
  }

  if (errors.length === 0 && email && email.trim() !== '') {
    const existing = userRepo.findByEmail(email.trim());
    if (existing && existing.id !== req.session.user.id) errors.push('الإيميل ده مستخدم.');
  }

  const user = userRepo.findById(req.session.user.id);
  let unreadMessageCount = 0;
  try {
    const row = db.prepare(`
      SELECT COUNT(*) AS c FROM messages m
      JOIN conversations cv ON cv.id = m.conversation_id
      WHERE cv.customer_id = ? AND m.sender_id != ? AND m.is_read = 0
    `).get(req.session.user.id, req.session.user.id);
    unreadMessageCount = row ? row.c : 0;
  } catch (e) {}

  if (errors.length > 0) {
    return res.status(400).render('customer/dashboard', {
      title: 'حسابي',
      fullUser: user,
      unreadMessageCount,
      errors,
      success: null
    });
  }

  const updated = userRepo.updateProfile(req.session.user.id, {
    fullName: fullName.trim(),
    email: email && email.trim() !== '' ? email.trim() : null
  });
  req.session.user = { ...req.session.user, fullName: updated.full_name };

  const freshUser = userRepo.findById(req.session.user.id);
  return res.render('customer/dashboard', {
    title: 'حسابي',
    fullUser: freshUser,
    unreadMessageCount,
    errors: null,
    success: 'تم حفظ بياناتك بنجاح ✓'
  });
}

module.exports = { dashboard, updateProfile };
