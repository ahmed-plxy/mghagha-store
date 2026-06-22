const fs = require('fs');
const path = require('path');
const db = require('../config/db');

function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('✔ Database schema applied successfully.');

  try {
    db.exec('ALTER TABLE products ADD COLUMN product_attributes TEXT');
    console.log('✔ Added product_attributes column to products table.');
  } catch (e) {
    // Column already exists — safe to ignore
  }

  // Personal listings (customer P2P / classifieds)
  db.exec(`
    CREATE TABLE IF NOT EXISTS personal_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
      condition TEXT NOT NULL DEFAULT 'used',
      listing_attributes TEXT DEFAULT '{}',
      status TEXT NOT NULL CHECK (status IN ('active','inactive','sold')) DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS personal_listing_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES personal_listings(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);
  console.log('✔ Personal listings tables ready.');

  try {
    db.exec("ALTER TABLE personal_listings ADD COLUMN condition TEXT NOT NULL DEFAULT 'used'");
    console.log('✔ Added condition column to personal_listings table.');
  } catch (e) {
    // Column already exists — safe to ignore
  }

  try {
    db.exec('ALTER TABLE stores ADD COLUMN shipping_fee REAL NOT NULL DEFAULT 0');
    console.log('✔ Added shipping_fee column to stores table.');
  } catch (e) {}

  // Banner ads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      link_url TEXT,
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✔ Banners table ready.');

  // Popular searches (admin-curated suggested search terms for classifieds)
  db.exec(`
    CREATE TABLE IF NOT EXISTS popular_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  console.log('✔ Popular searches table ready.');

  // Chat moderation: flagged conversations
  try {
    db.exec('ALTER TABLE conversations ADD COLUMN is_flagged INTEGER NOT NULL DEFAULT 0');
    console.log('✔ Added is_flagged column to conversations.');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE conversations ADD COLUMN flagged_reason TEXT');
    console.log('✔ Added flagged_reason column to conversations.');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE products ADD COLUMN shipping_cost REAL NOT NULL DEFAULT 0');
    console.log('✔ Added shipping_cost column to products table.');
  } catch (e) {}
}

migrate();

// ── Phase 2 Migrations ─────────────────────────────────────────

// Push notification log (admin-sent broadcasts)
db.exec(`
  CREATE TABLE IF NOT EXISTS push_notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    url TEXT,
    onesignal_id TEXT,
    recipients INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
console.log('✔ push_notification_log table ready.');

// App version management
db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// Seed default app version settings if not already present
const insertSetting = db.prepare(`INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`);
insertSetting.run('app_latest_version', '1.0.0');
insertSetting.run('app_min_version', '1.0.0');
insertSetting.run('app_apk_url', '');
insertSetting.run('app_update_message', 'يوجد تحديث جديد للتطبيق. يُرجى التحديث للاستمرار.');
insertSetting.run('app_force_update', '0');
console.log('✔ app_settings table ready with defaults.');

// Classifieds moderation: add moderation_status column
try {
  db.exec(`ALTER TABLE personal_listings ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'active'`);
  console.log('✔ Added moderation_status column to personal_listings.');
} catch (e) { /* already exists */ }

try {
  db.exec(`ALTER TABLE personal_listings ADD COLUMN moderation_note TEXT`);
  console.log('✔ Added moderation_note column to personal_listings.');
} catch (e) { /* already exists */ }

console.log('✔ Phase 2 migrations complete.');

// ── Phase 3 Migrations: Multi-provider Auth ─────────────────────────────────

// Step 1: Add new columns to users safely (ALTER TABLE ignores if already exists via try/catch)
const phase3Columns = [
  { name: 'google_id',      sql: "ALTER TABLE users ADD COLUMN google_id TEXT" },
  { name: 'avatar_url',     sql: "ALTER TABLE users ADD COLUMN avatar_url TEXT" },
  { name: 'auth_provider',  sql: "ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'phone'" },
  { name: 'email_verified', sql: "ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0" },
  { name: 'phone_verified', sql: "ALTER TABLE users ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 1" },
];
for (const c of phase3Columns) {
  try { db.exec(c.sql); console.log(`✔ Added column users.${c.name}.`); } catch (e) { /* already exists */ }
}

// Step 2: Add unique index on google_id
try {
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL");
  console.log('✔ idx_users_google_id index ready.');
} catch (e) {}

// Step 3: Back-fill providers for existing data
db.prepare("UPDATE users SET auth_provider = 'google', email_verified = 1 WHERE phone LIKE 'google_%'").run();
console.log('✔ Back-filled auth_provider for existing Google users.');

// Step 4: Make phone nullable (rebuild table — SQLite cannot ALTER NOT NULL)
const usersInfo = db.prepare("PRAGMA table_info(users)").all();
const phoneColInfo = usersInfo.find(c => c.name === 'phone');
if (phoneColInfo && phoneColInfo.notnull === 1) {
  console.log('Rebuilding users table to make phone nullable...');
  db.exec("PRAGMA foreign_keys = OFF");
  db.exec(`
    CREATE TABLE users_v3 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('customer','vendor','admin')) DEFAULT 'customer',
      status TEXT NOT NULL CHECK (status IN ('active','suspended')) DEFAULT 'active',
      auth_provider TEXT NOT NULL DEFAULT 'phone',
      email_verified INTEGER NOT NULL DEFAULT 0,
      phone_verified INTEGER NOT NULL DEFAULT 1,
      google_id TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    INSERT INTO users_v3 (id, full_name, phone, email, password_hash, role, status, auth_provider, email_verified, phone_verified, google_id, avatar_url, created_at)
    SELECT id, full_name, phone, email, password_hash, role, status,
      COALESCE(auth_provider,'phone'),
      COALESCE(email_verified,0),
      COALESCE(phone_verified,1),
      google_id, avatar_url, created_at
    FROM users
  `);
  db.exec("DROP TABLE users");
  db.exec("ALTER TABLE users_v3 RENAME TO users");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL");
  db.exec("PRAGMA foreign_keys = ON");
  console.log('✔ users table rebuilt with nullable phone.');
} else {
  console.log('✔ users.phone already nullable — skipping rebuild.');
  // Ensure indexes exist anyway
  try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL"); } catch(e){}
  try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL"); } catch(e){}
  try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL"); } catch(e){}
}

// Step 5: Email verification tokens table
db.exec(`
  CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
try { db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_emailverif_token ON email_verifications(token)"); } catch(e){}
try { db.exec("CREATE INDEX IF NOT EXISTS idx_emailverif_user ON email_verifications(user_id)"); } catch(e){}
console.log('✔ email_verifications table ready.');

console.log('✔ Phase 3 (multi-provider auth) migrations complete.');

// ── Phase 4: area_id on users ────────────────────────────────────────────────
try {
  db.exec('ALTER TABLE users ADD COLUMN area_id INTEGER REFERENCES areas(id)');
  console.log('✔ Added area_id column to users table.');
} catch (e) { /* already exists */ }
console.log('✔ Phase 4 migrations complete.');

// ── Phase 5: product reports table ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS product_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
try { db.exec('CREATE INDEX IF NOT EXISTS idx_reports_product ON product_reports(product_id)'); } catch (e) {}
try { db.exec('CREATE INDEX IF NOT EXISTS idx_reports_status ON product_reports(status)'); } catch (e) {}
console.log('✔ product_reports table ready.');
console.log('✔ Phase 5 migrations complete.');
