/**
 * inject-icons.js
 *
 * Copies pre-generated Android icon PNG files from scripts/android-res/
 * into the live android/ project (after cap add/sync).
 *
 * Run order in CI:
 *   npx cap add android
 *   npx cap sync android
 *   node scripts/configure-signing.js
 *   node scripts/patch-android-manifest.js
 *   node scripts/inject-icons.js     ← this script
 *   ./gradlew assembleRelease
 *
 * Icon files expected in scripts/android-res/<mipmap-*>/:
 *   ic_launcher.png             – standard square launcher icon
 *   ic_launcher_round.png       – circular crop for launchers that request it
 *   ic_launcher_foreground.png  – adaptive icon foreground layer (transparent bg)
 *
 * Adaptive background colour (#1e7a4c) and XML are written automatically.
 */

const fs   = require('fs');
const path = require('path');

const resSource = path.join(__dirname, 'android-res');
const resDest   = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(resDest)) {
  console.error('ERROR: android/app/src/main/res not found. Run "npx cap add android" first.');
  process.exit(1);
}

const folders = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
];

let copied = 0;
for (const folder of folders) {
  const src = path.join(resSource, folder);
  const dst = path.join(resDest, folder);
  if (!fs.existsSync(src)) {
    console.warn(`  WARN: source folder missing: ${src}`);
    continue;
  }
  fs.mkdirSync(dst, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dst, file));
    console.log(`  ✔ ${folder}/${file}`);
    copied++;
  }
}

// ── Adaptive icon XML (Android 8+ / API 26+) ─────────────────────────────────
const anydpiDir = path.join(resDest, 'mipmap-anydpi-v26');
fs.mkdirSync(anydpiDir, { recursive: true });

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);
console.log('  ✔ mipmap-anydpi-v26/ic_launcher.xml');
console.log('  ✔ mipmap-anydpi-v26/ic_launcher_round.xml');

// ── Brand colour for adaptive background ─────────────────────────────────────
const valuesDir = path.join(resDest, 'values');
fs.mkdirSync(valuesDir, { recursive: true });

fs.writeFileSync(
  path.join(valuesDir, 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1e7a4c</color>
</resources>
`
);
console.log('  ✔ values/ic_launcher_background.xml (brand green #1e7a4c)');

console.log(`\nDone — ${copied} icon PNGs + adaptive XML injected into android/ ✔`);
