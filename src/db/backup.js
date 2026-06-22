/**
 * Automatic SQLite backup system.
 * Keeps the last 7 daily snapshots in data/backups/.
 * Run once on startup; re-runs every 24 hours automatically.
 */
const fs   = require('fs');
const path = require('path');
const env  = require('../config/env');

const DB_PATH    = path.resolve(env.dbPath);
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups');
const MAX_KEEP   = 7; // days worth of backups to retain

function runBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.warn('[Backup] Database file not found — skipping.');
      return null;
    }

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dest  = path.join(BACKUP_DIR, `mghagha-${stamp}.sqlite`);

    fs.copyFileSync(DB_PATH, dest);
    console.log(`✔ [Backup] Database backed up → ${dest}`);

    // Prune old backups — keep only the newest MAX_KEEP files
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('mghagha-') && f.endsWith('.sqlite'))
      .sort()      // ascending → oldest first
      .reverse();  // newest first

    files.slice(MAX_KEEP).forEach(f => {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        console.log(`[Backup] Pruned old backup: ${f}`);
      } catch (_) {}
    });

    return dest;
  } catch (e) {
    console.error('[Backup] Failed:', e.message);
    return null;
  }
}

/**
 * Start the backup scheduler: run immediately, then every 24 hours.
 */
function startBackupScheduler() {
  runBackup();
  setInterval(runBackup, 24 * 60 * 60 * 1000);
}

module.exports = { runBackup, startBackupScheduler };
