const fs = require('fs');
const path = require('path');
const { statusLabel } = require('../utils/orderStatus');
const notificationRepo = require('../repositories/notification.repo');
const messageRepo = require('../repositories/message.repo');

const translations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'locales', 'ar.json'), 'utf8')
);

function getNestedValue(obj, key) {
  return key.split('.').reduce(
    (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
    obj
  );
}

function t(key) {
  const value = getNestedValue(translations, key);
  return value !== undefined ? value : key;
}

module.exports = function localsMiddleware(req, res, next) {
  res.locals.t = t;
  res.locals.orderStatusLabel = statusLabel;
  res.locals.currentUser = req.session.user || null;
  res.locals.flashMessages = req.session.flash || null;
  res.locals.query = req.query || {};
  const env = require('../config/env');
  res.locals.googleEnabled = !!(env.googleClientId && env.googleClientSecret);
  res.locals.oneSignalAppId = env.oneSignalAppId || '';
  res.locals.unreadNotificationCount = req.session.user
    ? notificationRepo.countUnread(req.session.user.id)
    : 0;
  res.locals.unreadMessageCount = req.session.user
    ? messageRepo.countUnreadForUser(req.session.user.id)
    : 0;
  req.session.flash = null;
  next();
};
