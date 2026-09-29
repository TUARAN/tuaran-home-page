-- 站点在线人数：浏览器定时刷新 last_seen，公开页只展示活跃访客总数。
CREATE TABLE IF NOT EXISTS site_presence (
  visitor_key TEXT PRIMARY KEY,
  last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_presence_last_seen
  ON site_presence(last_seen);
