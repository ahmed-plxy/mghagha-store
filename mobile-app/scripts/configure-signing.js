#!/usr/bin/env node
/**
 * Safer signer injector for android/app/build.gradle
 *
 * - Inserts signingConfigs { release { ... } } before buildTypes { ... }
 * - Adds signingConfig signingConfigs.release into the release buildType if missing
 * - Detects presence and skips if already applied
 *
 * Required envs at gradle build time (the script writes literal System.getenv(...) calls
 * into build.gradle so Gradle reads runtime envs):
 *   ANDROID_KEYSTORE_PATH
 *   ANDROID_KEYSTORE_PASSWORD
 *   ANDROID_KEY_ALIAS
 *   ANDROID_KEY_PASSWORD
 */
const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const appBuildGradle = path.join(androidDir, 'app', 'build.gradle');

if (!fs.existsSync(appBuildGradle)) {
  console.error('ERROR: android/app/build.gradle not found. Run "npx cap add android" before this script.');
  process.exit(1);
}

let content = fs.readFileSync(appBuildGradle, 'utf8');

// Quick guard: if already contains signingConfigs.release, skip
if (content.includes('signingConfigs.release') || content.includes('signingConfig signingConfigs.release')) {
  console.log('  Release signing config already present — skipping');
  process.exit(0);
}

// Build the signingConfigs block (Groovy syntax)
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

// We'll insert signingBlock before the 'buildTypes {' block inside the android { ... } section.
// If buildTypes isn't found, we'll insert right after the android { opening.

function indexOfRegex(str, re, fromIndex = 0) {
  const m = re.exec(str.slice(fromIndex));
  if (!m) return -1;
  return fromIndex + m.index;
}

const androidOpenIdx = indexOfRegex(content, /\bandroid\s*\{/, 0);
if (androidOpenIdx === -1) {
  console.error('ERROR: could not find "android {" in build.gradle — aborting injection.');
  process.exit(1);
}

// Find buildTypes opening after androidOpenIdx
const buildTypesIdx = indexOfRegex(content, /\bbuildTypes\s*\{/, androidOpenIdx);
let insertIdx = androidOpenIdx;
if (buildTypesIdx !== -1) {
  insertIdx = buildTypesIdx;
} else {
  // fallback: insert just after the android { line's end
  const androidLineEnd = content.indexOf('\n', androidOpenIdx);
  insertIdx = androidLineEnd !== -1 ? androidLineEnd + 1 : androidOpenIdx + 8;
}

// Insert signing block at insertIdx
content = content.slice(0, insertIdx) + signingBlock + content.slice(insertIdx);

// Now ensure that the release buildType contains `signingConfig signingConfigs.release`
// We'll try to find the release { ... } block inside the buildTypes we just located.
const buildTypesStart = indexOfRegex(content, /\bbuildTypes\s*\{/, androidOpenIdx);
if (buildTypesStart !== -1) {
  // Find the block range for buildTypes using simple brace counting
  function findMatchingBrace(str, startIdx) {
    let depth = 0;
    for (let i = startIdx; i < str.length; i++) {
      const ch = str[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) return i;
    }
    return -1;
  }
  const openIdx = content.indexOf('{', buildTypesStart);
  const btEnd = findMatchingBrace(content, openIdx);
  if (btEnd !== -1) {
    const buildTypesBlock = content.slice(openIdx + 1, btEnd);
    const releaseMatch = buildTypesBlock.match(/\brelease\s*\{/);
    if (releaseMatch) {
      // find release block start within the full content
      const releaseStartInBT = buildTypesStart + 1 + releaseMatch.index;
      const releaseOpenIdx = content.indexOf('{', releaseStartInBT);
      const releaseEnd = findMatchingBrace(content, releaseOpenIdx);
      if (releaseOpenIdx !== -1 && releaseEnd !== -1) {
        const releaseBlock = content.slice(releaseOpenIdx + 1, releaseEnd);
        if (!releaseBlock.includes('signingConfig')) {
          // insert signingConfig as the first line inside release block to be safe
          const insertionPoint = releaseOpenIdx + 1;
          const signingConfigLine = '\n            signingConfig signingConfigs.release\n';
          content = content.slice(0, insertionPoint) + signingConfigLine + content.slice(insertionPoint);
          console.log('✔ Added signingConfig to release buildType');
        } else {
          console.log('  release buildType already has signingConfig — skipping addition');
        }
      }
    } else {
      console.log('  No release buildType found inside buildTypes — signingConfig not added to release block');
    }
  }
}

// Write back the file
fs.writeFileSync(appBuildGradle, content, 'utf8');
console.log('✔ android/app/build.gradle written successfully');
