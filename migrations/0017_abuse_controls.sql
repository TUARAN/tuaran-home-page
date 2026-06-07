CREATE TABLE IF NOT EXISTS api_rate_limits (
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  subject_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, window_start, subject_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated_at
  ON api_rate_limits(updated_at);
