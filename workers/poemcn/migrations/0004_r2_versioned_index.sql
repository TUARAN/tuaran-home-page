-- 版本化只读搜索索引。正文、注释、译文、赏析和来源详情写入 R2 分片。
-- 不在迁移中回填旧 poems：全量回填必须先通过离线预算门禁，或在新 D1 中构建。
CREATE TABLE IF NOT EXISTS dataset_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_version TEXT NOT NULL,
  source_repository TEXT NOT NULL,
  source_commit TEXT NOT NULL,
  stats_json TEXT NOT NULL DEFAULT '{}',
  sitemap_index_key TEXT,
  sitemap_prefix TEXT,
  published_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO dataset_state (
  id, active_version, source_repository, source_commit, stats_json
) VALUES (
  1, 'legacy', 'chinese-poetry/chinese-poetry', '', '{}'
);

CREATE TABLE IF NOT EXISTS poem_search_index (
  dataset_version TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '佚名',
  dynasty TEXT NOT NULL DEFAULT '未知',
  genre TEXT NOT NULL DEFAULT '诗',
  form TEXT NOT NULL DEFAULT '其他',
  categories_json TEXT NOT NULL DEFAULT '[]',
  excerpt_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL DEFAULT '',
  body_key TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  quality_score INTEGER NOT NULL DEFAULT 20,
  sitemap_ordinal INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (dataset_version, id)
);

CREATE INDEX IF NOT EXISTS idx_poem_search_version_quality
  ON poem_search_index(dataset_version, quality_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_poem_search_version_dynasty
  ON poem_search_index(dataset_version, dynasty, quality_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_poem_search_version_genre
  ON poem_search_index(dataset_version, genre, quality_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_poem_search_version_author
  ON poem_search_index(dataset_version, author, quality_score DESC, id ASC);
CREATE INDEX IF NOT EXISTS idx_poem_search_version_sitemap
  ON poem_search_index(dataset_version, sitemap_ordinal ASC);

CREATE TABLE IF NOT EXISTS poem_search_categories (
  dataset_version TEXT NOT NULL,
  category TEXT NOT NULL,
  poem_id TEXT NOT NULL,
  PRIMARY KEY (dataset_version, category, poem_id)
);

CREATE INDEX IF NOT EXISTS idx_poem_search_category
  ON poem_search_categories(dataset_version, category, poem_id);

CREATE VIRTUAL TABLE IF NOT EXISTS poem_search_fts USING fts5(
  dataset_version UNINDEXED,
  poem_id UNINDEXED,
  title,
  author,
  content,
  tokenize = 'unicode61'
);

CREATE TRIGGER IF NOT EXISTS poem_search_ai AFTER INSERT ON poem_search_index BEGIN
  INSERT INTO poem_search_fts(dataset_version, poem_id, title, author, content)
  VALUES (new.dataset_version, new.id, new.title, new.author, new.search_text);
END;

CREATE TRIGGER IF NOT EXISTS poem_search_au AFTER UPDATE ON poem_search_index BEGIN
  DELETE FROM poem_search_fts
  WHERE dataset_version = old.dataset_version AND poem_id = old.id;
  INSERT INTO poem_search_fts(dataset_version, poem_id, title, author, content)
  VALUES (new.dataset_version, new.id, new.title, new.author, new.search_text);
END;

CREATE TRIGGER IF NOT EXISTS poem_search_ad AFTER DELETE ON poem_search_index BEGIN
  DELETE FROM poem_search_fts
  WHERE dataset_version = old.dataset_version AND poem_id = old.id;
END;
