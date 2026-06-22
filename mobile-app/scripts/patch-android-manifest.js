/**
 * patch-android-manifest.js
 *
 * Ensures AndroidManifest.xml contains the POST_NOTIFICATIONS permission
 * required on Android 13+ (API 33+) for push notifications.
 *
 * OneSignal Capacitor SDK requests this at runtime via
 * Notifications.requestPermission(), but the permission still needs to be
 * declared in the manifest for the system to honour it.
 *
 * Also ensures RECEIVE_BOOT_COMPLETED is declared (needed for OneSignal
 * to re-register notifications after device reboot).
 *
 * Run after: npx cap sync android
 */

const fs   = require('fs');
const path = require('path');

const manifestPath = path.join(
  __dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'
);

if (!fs.existsSync(manifestPath)) {
  console.error('ERROR: AndroidManifest.xml not found — run "npx cap add android" first.');
  process.exit(1);
}

let xml     = fs.readFileSync(manifestPath, 'utf8');
let changed = false;

function ensurePermission(permName) {
  if (!xml.includes(permName)) {
    xml = xml.replace(
      /<application/,
      `<uses-permission android:name="${permName}"/>\n    <application`
    );
    console.log(`  ✔ Added permission: ${permName}`);
    changed = true;
  } else {
    console.log(`  ✓ Already present: ${permName}`);
  }
}

// Android 13+ push notification permission (API 33+)
ensurePermission('android.permission.POST_NOTIFICATIONS');

// Required for OneSignal to reschedule notifications after device reboot
ensurePermission('android.permission.RECEIVE_BOOT_COMPLETED');

if (changed) {
  fs.writeFileSync(manifestPath, xml);
  console.log('✔ AndroidManifest.xml updated');
} else {
  console.log('  No changes needed in AndroidManifest.xml');
}
