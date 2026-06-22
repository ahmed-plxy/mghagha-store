function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', text: 'لازم تدخل الأول عشان تشوف الصفحة دي.' };
    return res.redirect('/auth/login');
  }
  next();
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.session.user) {
      req.session.flash = { type: 'error', text: 'لازم تدخل الأول عشان تشوف الصفحة دي.' };
      return res.redirect('/auth/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('errors/error', { title: 'غير مصرح', message: 'لا تملك الصلاحية للوصول إلى هذه الصفحة.' });
    }
    next();
  };
}

module.exports = { requireAuth, requireGuest, requireRole };
