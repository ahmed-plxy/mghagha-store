const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/auth.controller');
const { requireGuest } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');
const env = require('../config/env');

// ─── Login / Logout ───────────────────────────────────────────────────────────
router.get('/login', requireGuest, authController.showLogin);
router.post('/login', requireGuest, loginLimiter, authController.login);
router.post('/logout', authController.logout);

// ─── Phone Registration (legacy — kept exactly as before) ─────────────────────
router.get('/register', requireGuest, authController.showRegister);
router.post('/register', requireGuest, registerLimiter, authController.register);

// ─── Email Registration ───────────────────────────────────────────────────────
router.get('/register-email', requireGuest, authController.showEmailRegister);
router.post('/register-email', requireGuest, registerLimiter, authController.emailRegister);

// ─── Email Verification ───────────────────────────────────────────────────────
router.get('/verify-email', authController.showVerifyEmail);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

// ─── Complete Profile (Google users without phone) ────────────────────────────
router.get('/complete-profile', authController.showCompleteProfile);
router.post('/complete-profile', authController.completeProfile);

// ─── Google OAuth ─────────────────────────────────────────────────────────────
if (env.googleClientId && env.googleClientSecret) {
  router.get('/google', requireGuest, passport.authenticate('google', { scope: ['profile', 'email'] }));
  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/login?error=google' }),
    authController.googleCallback
  );
}

module.exports = router;
