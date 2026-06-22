---
name: Auth verification flow
description: How email registration and verification sessions work
---

After email registration, do NOT call setSessionUser immediately.
Store `req.session.pendingVerification = { userId, email }` instead.
Only call setSessionUser after the OTP code is successfully verified.

**Why:** Calling setSessionUser before verification lets users bypass email confirmation entirely.

**How to apply:**
- `emailRegister()` → stores pendingVerification, redirects to /auth/verify-email
- `login()` for unverified email users → same pattern
- `showVerifyEmail()` / `verifyEmail()` → read from pendingVerification OR session user (for existing unverified)
- After `verifyCode()` returns 'ok' → delete pendingVerification, call setSessionUser
- `/auth/verify-email` GET will redirect to /auth/login if neither context exists (correct behaviour)
