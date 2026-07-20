CREATE TABLE IF NOT EXISTS private_information_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  encrypted_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_private_information_user_updated_at
  ON private_information_records (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_private_information_user_category
  ON private_information_records (user_id, category, deleted_at);
