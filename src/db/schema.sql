PRAGMA foreign_keys = ON;

-- ========== USERS ==========
CREATE TABLE IF NOT EXISTS users (
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
  area_id INTEGER REFERENCES areas(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- ========== AREAS ==========
CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_slug ON areas(slug);

-- ========== VENDOR APPLICATIONS ==========
CREATE TABLE IF NOT EXISTS vendor_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  store_name TEXT NOT NULL,
  store_slug TEXT NOT NULL,
  phone TEXT NOT NULL,
  full_address TEXT NOT NULL,
  area_id INTEGER NOT NULL REFERENCES areas(id),
  id_card_image_front TEXT NOT NULL,
  id_card_image_back TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vendorapp_user ON vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendorapp_status ON vendor_applications(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendorapp_one_pending ON vendor_applications(user_id) WHERE status = 'pending';

-- ========== STORES ==========
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id),
  store_name TEXT NOT NULL,
  store_slug TEXT NOT NULL,
  description TEXT,
  logo_image TEXT,
  cover_image TEXT,
  area_id INTEGER NOT NULL REFERENCES areas(id),
  status TEXT NOT NULL CHECK (status IN ('active','suspended')) DEFAULT 'active',
  rating_average REAL NOT NULL DEFAULT 0,
  shipping_fee REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(store_slug);
CREATE INDEX IF NOT EXISTS idx_stores_area ON stores(area_id);

-- ========== CATEGORIES ==========
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id INTEGER REFERENCES categories(id),
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- ========== PRODUCTS ==========
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  category_id INTEGER REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  product_attributes TEXT,
  price REAL NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 0) DEFAULT 0,
  shipping_cost REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('active','inactive')) DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_slug ON products(store_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ========== PRODUCT IMAGES ==========
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_productimages_product ON product_images(product_id);

-- ========== CARTS ==========
CREATE TABLE IF NOT EXISTS carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);

-- ========== CART ITEMS ==========
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cartitems_cart_product ON cart_items(cart_id, product_id);

-- ========== ORDERS ==========
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  checkout_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method = 'cod') DEFAULT 'cod',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending','paid','refunded')) DEFAULT 'pending',
  order_status TEXT NOT NULL CHECK (order_status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')) DEFAULT 'pending',
  customer_address TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_store_ordernum ON orders(store_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_checkout ON orders(checkout_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- ========== ORDER ITEMS ==========
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL,
  subtotal REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orderitems_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_product ON order_items(product_id);

-- ========== REVIEWS ==========
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status TEXT NOT NULL CHECK (status IN ('approved','hidden')) DEFAULT 'approved',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product_order ON reviews(user_id, product_id, order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ========== WISHLIST ==========
CREATE TABLE IF NOT EXISTS wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_user_product ON wishlist(user_id, product_id);

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- ========== CONVERSATIONS (customer <-> vendor chat) ==========
CREATE TABLE IF NOT EXISTS conversations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id      INTEGER NOT NULL REFERENCES users(id),
  store_id         INTEGER NOT NULL REFERENCES stores(id),
  is_flagged       INTEGER NOT NULL DEFAULT 0,
  flagged_reason   TEXT,
  last_message_at  TEXT NOT NULL DEFAULT (datetime('now')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_customer_store ON conversations(customer_id, store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_store ON conversations(store_id);

-- ========== MESSAGES ==========
CREATE TABLE IF NOT EXISTS messages (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id  INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        INTEGER NOT NULL REFERENCES users(id),
  body             TEXT NOT NULL,
  is_read          INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- ========== PERSONAL LISTINGS (classifieds) ==========
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
  moderation_status TEXT NOT NULL DEFAULT 'active',
  moderation_note TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','inactive','sold')) DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS personal_listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES personal_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ========== BANNERS ==========
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  link_url TEXT,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========== POPULAR SEARCHES ==========
CREATE TABLE IF NOT EXISTS popular_searches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========== PUSH NOTIFICATION LOG ==========
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

-- ========== APP SETTINGS ==========
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ========== PRODUCT REPORTS ==========
CREATE TABLE IF NOT EXISTS product_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_product ON product_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON product_reports(status);

-- ========== EMAIL VERIFICATIONS ==========
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emailverif_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_emailverif_user ON email_verifications(user_id);
