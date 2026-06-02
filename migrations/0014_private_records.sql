CREATE TABLE IF NOT EXISTS private_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  record_kind TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_private_records_user_kind_updated_at
  ON private_records (user_id, record_kind, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_records_user_deleted_at
  ON private_records (user_id, deleted_at);
