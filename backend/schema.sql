PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS deals(id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT '', subscribed INTEGER NOT NULL DEFAULT 0, consent_at TEXT, confirmation_token TEXT UNIQUE, unsubscribe_token TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quotes(id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id), details TEXT NOT NULL, artifacts TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', email_status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS campaigns(id TEXT PRIMARY KEY, subject TEXT NOT NULL, message TEXT NOT NULL, audience TEXT NOT NULL, recipient_ids TEXT NOT NULL, status TEXT NOT NULL, sent_count INTEGER NOT NULL DEFAULT 0, failed_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS deliveries(id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), customer_id TEXT NOT NULL REFERENCES customers(id), status TEXT NOT NULL DEFAULT 'queued', attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0, provider_id TEXT, UNIQUE(campaign_id,customer_id));
CREATE INDEX IF NOT EXISTS deliveries_status ON deliveries(status,locked_until);
-- No fabricated products or customer emails are seeded in the live database.
