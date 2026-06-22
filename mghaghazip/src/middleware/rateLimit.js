const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('errors/error', {
      title: 'محاولات كثيرة',
      message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها، يرجى المحاولة مرة أخرى بعد 15 دقيقة.'
    });
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('errors/error', {
      title: 'محاولات كثيرة',
      message: 'تم تجاوز عدد محاولات إنشاء الحساب المسموح بها، يرجى المحاولة مرة أخرى لاحقًا.'
    });
  }
});

module.exports = { loginLimiter, registerLimiter };
