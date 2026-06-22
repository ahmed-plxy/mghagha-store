const conversationRepo = require('../repositories/conversation.repo');
const messageRepo = require('../repositories/message.repo');
const userRepo = require('../repositories/user.repo');
const notificationService = require('../services/notification.service');
const notificationRepo = require('../repositories/notification.repo');
const { isNonEmptyString } = require('../utils/validators');
const { containsBannedWord } = require('../utils/blacklist');

function list(req, res) {
  const conversations = conversationRepo.findByStore(req.store.id);
  res.render('vendor/messages/list', { title: 'الرسائل', conversations });
}

function view(req, res) {
  const conversation = conversationRepo.findById(Number(req.params.id));

  if (!conversation || conversation.store_id !== req.store.id) {
    req.session.flash = { type: 'error', text: 'المحادثة غير موجودة أو لا تملك صلاحية الوصول إليها.' };
    return res.redirect('/vendor/messages');
  }

  messageRepo.markConversationRead(conversation.id, req.session.user.id);
  notificationRepo.markReadByLink(req.session.user.id, '/vendor/messages/' + conversation.id);
  const messages = messageRepo.findByConversation(conversation.id);
  const customer = userRepo.findById(conversation.customer_id);

  res.render('vendor/messages/conversation', {
    title: 'محادثة مع ' + customer.full_name,
    conversation,
    customer,
    messages
  });
}

function send(req, res) {
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  const conversation = conversationRepo.findById(Number(req.params.id));

  if (!conversation || conversation.store_id !== req.store.id) {
    if (isAjax) return res.status(403).json({ error: 'forbidden' });
    req.session.flash = { type: 'error', text: 'المحادثة غير موجودة أو لا تملك صلاحية الوصول إليها.' };
    return res.redirect('/vendor/messages');
  }

  const { body } = req.body;
  if (!isNonEmptyString(body)) {
    if (isAjax) return res.status(400).json({ error: 'empty' });
    return res.redirect(`/vendor/messages/${conversation.id}`);
  }

  const trimmed = body.trim();

  if (containsBannedWord(trimmed)) {
    if (isAjax) return res.status(400).json({ error: 'banned', text: 'الرسالة دي فيها كلام ممنوع.' });
    req.session.flash = { type: 'error', text: 'الرسالة دي فيها كلام ممنوع ومش هتتبعت.' };
    return res.redirect(`/vendor/messages/${conversation.id}`);
  }

  const newMessage = messageRepo.create(conversation.id, req.session.user.id, trimmed);
  conversationRepo.touchLastMessage(conversation.id);

  notificationService.notifyNewMessage(
    conversation.customer_id,
    `/customer/messages/${conversation.id}`,
    req.store.store_name
  );

  if (isAjax) return res.json({ ok: true, message: newMessage });
  res.redirect(`/vendor/messages/${conversation.id}`);
}

function poll(req, res) {
  const conversation = conversationRepo.findById(Number(req.params.id));
  if (!conversation || conversation.store_id !== req.store.id) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const since = parseInt(req.query.since, 10) || 0;
  const messages = messageRepo.findSince(conversation.id, since);
  if (messages.length) {
    messageRepo.markConversationRead(conversation.id, req.session.user.id);
  }
  return res.json({ messages });
}

module.exports = { list, view, send, poll };
