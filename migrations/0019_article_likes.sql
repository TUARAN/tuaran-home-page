CREATE TABLE IF NOT EXISTS article_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_key TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  user_id TEXT,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_article_likes_article_voter
  ON article_likes(article_key, voter_key);

CREATE INDEX IF NOT EXISTS idx_article_likes_article_created
  ON article_likes(article_key, created_at DESC);
