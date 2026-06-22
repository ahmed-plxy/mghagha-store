const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('يُسمح فقط برفع صور بصيغة JPEG أو PNG أو WEBP.'));
  }
  cb(null, true);
}

function makeStorage(...subDirParts) {
  const dir = path.join(UPLOADS_ROOT, ...subDirParts);
  return multer.diskStorage({
    destination: function (req, file, cb) {
      ensureDir(dir);
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    }
  });
}

// ID card images -> private, never statically served.
const vendorIdCardUpload = multer({
  storage: makeStorage('private', 'vendor-applications'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Store logos/covers -> public, statically served.
const storeImageUpload = multer({
  storage: makeStorage('public', 'stores'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Product images -> public, statically served.
const productImageUpload = multer({
  storage: makeStorage('public', 'products'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

function getRelativeUploadPath(file) {
  return path.relative(UPLOADS_ROOT, file.path).split(path.sep).join('/');
}

module.exports = {
  vendorIdCardUpload,
  storeImageUpload,
  productImageUpload,
  getRelativeUploadPath,
  MAX_FILE_SIZE
};
