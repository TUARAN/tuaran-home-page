CREATE TABLE IF NOT EXISTS article_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_provider TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_image TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article_created
  ON article_comments(article_key, created_at DESC);
