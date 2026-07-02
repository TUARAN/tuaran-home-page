CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'local',
  provider_id TEXT,
  provider_status TEXT,
  user_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  unsubscribed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status_created
  ON newsletter_subscribers(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_updated
  ON newsletter_subscribers(updated_at DESC);
