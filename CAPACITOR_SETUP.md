# Capacitor Android — OneSignal & App Update Integration Guide

## 1. Install OneSignal Capacitor Plugin

```bash
npm install @onesignal/capacitor-plugin
npx cap sync android
```

## 2. capacitor.config.json

```json
{
  "appId": "com.mghagha.store",
  "appName": "متجر مغاغة",
  "webDir": "www",
  "server": {
    "androidScheme": "https",
    "url": "https://mghaghazip--markoandahmed.replit.app"
  },
  "plugins": {
    "OneSignal": {
      "appId": "157460ff-c4f1-4fca-af04-a0740f39a14f"
    }
  }
}
```

## 3. www/index.html — OneSignal Initialization

The OneSignal plugin is initialized in `www/index.html` via the `deviceready` event.
The Capacitor SDK exposes `window.OneSignal` after `cap sync` and a native build.

```js
document.addEventListener('deviceready', function () {
  if (window.OneSignal) {
    window.OneSignal.initialize('157460ff-c4f1-4fca-af04-a0740f39a14f');
    window.OneSignal.Notifications.requestPermission(true);
  }
});
```

## 4. App Version Check on Startup

The `www/index.html` automatically fetches `/api/app-version` from the server on
`deviceready`. The server URL is derived from `window.location.origin` at runtime,
so it always matches the URL set in `capacitor.config.json`.

```js
fetch(SERVER_URL + '/api/app-version')
  .then(r => r.json())
  .then(data => { /* show update dialog if needed */ });
```

## 5. Notification Deep-Link Behaviour

When the admin sends a push notification with a URL:
- On Android: OneSignal opens the URL in the WebView inside the app.
- No extra code needed — the `url` field in the push payload handles it.

## 6. Environment Variables for Deployment (Replit)

In Replit → Secrets, set:
- `ONESIGNAL_APP_ID`       = `157460ff-c4f1-4fca-af04-a0740f39a14f`
- `ONESIGNAL_REST_API_KEY` = (your REST API key — never in source code)

## 7. GitHub Actions — Required Secrets

| Secret | Description |
|---|---|
| `APP_URL` | Live server URL (e.g. `https://mghaghazip--markoandahmed.replit.app`) |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore `.jks` file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (default: `mghagha`) |
| `ANDROID_KEY_PASSWORD` | Key password |

## 8. Minimum Android Permissions (AndroidManifest.xml)

Patched automatically by `scripts/patch-android-manifest.js` during CI:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

These are added on top of what the OneSignal Capacitor plugin itself declares
(`INTERNET`, `VIBRATE`, etc.).
