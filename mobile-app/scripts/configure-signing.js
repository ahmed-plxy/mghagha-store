#!/usr/bin/env node
/**
 * Injects Android release signing config into android/app/build.gradle
 *
 * What it does:
 * 1) Inserts signingConfigs { release { ... } } before buildTypes { ... } inside android { ... }
 * 2) Inserts signingConfig signingConfigs.release inside the release buildType
 * 3) Skips cleanly if the config is already present
 *
 * Required env vars at build time:
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

function findMatchingBrace(str, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < str.length; i++) {
    const ch = str[i];
    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) return i;
  }
  return -1;
}

function indexOfRegex(str, re, fromIndex = 0) {
  const slice = str.slice(fromIndex);
  const match = slice.match(re);
  if (!match) return -1;
  return fromIndex + match.index;
}

// If both pieces already exist, do nothing.
const alreadyHasSigningConfigs =
  content.includes('signingConfigs {') &&
  content.includes('release {') &&
  content.includes('storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "release.keystore")');

const alreadyHasReleaseSigningConfig =
  content.includes('signingConfig signingConfigs.release');

if (alreadyHasSigningConfigs && alreadyHasReleaseSigningConfig) {
  console.log('Release signing config already present — skipping');
  process.exit(0);
}

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

// Find android { ... }
const androidOpenIdx = indexOfRegex(content, /\bandroid\s*\{/);
if (androidOpenIdx === -1) {
  console.error('ERROR: could not find "android {" in build.gradle — aborting injection.');
  process.exit(1);
}

// Find buildTypes { ... } inside android { ... }
let buildTypesIdx = indexOfRegex(content, /\bbuildTypes\s*\{/, androidOpenIdx);

// Insert signingConfigs before buildTypes if not already present
if (!content.includes('signingConfigs {') || !content.includes('release {') || !content.includes('storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "release.keystore")')) {
  let insertIdx = androidOpenIdx;

  if (buildTypesIdx !== -1) {
    insertIdx = buildTypesIdx;
  } else {
    const androidLineEnd = content.indexOf('\n', androidOpenIdx);
    insertIdx = androidLineEnd !== -1 ? androidLineEnd + 1 : androidOpenIdx + 8;
  }

  content = content.slice(0, insertIdx) + signingBlock + content.slice(insertIdx);
  console.log('✔ Inserted signingConfigs block');
}

// Refresh buildTypes index after insertion
buildTypesIdx = indexOfRegex(content, /\bbuildTypes\s*\{/, androidOpenIdx);
if (buildTypesIdx === -1) {
  console.error('ERROR: could not find "buildTypes {" in build.gradle — cannot inject signingConfig into release.');
  process.exit(1);
}

// Find release { ... } inside buildTypes
const buildTypesOpenIdx = content.indexOf('{', buildTypesIdx);
if (buildTypesOpenIdx === -1) {
  console.error('ERROR: malformed buildTypes block — opening brace not found.');
  process.exit(1);
}

const buildTypesEndIdx = findMatchingBrace(content, buildTypesOpenIdx);
if (buildTypesEndIdx === -1) {
  console.error('ERROR: malformed buildTypes block — matching closing brace not found.');
  process.exit(1);
}

const buildTypesBlock = content.slice(buildTypesOpenIdx + 1, buildTypesEndIdx);
const releaseMatch = buildTypesBlock.match(/\brelease\s*\{/);

if (!releaseMatch) {
  console.error('ERROR: could not find "release {" inside buildTypes — cannot inject signingConfig.');
  process.exit(1);
}

const releaseStartInBuildTypes = releaseMatch.index;
const releaseOpenIdx = content.indexOf('{', buildTypesIdx + releaseStartInBuildTypes);
if (releaseOpenIdx === -1) {
  console.error('ERROR: malformed release block — opening brace not found.');
  process.exit(1);
}

const releaseEndIdx = findMatchingBrace(content, releaseOpenIdx);
if (releaseEndIdx === -1) {
  console.error('ERROR: malformed release block — matching closing brace not found.');
  process.exit(1);
}

const releaseBlock = content.slice(releaseOpenIdx + 1, releaseEndIdx);

if (!releaseBlock.includes('signingConfig signingConfigs.release')) {
  const insertionPoint = releaseOpenIdx + 1;
  const signingConfigLine = '\n            signingConfig signingConfigs.release\n';
  content = content.slice(0, insertionPoint) + signingConfigLine + content.slice(insertionPoint);
  console.log('✔ Added signingConfig to release buildType');
} else {
  console.log('Release buildType already has signingConfig — skipping');
}

// Final sanity check
if (!content.includes('signingConfig signingConfigs.release')) {
  console.error('ERROR: signingConfig was not injected successfully.');
  process.exit(1);
}

fs.writeFileSync(appBuildGradle, content, 'utf8');
console.log('✔ android/app/build.gradle written successfully');
