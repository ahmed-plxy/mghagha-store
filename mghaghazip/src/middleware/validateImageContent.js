const fs = require('fs');
const { isValidImageFile } = require('../utils/fileSignature');

function collectFiles(req) {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === 'object') {
    return Object.values(req.files).flat();
  }
  return [];
}

/**
 * Runs AFTER multer. Re-validates each uploaded file's real bytes
 * against known image signatures. If any file fails, every file from
 * this request is deleted from disk (no orphaned uploads) and the
 * request is rejected.
 */
function validateImageContent(req, res, next) {
  const files = collectFiles(req);
  if (files.length === 0) return next();

  for (const file of files) {
    if (!isValidImageFile(file.path)) {
      for (const f of files) {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      }
      return res.status(400).render('errors/error', {
        title: 'تعذر إكمال الطلب',
        message: 'محتوى الملف المرفوع لا يطابق صيغة صورة صالحة (JPEG/PNG/WEBP).'
      });
    }
  }

  next();
}

module.exports = validateImageContent;
