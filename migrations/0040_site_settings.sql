CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO site_settings (key, value, updated_at, updated_by)
VALUES ('ads.enabled', 'true', strftime('%s','now') * 1000, 'migration');
