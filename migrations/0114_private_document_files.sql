CREATE TABLE IF NOT EXISTS private_document_files (
  id TEXT PRIMARY KEY,
  record_id INTEGER REFERENCES private_records(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type = 'application/pdf'),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_private_document_files_record
  ON private_document_files (record_id, created_at DESC);
