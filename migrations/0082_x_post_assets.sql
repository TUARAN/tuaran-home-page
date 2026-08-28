-- One durable draft/image per Shanghai day and slot; retries reuse both.
CREATE TABLE IF NOT EXISTS x_post_assets (
  id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  slot TEXT NOT NULL,
  content_type TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  object_key TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  image_model TEXT NOT NULL DEFAULT '',
  asset_source TEXT NOT NULL DEFAULT 'generated',
  pool_asset_id TEXT NOT NULL DEFAULT '',
  fallback_error TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT NOT NULL DEFAULT '',
  media_id TEXT NOT NULL DEFAULT '',
  post_id TEXT NOT NULL DEFAULT '',
  post_url TEXT NOT NULL DEFAULT '',
  lease_token TEXT NOT NULL DEFAULT '',
  lease_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(date_key, slot)
);
CREATE INDEX IF NOT EXISTS idx_x_post_assets_recent ON x_post_assets(date_key DESC, id DESC);

-- Pre-generated reusable assets. Binary files live only in R2, never in Git.
CREATE TABLE IF NOT EXISTS x_image_pool (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  image_model TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_x_image_pool_type ON x_image_pool(content_type, enabled, id);
