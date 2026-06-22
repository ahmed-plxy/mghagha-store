# Capacitor Android — OneSignal & App Update Integration Guide

## 1. Install OneSignal Capacitor Plugin

```bash
npm install onesignal-capacitor
npx cap sync android
```

## 2. capacitor.config.json

```json
{
  "appId": "com.mghagha.store",
  "appName": "مغاغة ستور",
  "webDir": "public",
  "server": {
    "androidScheme": "https",
    "url": "https://mghagha-projectzip--josenberlo.replit.app"
  }
}
```

## 3. android/app/src/main/java/.../MainActivity.java

Add OneSignal initialization in `onCreate`:

```java
import com.onesignal.OneSignal;

@Override
public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // OneSignal Init
    OneSignal.initWithContext(this, "157460ff-c4f1-4fca-af04-a0740f39a14f");
    OneSignal.getNotificationClickHandler().addObserver(result -> {
        // Deep-link: notification click opens the correct page
        String url = result.getNotification().getLaunchURL();
        if (url != null && !url.isEmpty()) {
            // The WebView will navigate to this URL automatically via OneSignal
        }
    });
}
```

## 4. App Version Check on Startup

In your main JS entry point (loaded inside the Capacitor WebView), add:

```html
<script src="/js/app-update.js"></script>
<script>
  // Replace '1.0.0' with your actual build version
  document.addEventListener('DOMContentLoaded', function () {
    window.MghaghaApp.checkVersion('1.0.0');
  });
</script>
```

Or call from Capacitor's `App.addListener('appStateChange')` when the app resumes.

## 5. Notification Deep-Link Behaviour

When the admin sends a push notification with a URL:
- On web: OneSignal opens the URL in the browser tab.
- On Android: OneSignal's default behaviour opens the URL in the WebView inside the app, showing the correct page.

No extra code needed — the `url` field in the push payload handles it.

## 6. Environment Variables for Deployment (Replit)

In Replit → Secrets, set:
- `ONESIGNAL_APP_ID`    = `157460ff-c4f1-4fca-af04-a0740f39a14f`
- `ONESIGNAL_REST_API_KEY` = (your REST API key — never in source code)

## 7. Minimum Android Permissions (AndroidManifest.xml)

These are added automatically by the OneSignal Capacitor plugin:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```
