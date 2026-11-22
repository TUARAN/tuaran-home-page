-- x.2aran.com 工作台：爆文雷达与榜单。
-- x_radar_items 只存公开推文及其公开指标，由用户的插件在自己的登录态下采集后提交，
-- 各用户共享同一份（推文 id 唯一）；榜单按这份数据聚合，覆盖范围取决于采集量。
CREATE TABLE IF NOT EXISTS x_radar_items (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  media TEXT NOT NULL DEFAULT 'none' CHECK (media IN ('none', 'image', 'video')),
  likes INTEGER NOT NULL DEFAULT 0,
  reposts INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  tweet_at INTEGER NOT NULL,
  captured_at INTEGER NOT NULL,
  captured_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_x_radar_items_time ON x_radar_items(tweet_at DESC);
CREATE INDEX IF NOT EXISTS idx_x_radar_items_handle ON x_radar_items(handle, tweet_at DESC);

CREATE TABLE IF NOT EXISTS x_radar_watch (
  user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, handle)
);

-- 采集用户提议话题，只有站长审核通过的归属进入公开筛选。
CREATE TABLE IF NOT EXISTS x_radar_topic_suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tweet_id TEXT NOT NULL REFERENCES x_radar_items(id),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  UNIQUE(user_id, tweet_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_x_radar_topics_review ON x_radar_topic_suggestions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_x_radar_topics_public ON x_radar_topic_suggestions(topic, status, tweet_id);
