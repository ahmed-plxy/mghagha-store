/**
 * Post-sync configuration script.
 *
 * Runs AFTER "npx cap add android" / "npx cap sync android" on every CI build.
 * Performs one thing:
 *   1. Injects release signing config into android/app/build.gradle
 *
 * Required env vars at gradle build time:
 *   ANDROID_KEYSTORE_PATH      – path to decoded .jks file
 *   ANDROID_KEYSTORE_PASSWORD  – store password
 *   ANDROID_KEY_ALIAS          – key alias
 *   ANDROID_KEY_PASSWORD       – key password (often same as store password)
 */

const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const appBuildGradle = path.join(androidDir, 'app', 'build.gradle');

// ── 1. Verify android/ exists ────────────────────────────────────────────────
if (!fs.existsSync(appBuildGradle)) {
  console.error(
    'ERROR: android/app/build.gradle not found. Run "npx cap add android" before this script.'
  );
  process.exit(1);
}

let appContent = fs.readFileSync(appBuildGradle, 'utf8');

// ── 2. Release signing config ────────────────────────────────────────────────
if (!appContent.includes('signingConfigs.release')) {
  const signingBlock = `
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "release.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
`;
  appContent = appContent.replace(/android\s*\{/, (m) => `${m}\n${signingBlock}`);
  appContent = appContent.replace(/release\s*\{([^}]*)\}/, (m, inner) => {
    if (inner.includes('signingConfig')) return m;
    return `release {\n            signingConfig signingConfigs.release${inner}}`;
  });
  console.log('✔ Release signing config applied to android/app/build.gradle');
} else {
  console.log('  Release signing config already present — skipping');
}

// ── 3. Write app/build.gradle ────────────────────────────────────────────────
fs.writeFileSync(appBuildGradle, appContent);
console.log('✔ android/app/build.gradle written successfully');
