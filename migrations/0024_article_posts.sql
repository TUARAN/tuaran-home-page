-- 站内在线文章（/admin/articles 编辑，/articles/[slug] 发布）。
-- 正文以 Tiptap JSON 为唯一可信源；content_text 用于摘要回退与检索。
CREATE TABLE IF NOT EXISTS article_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}',
  content_text TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  revision INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  published_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_article_posts_status_published
  ON article_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_posts_updated
  ON article_posts (updated_at DESC);
