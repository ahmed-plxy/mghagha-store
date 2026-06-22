/**
 * Post-sync configuration script.
 *
 * Runs AFTER "npx cap add android" / "npx cap sync android" on every CI build.
 * Performs three things:
 *   1. Injects release signing config into android/app/build.gradle
 *   2. Enables OneSignal Gradle plugin in android/app/build.gradle
 *   3. Adds OneSignal classpath to the root android/build.gradle
 *
 * Required env vars at gradle build time:
 *   ANDROID_KEYSTORE_PATH      – path to decoded .jks file
 *   ANDROID_KEYSTORE_PASSWORD  – store password
 *   ANDROID_KEY_ALIAS          – key alias
 *   ANDROID_KEY_PASSWORD       – key password (often same as store password)
 */

const fs   = require('fs');
const path = require('path');

const androidDir      = path.join(__dirname, '..', 'android');
const appBuildGradle  = path.join(androidDir, 'app', 'build.gradle');
const rootBuildGradle = path.join(androidDir, 'build.gradle');

// ── 1. Verify android/ exists ────────────────────────────────────────────────
if (!fs.existsSync(appBuildGradle)) {
  console.error(
    'ERROR: android/app/build.gradle not found. Run "npx cap add android" before this script.'
  );
  process.exit(1);
}

let appContent  = fs.readFileSync(appBuildGradle, 'utf8');
let rootContent = fs.existsSync(rootBuildGradle) ? fs.readFileSync(rootBuildGradle, 'utf8') : '';

// ── 2. Release signing config ─────────────────────────────────────────────────
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

// ── 3. OneSignal apply plugin in app/build.gradle ────────────────────────────
if (!appContent.includes("apply plugin: 'com.onesignal.androidsdk.onesignal-gradle-plugin'")) {
  if (appContent.match(/^apply plugin:/m)) {
    appContent = appContent.replace(
      /^(apply plugin:.*)/m,
      "$1\napply plugin: 'com.onesignal.androidsdk.onesignal-gradle-plugin'"
    );
  } else {
    appContent = "apply plugin: 'com.onesignal.androidsdk.onesignal-gradle-plugin'\n" + appContent;
  }
  console.log('✔ OneSignal Gradle plugin applied to android/app/build.gradle');
} else {
  console.log('  OneSignal Gradle plugin already present — skipping');
}

// ── 4. OneSignal classpath in root build.gradle ───────────────────────────────
if (rootContent && !rootContent.includes('onesignal-gradle-plugin')) {
  rootContent = rootContent.replace(
    /dependencies\s*\{/,
    `dependencies {\n        classpath 'gradle.plugin.com.onesignal:onesignal-gradle-plugin:[0.12.10, 0.99.99]'`
  );
  fs.writeFileSync(rootBuildGradle, rootContent);
  console.log('✔ OneSignal classpath added to android/build.gradle');
} else if (!rootContent) {
  console.warn('  WARN: root build.gradle not found — OneSignal classpath NOT added');
} else {
  console.log('  OneSignal classpath already in root build.gradle — skipping');
}

// ── 5. Write app/build.gradle ────────────────────────────────────────────────
fs.writeFileSync(appBuildGradle, appContent);
console.log('✔ android/app/build.gradle written successfully');
