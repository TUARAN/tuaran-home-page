CREATE TABLE IF NOT EXISTS bookmark_nav_imports (
  import_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  source_folder_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL,
  unique_url_count INTEGER NOT NULL,
  duplicate_count INTEGER NOT NULL,
  category_counts TEXT NOT NULL DEFAULT '{}',
  risk_counts TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  activated_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmark_nav_imports_active_user
  ON bookmark_nav_imports (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_bookmark_nav_imports_user_created
  ON bookmark_nav_imports (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bookmark_nav_items (
  import_id TEXT NOT NULL,
  bookmark_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT '',
  folder_path TEXT NOT NULL DEFAULT '[]',
  added_at TEXT,
  category TEXT NOT NULL,
  duplicate_of TEXT,
  risk_flags TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (import_id, bookmark_id),
  FOREIGN KEY (import_id) REFERENCES bookmark_nav_imports(import_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookmark_nav_items_user_import_position
  ON bookmark_nav_items (user_id, import_id, position);

CREATE INDEX IF NOT EXISTS idx_bookmark_nav_items_import_category
  ON bookmark_nav_items (import_id, category, position);
