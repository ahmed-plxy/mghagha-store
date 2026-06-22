/**
 * Email service — uses Mailtrap SMTP via nodemailer.
 * File kept as brevo.service.js so all existing imports continue working.
 */
const nodemailer = require('nodemailer');
const env = require('../config/env');

function _createTransport() {
  return nodemailer.createTransport({
    host: env.mailtrapHost,
    port: env.mailtrapPort,
    auth: {
      user: env.mailtrapUser,
      pass: env.mailtrapPass,
    },
  });
}

/**
 * Send the 6-digit verification code to a newly registered email user.
 */
async function sendVerificationEmail(toEmail, code, fullName) {
  if (!env.mailtrapUser || !env.mailtrapPass) {
    throw new Error('Mailtrap credentials not configured (MAILTRAP_USERNAME / MAILTRAP_PASSWORD).');
  }

  const displayName = fullName || 'مستخدم';
  const html = `
    <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:0;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#1e7a4c,#155c38);padding:32px 28px;text-align:center;">
        <p style="color:#fff;font-size:28px;margin:0;font-weight:bold;">🛍️ متجر مغاغة</p>
        <p style="color:#a7f3d0;font-size:14px;margin:8px 0 0;">تفعيل الحساب</p>
      </div>
      <div style="padding:28px 28px 24px;background:#fff;">
        <h2 style="color:#111;margin:0 0 12px;font-size:20px;">أهلاً ${displayName}!</h2>
        <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
          شكراً لتسجيلك في <strong>متجر مغاغة</strong>.<br/>
          استخدم الكود التالي لتفعيل حسابك — صالح لمدة <strong>15 دقيقة</strong> فقط.
        </p>
        <div style="background:#f0fdf4;border:2px dashed #6ee7b7;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="color:#1e7a4c;font-size:42px;font-weight:900;letter-spacing:12px;margin:0;font-family:monospace;">${code}</p>
        </div>
        <p style="color:#999;font-size:12px;line-height:1.6;margin:0;">
          لو مسجلتش في متجر مغاغة، تجاهل الرسالة دي.<br/>
          لا تشارك الكود ده مع أي حد.
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px 28px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#bbb;font-size:11px;margin:0;">متجر مغاغة &mdash; مغاغة، المنيا، مصر</p>
      </div>
    </div>
  `;

  const transporter = _createTransport();
  await transporter.sendMail({
    from: `"متجر مغاغة" <${env.mailtrapFrom}>`,
    to: toEmail,
    subject: `${code} — كود تفعيل حسابك في متجر مغاغة`,
    html,
  });
}

module.exports = { sendVerificationEmail };
