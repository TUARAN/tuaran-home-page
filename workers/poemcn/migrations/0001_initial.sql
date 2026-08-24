PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS poems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '佚名',
  dynasty TEXT NOT NULL DEFAULT '未知',
  genre TEXT NOT NULL DEFAULT '诗',
  form TEXT NOT NULL DEFAULT '其他',
  content_json TEXT NOT NULL,
  content_text TEXT NOT NULL,
  categories_json TEXT NOT NULL DEFAULT '[]',
  translation TEXT,
  note TEXT,
  appreciation TEXT,
  source_key TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_license TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  fingerprint TEXT UNIQUE,
  quality_score INTEGER NOT NULL DEFAULT 20,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_key, source_record_id)
);

CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
CREATE INDEX IF NOT EXISTS idx_poems_genre ON poems(genre);
CREATE INDEX IF NOT EXISTS idx_poems_form ON poems(form);
CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);
CREATE INDEX IF NOT EXISTS idx_poems_quality ON poems(quality_score DESC, id);

CREATE VIRTUAL TABLE IF NOT EXISTS poems_fts USING fts5(
  poem_id UNINDEXED,
  title,
  author,
  content,
  tokenize = 'unicode61'
);

CREATE TRIGGER IF NOT EXISTS poems_ai AFTER INSERT ON poems BEGIN
  INSERT INTO poems_fts(poem_id, title, author, content)
  VALUES (new.id, new.title, new.author, new.content_text);
END;

CREATE TRIGGER IF NOT EXISTS poems_au AFTER UPDATE ON poems BEGIN
  DELETE FROM poems_fts WHERE poem_id = old.id;
  INSERT INTO poems_fts(poem_id, title, author, content)
  VALUES (new.id, new.title, new.author, new.content_text);
END;

CREATE TRIGGER IF NOT EXISTS poems_ad AFTER DELETE ON poems BEGIN
  DELETE FROM poems_fts WHERE poem_id = old.id;
END;

CREATE TABLE IF NOT EXISTS crawler_sources (
  source_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  directory TEXT NOT NULL,
  file_pattern TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  genre TEXT NOT NULL,
  file_index INTEGER NOT NULL DEFAULT 0,
  row_index INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  last_file TEXT,
  last_run_at TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL,
  file_name TEXT,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  message TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  FOREIGN KEY(source_key) REFERENCES crawler_sources(source_key)
);

CREATE INDEX IF NOT EXISTS idx_crawl_runs_started ON crawl_runs(started_at DESC);

INSERT OR IGNORE INTO crawler_sources
  (source_key, label, directory, file_pattern, dynasty, genre)
VALUES
  ('tang-poetry', '全唐诗', '全唐诗', '^poet[.]tang[.][0-9]+[.]json$', '唐代', '诗'),
  ('song-poetry', '全宋诗', '全唐诗', '^poet[.]song[.][0-9]+[.]json$', '宋代', '诗'),
  ('song-ci', '全宋词', '宋词', '^ci[.]song[.][0-9]+[.]json$', '宋代', '词'),
  ('yuan-qu', '元曲', '元曲', '^yuanqu[.]json$', '元代', '曲');
