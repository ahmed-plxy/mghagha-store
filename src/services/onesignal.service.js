/**
 * onesignal.service.js
 *
 * Backend service for sending push notifications via OneSignal REST API.
 * Targets ALL subscribed users — this now includes real Android native users
 * registered via the @onesignal/capacitor-plugin SDK, as well as any web push subscribers.
 *
 * OneSignal automatically routes delivery per device type:
 *   - Android app users → FCM (Firebase Cloud Messaging) native push
 *   - Web users (if any) → Web Push
 *
 * No backend changes are needed to target Android vs web — OneSignal handles
 * routing based on how each device subscribed.
 */

const env = require('../config/env');

const BASE_URL = 'https://onesignal.com/api/v1';

/**
 * Send a push to ALL subscribed users (Android + Web).
 *
 * @param {object} opts
 * @param {string} opts.title    Notification title (bold on Android)
 * @param {string} opts.message  Notification body text
 * @param {string} [opts.url]    Deep-link / launch URL
 * @param {object} [opts.data]   Extra key-value pairs as additionalData
 */
async function sendPushToAll({ title, message, url, data }) {
  if (!env.oneSignalRestApiKey || !env.oneSignalAppId) {
    console.warn('[OneSignal] Missing credentials — skipping push.');
    return null;
  }

  const body = {
    app_id:              env.oneSignalAppId,
    included_segments:   ['Total Subscriptions'],
    headings:            { ar: title, en: title },
    contents:            { ar: message, en: message },
    // Android: use brand colour as notification accent/LED colour
    android_accent_color: '1e7a4c',
    // Small status-bar icon (built-in OneSignal fallback drawable)
    // Replace with your own drawable name once you add one to android/res/drawable/
    small_icon:          'ic_stat_onesignal_default',
  };

  if (url)  body.url  = url;
  if (data) body.data = data;

  try {
    const res = await fetch(`${BASE_URL}/notifications`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Key ${env.oneSignalRestApiKey}`,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (result.errors) {
      console.error('[OneSignal] sendPushToAll errors:', result.errors);
    } else {
      console.log(`[OneSignal] Sent — id: ${result.id}, recipients: ${result.recipients}`);
    }

    return result;
  } catch (err) {
    console.error('[OneSignal] sendPushToAll error:', err);
    return null;
  }
}

/**
 * Send a push to a specific OneSignal subscription ID.
 * Use for targeting a single user (e.g. order status updates).
 *
 * @param {string} subscriptionId  OneSignal subscription (player) ID
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.url]
 */
async function sendPushToUser(subscriptionId, { title, message, url }) {
  if (!env.oneSignalRestApiKey || !env.oneSignalAppId) {
    console.warn('[OneSignal] Missing credentials — skipping push.');
    return null;
  }

  const body = {
    app_id:                    env.oneSignalAppId,
    include_subscription_ids:  [subscriptionId],
    headings:                  { ar: title, en: title },
    contents:                  { ar: message, en: message },
    android_accent_color:      '1e7a4c',
  };

  if (url) body.url = url;

  try {
    const res = await fetch(`${BASE_URL}/notifications`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Key ${env.oneSignalRestApiKey}`,
      },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error('[OneSignal] sendPushToUser error:', err);
    return null;
  }
}

/**
 * Fetch delivery stats for a previously sent notification.
 */
async function getNotificationStats(notificationId) {
  if (!env.oneSignalRestApiKey || !env.oneSignalAppId) return null;
  try {
    const res = await fetch(
      `${BASE_URL}/notifications/${notificationId}?app_id=${env.oneSignalAppId}`,
      { headers: { Authorization: `Key ${env.oneSignalRestApiKey}` } }
    );
    return await res.json();
  } catch (err) {
    console.error('[OneSignal] getStats error:', err);
    return null;
  }
}

module.exports = { sendPushToAll, sendPushToUser, getNotificationStats };
