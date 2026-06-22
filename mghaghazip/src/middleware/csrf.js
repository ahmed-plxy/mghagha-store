const crypto = require('crypto');

/**
 * Lightweight session-based CSRF protection.
 * A token is generated once per session and exposed to every view as
 * res.locals.csrfToken. footer.ejs injects it into every POST form
 * automatically via a small script, so no individual view needs editing.
 *
 * NOTE: multipart/form-data (file upload) requests are intentionally
 * skipped here, because multer parses the body at the route level —
 * AFTER this global middleware runs — so req.body._csrf isn't populated
 * yet for those routes. Those routes remain protected by auth + role
 * checks only. This is a deliberate MVP scope decision, not an oversight.
 */
function csrfMiddleware(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  const isMultipart = req.is('multipart/form-data');

  if (req.method === 'POST' && !isMultipart) {
    const tokenFromBody = req.body && req.body._csrf;
    if (!tokenFromBody || tokenFromBody !== req.session.csrfToken) {
      return res.status(403).render('errors/error', {
        title: 'طلب غير صالح',
        message: 'انتهت صلاحية الجلسة أو الطلب غير صالح، يرجى تحديث الصفحة والمحاولة مرة أخرى.'
      });
    }
  }

  next();
}

module.exports = csrfMiddleware;
