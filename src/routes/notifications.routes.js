const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');
const notificationRepo = require('../repositories/notification.repo');
const messageRepo = require('../repositories/message.repo');

router.use(requireAuth);
router.get('/', notificationController.list);
router.post('/:id/read', notificationController.markRead);

router.get('/api/badge-counts', function(req, res) {
  res.json({
    unreadNotifications: notificationRepo.countUnread(req.session.user.id),
    unreadMessages: messageRepo.countUnreadForUser(req.session.user.id)
  });
});

module.exports = router;
