const conversationRepo = require('../repositories/conversation.repo');
const messageRepo = require('../repositories/message.repo');
const storeRepo = require('../repositories/store.repo');
const notificationService = require('../services/notification.service');
const notificationRepo = require('../repositories/notification.repo');
const { isNonEmptyString } = require('../utils/validators');
const { containsBannedWord, getMatchedWord } = require('../utils/blacklist');

function list(req, res) {
  const conversations = conversationRepo.findByCustomer(req.session.user.id);
  res.render('customer/messages/list', { title: 'الرسائل', conversations });
}

function start(req, res) {
  const { storeId, productName, productUrl } = req.body;
  const store = storeRepo.findById(storeId);

  if (!store || store.status !== 'active') {
    req.session.flash = { type: 'error', text: 'المحل ده مش متاح دلوقتي.' };
    return res.redirect('/stores');
  }

  const conversation = conversationRepo.findOrCreate(req.session.user.id, store.id);

  if (productName) {
    const autoMsg = productUrl
      ? `أهلاً، أنا مهتم بالمنتج ده: ${productName}\n${productUrl}`
      : `أهلاً، أنا مهتم بالمنتج ده: ${productName}`;
    messageRepo.create(conversation.id, req.session.user.id, autoMsg);
    conversationRepo.touchLastMessage(conversation.id);
    notificationService.notifyNewMessage(
      store.owner_user_id,
      `/vendor/messages/${conversation.id}`,
      req.session.user.fullName
    );
  }

  res.redirect(`/customer/messages/${conversation.id}`);
}

function view(req, res) {
  const conversation = conversationRepo.findById(Number(req.params.id));

  if (!conversation || conversation.customer_id !== req.session.user.id) {
    req.session.flash = { type: 'error', text: 'المحادثة مش موجودة أو معكش صلاحية تدخل فيها.' };
    return res.redirect('/customer/messages');
  }

  messageRepo.markConversationRead(conversation.id, req.session.user.id);
  notificationRepo.markReadByLink(req.session.user.id, '/customer/messages/' + conversation.id);
  const messages = messageRepo.findByConversation(conversation.id);
  const store = storeRepo.findById(conversation.store_id);

  res.render('customer/messages/conversation', {
    title: 'محادثة مع ' + store.store_name,
    conversation,
    store,
    messages
  });
}

function send(req, res) {
  const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest';
  const conversation = conversationRepo.findById(Number(req.params.id));

  if (!conversation || conversation.customer_id !== req.session.user.id) {
    if (isAjax) return res.status(403).json({ error: 'forbidden' });
    req.session.flash = { type: 'error', text: 'المحادثة مش موجودة أو معكش صلاحية تدخل فيها.' };
    return res.redirect('/customer/messages');
  }

  const { body } = req.body;
  if (!isNonEmptyString(body)) {
    if (isAjax) return res.status(400).json({ error: 'empty' });
    return res.redirect(`/customer/messages/${conversation.id}`);
  }

  const trimmed = body.trim();

  if (containsBannedWord(trimmed)) {
    if (isAjax) return res.status(400).json({ error: 'banned', text: 'الرسالة دي فيها كلام ممنوع.' });
    req.session.flash = { type: 'error', text: 'الرسالة دي فيها كلام ممنوع ومش هتتبعت.' };
    return res.redirect(`/customer/messages/${conversation.id}`);
  }

  const newMessage = messageRepo.create(conversation.id, req.session.user.id, trimmed);
  conversationRepo.touchLastMessage(conversation.id);

  const store = storeRepo.findById(conversation.store_id);
  notificationService.notifyNewMessage(
    store.owner_user_id,
    `/vendor/messages/${conversation.id}`,
    req.session.user.fullName
  );

  if (isAjax) return res.json({ ok: true, message: newMessage });
  res.redirect(`/customer/messages/${conversation.id}`);
}

function poll(req, res) {
  const conversation = conversationRepo.findById(Number(req.params.id));
  if (!conversation || conversation.customer_id !== req.session.user.id) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const since = parseInt(req.query.since, 10) || 0;
  const messages = messageRepo.findSince(conversation.id, since);
  if (messages.length) {
    messageRepo.markConversationRead(conversation.id, req.session.user.id);
  }
  return res.json({ messages });
}

module.exports = { list, start, view, send, poll };
