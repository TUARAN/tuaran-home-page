-- 本站 RSS 请求记录。
-- 注意：RSS 协议没有“订阅成功回调”，这里只能记录 /rss.xml 被请求的次数、
--       近似独立客户端和 Reader/User-Agent 分布。
CREATE TABLE IF NOT EXISTS rss_hits (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  reader TEXT,
  user_agent TEXT,
  referer TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rss_hits_created_at
  ON rss_hits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rss_hits_client_created
  ON rss_hits(client_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rss_hits_reader_created
  ON rss_hits(reader, created_at DESC);
