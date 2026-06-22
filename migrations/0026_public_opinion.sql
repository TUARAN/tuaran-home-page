-- 舆情分析动态采集数据。
-- GitHub Actions 每小时调用 /api/public-opinion/collect，采集器写入以下三张表。

CREATE TABLE IF NOT EXISTS public_opinion_posts (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  sentiment REAL NOT NULL DEFAULT 0,
  stance TEXT NOT NULL DEFAULT 'neutral',
  engagement INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL DEFAULT '',
  viewpoint TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  collected_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_opinion_posts_published
  ON public_opinion_posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_opinion_posts_topic
  ON public_opinion_posts (topic_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_opinion_posts_source
  ON public_opinion_posts (source_id, published_at DESC);

CREATE TABLE IF NOT EXISTS public_opinion_trends (
  bucket_at INTEGER PRIMARY KEY,
  heat INTEGER NOT NULL DEFAULT 0,
  positive INTEGER NOT NULL DEFAULT 0,
  negative INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_opinion_trends_bucket
  ON public_opinion_trends (bucket_at DESC);

CREATE TABLE IF NOT EXISTS public_opinion_meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO public_opinion_meta (k, v, updated_at) VALUES
  ('last_collect_at', '0', 0),
  ('last_collect_status', 'never', 0),
  ('last_collect_error', '', 0),
  ('last_collect_count', '0', 0),
  ('data_sources', 'infoq-rss,venturebeat-rss,techcrunch-rss,hn-algolia', 0);
