/**
 * app-update.js
 * Loaded by the Capacitor WebView. Checks version API and shows
 * update dialogs. Also initialises OneSignal in the native context.
 *
 * Injected into the Capacitor app via capacitor.config.json
 * server.androidScheme or via an <script> tag in the root HTML file
 * when running inside the Android wrapper.
 */

(function () {
  'use strict';

  // ── Version Comparison ─────────────────────────────────────────
  function parseVer(v) {
    return (v || '0.0.0').split('.').map(Number);
  }

  function lt(a, b) {
    const pa = parseVer(a), pb = parseVer(b);
    for (let i = 0; i < 3; i++) {
      if (pa[i] < pb[i]) return true;
      if (pa[i] > pb[i]) return false;
    }
    return false;
  }

  // ── Dialog Helper ──────────────────────────────────────────────
  function showUpdateDialog({ message, apkUrl, canDismiss }) {
    // Remove existing
    const old = document.getElementById('__update-dialog__');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = '__update-dialog__';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:99999;',
      'background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;',
      'padding:24px;direction:rtl;',
    ].join('');

    const box = document.createElement('div');
    box.style.cssText = [
      'background:#fff;border-radius:16px;padding:28px 24px;max-width:360px;width:100%;',
      'box-shadow:0 8px 40px rgba(0,0,0,.25);font-family:Cairo,Tajawal,sans-serif;',
    ].join('');

    box.innerHTML = `
      <div style="font-size:2rem;text-align:center;margin-bottom:10px;">📲</div>
      <h3 style="margin:0 0 10px;font-size:1.1rem;text-align:center;color:#1a1a1a;">تحديث التطبيق</h3>
      <p style="margin:0 0 20px;color:#555;font-size:0.9rem;line-height:1.6;text-align:center;">${message}</p>
      <a href="${apkUrl}" target="_blank"
         style="display:block;background:#1a56db;color:#fff;text-align:center;padding:13px;border-radius:10px;text-decoration:none;font-weight:700;font-size:0.95rem;margin-bottom:${canDismiss ? '10px' : '0'};">
        ⬇️ تحديث الآن
      </a>
      ${canDismiss ? `<button onclick="document.getElementById('__update-dialog__').remove()"
        style="width:100%;background:none;border:1px solid #ccc;border-radius:10px;padding:11px;color:#555;cursor:pointer;font-size:0.9rem;font-family:inherit;">
        لاحقاً
      </button>` : ''}
    `;

    overlay.appendChild(box);
    // Prevent background close for forced updates
    if (!canDismiss) {
      overlay.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    document.body.appendChild(overlay);
  }

  // ── Main: Check Version ────────────────────────────────────────
  async function checkVersion(currentAppVersion) {
    try {
      const res = await fetch('/api/app-version');
      if (!res.ok) return;
      const data = await res.json();

      const isBelowMin   = lt(currentAppVersion, data.minVersion);
      const hasNewVersion = lt(currentAppVersion, data.latestVersion);

      if (isBelowMin || (hasNewVersion && data.forceUpdate)) {
        showUpdateDialog({
          message: data.updateMessage,
          apkUrl: data.apkUrl,
          canDismiss: false,
        });
      } else if (hasNewVersion) {
        showUpdateDialog({
          message: data.updateMessage,
          apkUrl: data.apkUrl,
          canDismiss: true,
        });
      }
    } catch (err) {
      console.warn('[AppUpdate] Version check failed:', err);
    }
  }

  // Expose globally so Capacitor JS code can call:
  // window.MghaghaApp.checkVersion('1.0.0');
  window.MghaghaApp = window.MghaghaApp || {};
  window.MghaghaApp.checkVersion = checkVersion;
})();
