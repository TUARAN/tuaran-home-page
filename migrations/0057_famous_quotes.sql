-- 统一内容目录的短名言池；公开接口只读取 enabled = 1 的记录。
-- 首次打开后台名言管理时，会从 lib/famousQuotes.js 写入 100 条公版原典种子。
CREATE TABLE IF NOT EXISTS famous_quotes (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  source TEXT,
  source_url TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_famous_quotes_text_author
  ON famous_quotes(text, author);

CREATE INDEX IF NOT EXISTS idx_famous_quotes_enabled
  ON famous_quotes(enabled, sort_order DESC, updated_at DESC);
