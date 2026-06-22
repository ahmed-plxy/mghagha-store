const notificationRepo = require('../repositories/notification.repo');

function list(req, res) {
  const notifications = notificationRepo.findUnread(req.session.user.id, 50);
  notificationRepo.markAllRead(req.session.user.id);
  res.render('notifications/list', { title: 'الإشعارات', notifications });
}

function markRead(req, res) {
  notificationRepo.markRead(Number(req.params.id), req.session.user.id);
  res.redirect(req.body.redirectTo || '/notifications');
}

module.exports = { list, markRead };
