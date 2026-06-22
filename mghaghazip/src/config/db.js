const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const env = require('./env');

const resolvedDbPath = path.resolve(env.dbPath);
const dbDir = path.dirname(resolvedDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(resolvedDbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

module.exports = db;
