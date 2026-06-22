require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  dbPath: process.env.DB_PATH || './data/mghagha.sqlite',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  appBaseUrl: process.env.APP_BASE_URL || '',

  // OneSignal
  oneSignalAppId: process.env.ONESIGNAL_APP_ID || '',
  oneSignalRestApiKey: process.env.ONESIGNAL_REST_API_KEY || '',

  // Mailtrap SMTP (email verification codes)
  mailtrapHost: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  mailtrapPort: parseInt(process.env.MAILTRAP_PORT || '2525'),
  mailtrapUser: process.env.MAILTRAP_USERNAME || '',
  mailtrapPass: process.env.MAILTRAP_PASSWORD || '',
  mailtrapFrom: process.env.MAILTRAP_FROM || 'no-reply@mghagha.store.com',
};
