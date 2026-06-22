#!/usr/bin/env node
/**
 * Injects Android release signing config into android/app/build.gradle
 *
 * What it does:
 * 1) Inserts signingConfigs { release { ... } } before buildTypes { ... } inside android { ... }
 * 2) Inserts signingConfig signingConfigs.release inside the release buildType
 * 3) Removes/signals stale misplaced signingConfig lines inside buildTypes if needed
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

function replaceRange(str, start, end, replacement) {
  return str.slice(0, start) + replacement + str.slice(end);
}

function getBlockRangeByKeyword(str, keywordRegex, fromIndex = 0) {
  const keywordIdx = indexOfRegex(str, keywordRegex, fromIndex);
  if (keywordIdx === -1) return null;

  const openBraceIdx = str.indexOf('{', keywordIdx);
  if (openBraceIdx === -1) return null;

  const closeBraceIdx = findMatchingBrace(str, openBraceIdx);
  if (closeBraceIdx === -1) return null;

  return {
    keywordIdx,
    openBraceIdx,
    closeBraceIdx,
    bodyStart: openBraceIdx + 1,
    bodyEnd: closeBraceIdx,
    body: str.slice(openBraceIdx + 1, closeBraceIdx),
  };
}

const signingConfigsBlock = `
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
const androidBlock = getBlockRangeByKeyword(content, /\bandroid\s*\{/);
if (!androidBlock) {
  console.error('ERROR: could not find "android {" in build.gradle — aborting injection.');
  process.exit(1);
}

// Find buildTypes { ... } inside android block
const buildTypesIdx = indexOfRegex(content, /\bbuildTypes\s*\{/, androidBlock.bodyStart);
if (buildTypesIdx === -1 || buildTypesIdx > androidBlock.bodyEnd) {
  console.error('ERROR: could not find "buildTypes {" inside android block — aborting injection.');
  process.exit(1);
}

const buildTypesBlock = getBlockRangeByKeyword(content, /\bbuildTypes\s*\{/, androidBlock.bodyStart);
if (!buildTypesBlock || buildTypesBlock.keywordIdx > androidBlock.bodyEnd) {
  console.error('ERROR: malformed buildTypes block — aborting injection.');
  process.exit(1);
}

// Insert signingConfigs before buildTypes if not already present inside android block
const androidBody = content.slice(androidBlock.bodyStart, androidBlock.bodyEnd);
const hasSigningConfigsInAndroid = /\bsigningConfigs\s*\{/.test(androidBody);

if (!hasSigningConfigsInAndroid) {
  const insertIdx = buildTypesBlock.keywordIdx;
  content = replaceRange(content, insertIdx, insertIdx, signingConfigsBlock);
  console.log('✔ Inserted signingConfigs block');
}

// Recompute blocks after potential insertion
const refreshedAndroidBlock = getBlockRangeByKeyword(content, /\bandroid\s*\{/);
if (!refreshedAndroidBlock) {
  console.error('ERROR: could not re-read android block after insertion.');
  process.exit(1);
}

const refreshedBuildTypesBlock = getBlockRangeByKeyword(content, /\bbuildTypes\s*\{/, refreshedAndroidBlock.bodyStart);
if (!refreshedBuildTypesBlock) {
  console.error('ERROR: could not find buildTypes block after insertion.');
  process.exit(1);
}

// Find release { ... } inside buildTypes block
const buildTypesBody = content.slice(refreshedBuildTypesBlock.bodyStart, refreshedBuildTypesBlock.bodyEnd);
const releaseRelIdx = indexOfRegex(buildTypesBody, /\brelease\s*\{/);

if (releaseRelIdx === -1) {
  console.error('ERROR: could not find "release {" inside buildTypes — cannot inject signingConfig.');
  process.exit(1);
}

const releaseKeywordIdx = refreshedBuildTypesBlock.bodyStart + releaseRelIdx;
const releaseOpenIdx = content.indexOf('{', releaseKeywordIdx);
if (releaseOpenIdx === -1) {
  console.error('ERROR: malformed release block — opening brace not found.');
  process.exit(1);
}

const releaseEndIdx = findMatchingBrace(content, releaseOpenIdx);
if (releaseEndIdx === -1) {
  console.error('ERROR: malformed release block — matching closing brace not found.');
  process.exit(1);
}

const releaseBody = content.slice(releaseOpenIdx + 1, releaseEndIdx);
const signingConfigLine = 'signingConfig signingConfigs.release';

// Remove misplaced occurrences inside buildTypes body, but keep the one we will place inside release
let buildTypesBodyStart = refreshedBuildTypesBlock.bodyStart;
let buildTypesBodyEnd = refreshedBuildTypesBlock.bodyEnd;

const buildTypesContent = content.slice(buildTypesBodyStart, buildTypesBodyEnd);
const misplacedLineRegex = /^[ \t]*signingConfig\s+signingConfigs\.release[ \t]*\r?\n?/gm;
const cleanedBuildTypesContent = buildTypesContent.replace(misplacedLineRegex, '');

// If the release block does not already contain the line, insert it right after the opening brace
const cleanedReleaseBody = content.slice(releaseOpenIdx + 1, releaseEndIdx);
if (!cleanedReleaseBody.includes(signingConfigLine)) {
  const insertionPoint = releaseOpenIdx + 1;
  const signingConfigInsertion = `\n            ${signingConfigLine}\n`;
  content = replaceRange(content, insertionPoint, insertionPoint, signingConfigInsertion);
  console.log('✔ Added signingConfig to release buildType');
} else {
  console.log('Release buildType already has signingConfig — skipping');
}

// After inserting, clean any stale misplaced copies in buildTypes that may remain outside release
// Recompute buildTypes block and strip any stray copies inside it, then ensure one correct copy in release.
const postInsertAndroidBlock = getBlockRangeByKeyword(content, /\bandroid\s*\{/);
const postInsertBuildTypesBlock = getBlockRangeByKeyword(content, /\bbuildTypes\s*\{/, postInsertAndroidBlock.bodyStart);
if (!postInsertBuildTypesBlock) {
  console.error('ERROR: could not re-read buildTypes block after insertion.');
  process.exit(1);
}

const postBuildTypesContent = content.slice(postInsertBuildTypesBlock.bodyStart, postInsertBuildTypesBlock.bodyEnd);
const postCleanedBuildTypesContent = postBuildTypesContent.replace(misplacedLineRegex, '');

if (postBuildTypesContent !== postCleanedBuildTypesContent) {
  content = replaceRange(
    content,
    postInsertBuildTypesBlock.bodyStart,
    postInsertBuildTypesBlock.bodyEnd,
    postCleanedBuildTypesContent
  );
  console.log('✔ Removed misplaced signingConfig lines from buildTypes body');
}

// Final verification: signingConfig must exist inside release block
const finalAndroidBlock = getBlockRangeByKeyword(content, /\bandroid\s*\{/);
const finalBuildTypesBlock = getBlockRangeByKeyword(content, /\bbuildTypes\s*\{/, finalAndroidBlock.bodyStart);
if (!finalBuildTypesBlock) {
  console.error('ERROR: could not verify buildTypes block.');
  process.exit(1);
}

const finalBuildTypesBody = content.slice(finalBuildTypesBlock.bodyStart, finalBuildTypesBlock.bodyEnd);
const finalReleaseRelIdx = indexOfRegex(finalBuildTypesBody, /\brelease\s*\{/);
if (finalReleaseRelIdx === -1) {
  console.error('ERROR: could not verify release block.');
  process.exit(1);
}

const finalReleaseKeywordIdx = finalBuildTypesBlock.bodyStart + finalReleaseRelIdx;
const finalReleaseOpenIdx = content.indexOf('{', finalReleaseKeywordIdx);
const finalReleaseEndIdx = findMatchingBrace(content, finalReleaseOpenIdx);
if (finalReleaseOpenIdx === -1 || finalReleaseEndIdx === -1) {
  console.error('ERROR: could not verify release braces.');
  process.exit(1);
}

const finalReleaseBody = content.slice(finalReleaseOpenIdx + 1, finalReleaseEndIdx);
if (!finalReleaseBody.includes(signingConfigLine)) {
  console.error('ERROR: signingConfig was not injected successfully inside release block.');
  process.exit(1);
}

fs.writeFileSync(appBuildGradle, content, 'utf8');
console.log('✔ android/app/build.gradle written successfully');
