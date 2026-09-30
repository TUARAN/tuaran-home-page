-- Human-reviewed X reply tasks. A target Post can receive at most one task.
CREATE TABLE IF NOT EXISTS x_reply_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_post_id TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'library', 'ai')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'publishing', 'published', 'publish-unknown', 'failed')),
  reply_post_id TEXT NOT NULL DEFAULT '',
  reply_post_url TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_x_reply_tasks_recent
  ON x_reply_tasks(created_at DESC, id DESC);
