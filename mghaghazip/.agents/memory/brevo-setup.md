---
name: Brevo email setup
description: How Brevo email sending is configured in this project
---

Brevo SMTP (nodemailer) always fails with "535 Authentication failed" regardless of credentials.
Use Brevo HTTP API instead: POST https://api.brevo.com/v3/smtp/email with `api-key` header.

**Why:** The SMTP relay requires exact account credentials that change; the API key is stable and simpler.

**How to apply:** See `src/services/brevo.service.js` — uses Node.js built-in `https` module, no extra packages.
Sender email is `BREVO_SENDER_EMAIL` env var. API key is `BREVO_API_KEY` secret.
Tested: Status 201 = success.
