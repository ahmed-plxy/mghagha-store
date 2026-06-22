const express = require('express');
const router = express.Router();

const publicRoutes = require('./public.routes');
const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const vendorRoutes = require('./vendor.routes');
const adminRoutes = require('./admin.routes');
const notificationsRoutes = require('./notifications.routes');

router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationsRoutes);

module.exports = router;
