CREATE TABLE IF NOT EXISTS private_documents (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_private_documents_updated_at
  ON private_documents (updated_at DESC);
