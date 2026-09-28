-- D1 schema for the rug store. Apply with `npm run db:migrate:local` / `db:migrate:remote`.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  first_name TEXT,
  interests TEXT,            -- JSON array of size/style interests
  source TEXT,               -- JSON of UTM params / referrer
  consent INTEGER NOT NULL DEFAULT 1,
  synced_at TEXT,            -- when pushed to the email provider
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS trade_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  firm TEXT NOT NULL,
  website TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT NOT NULL,
  city_state TEXT NOT NULL,
  project_types TEXT,        -- JSON array
  resale_cert TEXT,
  heard_from TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  promo_code TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- "Find me one like this" and filter-saved requests.
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  size TEXT,
  style TEXT,
  colors TEXT,               -- JSON array
  budget TEXT,
  notes TEXT,
  criteria TEXT,             -- JSON of prefilled filter criteria
  rug_id TEXT,               -- when triggered from a sold rug
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS notify (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  rug_id TEXT NOT NULL,
  notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(email, rug_id)
);

CREATE TABLE IF NOT EXISTS room_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  rug_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  room_dimensions TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new | sent
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE,         -- tokenized link from the post-purchase email
  order_id INTEGER,
  rug_id TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  display_name TEXT NOT NULL,
  city TEXT,
  photo_key TEXT,            -- R2 key
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  approved_at TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent TEXT,
  email TEXT COLLATE NOCASE,
  name TEXT,
  phone TEXT,
  rug_ids TEXT NOT NULL,     -- JSON array
  amount_subtotal INTEGER,   -- cents
  amount_tax INTEGER,
  amount_total INTEGER,
  currency TEXT DEFAULT 'usd',
  promo_code TEXT,
  is_trade INTEGER NOT NULL DEFAULT 0,
  shipping_address TEXT,     -- JSON
  utm TEXT,                  -- JSON
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid', -- paid | packed | shipped | delivered | refunded
  tracking TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Reservation lock: one row per rug. The PRIMARY KEY makes the double-buy race impossible.
CREATE TABLE IF NOT EXISTS reservations (
  rug_id TEXT PRIMARY KEY,
  session_id TEXT,
  expires_at INTEGER NOT NULL, -- unix ms
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS processed_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,       -- admin email or 'system'
  action TEXT NOT NULL,
  rug_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  subject TEXT,
  message TEXT NOT NULL,
  rug_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS return_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_email TEXT NOT NULL COLLATE NOCASE,
  order_number TEXT NOT NULL,
  rug_id TEXT NOT NULL,
  reason TEXT,
  photo_keys TEXT,           -- JSON array of R2 keys
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Debounce for the deploy hook (at most one call per 5 minutes).
CREATE TABLE IF NOT EXISTS kv_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_notify_rug ON notify(rug_id);
