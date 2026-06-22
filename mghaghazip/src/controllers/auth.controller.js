const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repo');
const areaRepo = require('../repositories/area.repo');
const emailVerifRepo = require('../repositories/emailVerification.repo');
const brevoService = require('../services/brevo.service');
const { isValidEgyptianPhone, isValidEmail, isValidPassword, isNonEmptyString, isValidFullName } = require('../utils/validators');
const { containsBannedWord } = require('../utils/blacklist');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setSessionUser(req, user) {
  req.session.user = {
    id: user.id,
    fullName: user.full_name,
    phone: user.phone || null,
    email: user.email || null,
    role: user.role,
    authProvider: user.auth_provider,
    emailVerified: !!user.email_verified,
  };
}

/**
 * Email/Google users must complete their area selection before accessing the app.
 */
function needsCompleteProfile(user) {
  if ((user.auth_provider === 'email' || user.auth_provider === 'google') && !user.area_id) {
    return true;
  }
  return false;
}

/**
 * Returns verification context { userId, email } from pending session OR
 * from an existing logged-in but unverified email user.
 */
function _getVerificationContext(req) {
  if (req.session.pendingVerification) {
    return req.session.pendingVerification;
  }
  if (req.session.user) {
    const u = userRepo.findById(req.session.user.id);
    if (u && u.auth_provider === 'email' && !u.email_verified) {
      return { userId: u.id, email: u.email };
    }
  }
  return null;
}

async function _sendVerification(user) {
  const { code } = emailVerifRepo.createVerification(user.id);
  await brevoService.sendVerificationEmail(user.email, code, user.full_name);
}

// ─── Login ────────────────────────────────────────────────────────────────────

function showLogin(req, res) {
  res.render('auth/login', { title: 'ادخل', errors: null, old: {} });
}

function login(req, res) {
  const { identifier, password } = req.body;
  const errors = [];

  if (!isNonEmptyString(identifier)) errors.push('رقم التليفون أو الإيميل مطلوب.');
  if (!isNonEmptyString(password))   errors.push('كلمة السر مطلوبة.');

  if (errors.length > 0) {
    return res.status(400).render('auth/login', { title: 'ادخل', errors, old: { identifier } });
  }

  const trimmed = identifier.trim();
  const user = userRepo.findByPhone(trimmed) || userRepo.findByEmail(trimmed);

  if (!user || !user.password_hash || user.password_hash === '__google_no_password__') {
    return res.status(401).render('auth/login', {
      title: 'ادخل',
      errors: ['البيانات اللي دخلتها مش صح.'],
      old: { identifier: trimmed },
    });
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).render('auth/login', {
      title: 'ادخل',
      errors: ['البيانات اللي دخلتها مش صح.'],
      old: { identifier: trimmed },
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).render('auth/login', {
      title: 'ادخل',
      errors: ['الحساب ده موقوف. تواصل مع الإدارة.'],
      old: { identifier: trimmed },
    });
  }

  // Unverified email users → send to verification, NOT a full session
  if (user.auth_provider === 'email' && !user.email_verified) {
    req.session.pendingVerification = { userId: user.id, email: user.email };
    req.session.flash = { type: 'info', text: 'لازم تفعّل الإيميل الأول. بعتنا لك كود جديد.' };
    _sendVerification(user).catch(e => console.error('[Brevo] resend on login failed:', e.message));
    return res.redirect('/auth/verify-email');
  }

  setSessionUser(req, user);
  req.session.flash = { type: 'success', text: 'دخلت بنجاح. أهلاً بيك!' };

  if (user.role === 'admin')  return res.redirect('/admin/dashboard');
  if (user.role === 'vendor') return res.redirect('/vendor/dashboard');
  return res.redirect('/');
}

// ─── Register (Phone — legacy, backend kept for existing users) ───────────────

function showRegister(req, res) {
  res.render('auth/register', { title: 'افتح حساب', errors: null, old: {} });
}

function register(req, res) {
  // This route is no longer linked from the UI but is kept so existing
  // phone-based accounts continue to work and no data is lost.
  const { fullName, phone, email, password, confirmPassword, areaId, agreeTerms } = req.body;
  const areas = areaRepo.findAllActive();
  const errors = [];

  if (!isValidFullName(fullName)) errors.push('حط اسمك الحقيقي (3 حروف على الأقل، بدون أرقام أو رموز).');
  else if (containsBannedWord(fullName)) errors.push('الاسم فيه كلمة ممنوعة.');
  if (!isValidEgyptianPhone(phone)) errors.push('رقم التليفون مش صح (مثال: 01012345678).');
  if (email && !isValidEmail(email)) errors.push('الإيميل مش صح.');
  if (!isValidPassword(password)) errors.push('كلمة السر لازم تكون 8 حروف على الأقل.');
  if (password !== confirmPassword) errors.push('كلمتين السر مش زي بعض.');
  if (!areaId) errors.push('اختار منطقتك أو قريتك.');
  if (!agreeTerms) errors.push('لازم توافق على سياسة الخصوصية واتفاقية البيع والشراء الأول.');

  if (errors.length === 0) {
    if (userRepo.findByPhone(phone.trim())) errors.push('رقم التليفون ده مستخدم.');
    if (isNonEmptyString(email) && userRepo.findByEmail(email.trim())) errors.push('الإيميل ده مستخدم.');
  }

  if (errors.length > 0) {
    return res.status(400).render('auth/register', {
      title: 'افتح حساب', errors, old: { fullName, phone, email, areaId }, areas,
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = userRepo.createUser({
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: isNonEmptyString(email) ? email.trim() : null,
    passwordHash,
    role: 'customer',
  });

  setSessionUser(req, user);
  req.session.flash = { type: 'success', text: 'حسابك اتعمل بنجاح، منور في متجر مغاغة!' };
  return res.redirect('/');
}

// ─── Register (Email) ─────────────────────────────────────────────────────────

function showEmailRegister(req, res) {
  res.render('auth/register-email', { title: 'افتح حساب بالإيميل', errors: null, old: {} });
}

async function emailRegister(req, res) {
  const { fullName, email, password, confirmPassword, agreeTerms } = req.body;
  const errors = [];

  if (!isValidFullName(fullName)) errors.push('حط اسمك الحقيقي (3 حروف على الأقل، بدون أرقام أو رموز).');
  else if (containsBannedWord(fullName)) errors.push('الاسم فيه كلمة ممنوعة.');
  if (!isNonEmptyString(email) || !isValidEmail(email)) errors.push('إيميل صحيح مطلوب.');
  if (!isValidPassword(password)) errors.push('كلمة السر لازم تكون 8 حروف على الأقل.');
  if (password !== confirmPassword) errors.push('كلمتين السر مش زي بعض.');
  if (!agreeTerms) errors.push('لازم توافق على سياسة الخصوصية واتفاقية البيع والشراء الأول.');

  if (errors.length === 0) {
    if (userRepo.findByEmail(email.trim())) errors.push('الإيميل ده مستخدم بالفعل.');
  }

  if (errors.length > 0) {
    return res.status(400).render('auth/register-email', {
      title: 'افتح حساب بالإيميل', errors, old: { fullName, email },
    });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = userRepo.createEmailUser({
    fullName: fullName.trim(),
    email: email.trim(),
    passwordHash,
  });

  // Store as PENDING — no full session until email is verified
  req.session.pendingVerification = { userId: user.id, email: user.email };

  try {
    await _sendVerification(user);
    req.session.flash = { type: 'info', text: 'بعتنالك كود تفعيل على إيميلك. فعّل حسابك عشان تكمل.' };
  } catch (e) {
    console.error('[Brevo] Initial send failed:', e.message);
    req.session.flash = { type: 'error', text: 'مقدرناش نبعت إيميل التفعيل دلوقتي — اضغط "ابعت كود جديد" بعد ما تدخل الصفحة.' };
  }

  return res.redirect('/auth/verify-email');
}

// ─── Email Verification ───────────────────────────────────────────────────────

function showVerifyEmail(req, res) {
  const ctx = _getVerificationContext(req);
  if (!ctx) return res.redirect('/auth/login');
  res.render('auth/verify-email', {
    title: 'تفعيل الإيميل',
    errors: null,
    old: {},
    email: ctx.email,
  });
}

function verifyEmail(req, res) {
  const ctx = _getVerificationContext(req);
  if (!ctx) return res.redirect('/auth/login');

  const { code } = req.body;
  const result = emailVerifRepo.verifyCode(ctx.userId, code || '');

  if (result === 'ok') {
    const user = userRepo.findById(ctx.userId);
    delete req.session.pendingVerification;
    setSessionUser(req, user);
    req.session.flash = { type: 'success', text: 'إيميلك اتفعّل بنجاح. أهلاً بيك في متجر مغاغة!' };
    return res.redirect(needsCompleteProfile(user) ? '/auth/complete-profile' : '/');
  }

  const errorMap = {
    expired:           'الكود انتهت صلاحيته. اطلب كود جديد.',
    too_many_attempts: 'عدد المحاولات تجاوز الحد. اطلب كود جديد.',
    wrong_code:        'الكود اللي دخلته غلط. حاول تاني.',
  };
  return res.status(400).render('auth/verify-email', {
    title: 'تفعيل الإيميل',
    errors: [errorMap[result] || 'حدث خطأ. حاول تاني.'],
    old: {},
    email: ctx.email,
  });
}

async function resendVerificationEmail(req, res) {
  const ctx = _getVerificationContext(req);
  if (!ctx) return res.redirect('/auth/login');

  const user = userRepo.findById(ctx.userId);
  if (!user || user.email_verified) return res.redirect('/');

  try {
    await _sendVerification(user);
    req.session.flash = { type: 'success', text: 'اتبعت كود جديد على إيميلك.' };
  } catch (e) {
    console.error('[Brevo] Resend failed:', e.message);
    req.session.flash = { type: 'error', text: 'مقدرناش نبعت الإيميل. حاول تاني بعد شوية.' };
  }
  return res.redirect('/auth/verify-email');
}

// ─── Google Callback ──────────────────────────────────────────────────────────

function googleCallback(req, res) {
  if (!req.user) return res.redirect('/auth/login?error=google');
  const user = req.user;
  if (user.status === 'suspended') return res.redirect('/auth/login?error=suspended');

  setSessionUser(req, user);

  if (needsCompleteProfile(user)) {
    return res.redirect('/auth/complete-profile');
  }

  req.session.flash = { type: 'success', text: 'دخلت بحساب جوجل بنجاح. أهلاً بيك!' };
  if (user.role === 'admin')  return res.redirect('/admin/dashboard');
  if (user.role === 'vendor') return res.redirect('/vendor/dashboard');
  return res.redirect('/');
}

// ─── Complete Profile (area + optional phone) ─────────────────────────────────

function showCompleteProfile(req, res) {
  if (!req.session.user) return res.redirect('/auth/login');
  const user = userRepo.findById(req.session.user.id);
  if (!user || !needsCompleteProfile(user)) return res.redirect('/');
  const areas = areaRepo.findAllActive();
  res.render('auth/complete-profile', {
    title: 'أكمل بياناتك',
    errors: null,
    old: {},
    areas,
    user,
  });
}

function completeProfile(req, res) {
  if (!req.session.user) return res.redirect('/auth/login');
  const user = userRepo.findById(req.session.user.id);
  if (!user || !needsCompleteProfile(user)) return res.redirect('/');

  const { phone, areaId } = req.body;
  const errors = [];

  if (!areaId) errors.push('اختار منطقتك أو قريتك — مطلوب.');

  if (isNonEmptyString(phone)) {
    if (!isValidEgyptianPhone(phone)) {
      errors.push('رقم التليفون مش صح (مثال: 01012345678).');
    } else {
      const existing = userRepo.findByPhone(phone.trim());
      if (existing && existing.id !== user.id) {
        errors.push('رقم التليفون ده متسجل بالفعل على حساب تاني.');
      }
    }
  }

  if (errors.length > 0) {
    const areas = areaRepo.findAllActive();
    return res.status(400).render('auth/complete-profile', {
      title: 'أكمل بياناتك', errors, old: { phone, areaId }, areas, user,
    });
  }

  const updatedUser = userRepo.updateAreaAndPhone(user.id, {
    areaId: parseInt(areaId),
    phone: isNonEmptyString(phone) ? phone.trim() : null,
  });
  setSessionUser(req, updatedUser);
  req.session.flash = { type: 'success', text: 'بياناتك اتحفظت بنجاح. أهلاً بيك!' };
  return res.redirect('/');
}

// ─── Logout ───────────────────────────────────────────────────────────────────

function logout(req, res) {
  req.session.destroy(() => res.redirect('/auth/login'));
}

module.exports = {
  showLogin, login,
  showRegister, register,
  showEmailRegister, emailRegister,
  showVerifyEmail, verifyEmail, resendVerificationEmail,
  googleCallback,
  showCompleteProfile, completeProfile,
  logout,
};
