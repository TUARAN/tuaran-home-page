-- RSS 订阅墙更新游标：记录每个源最近看过的条目，供站长通知去重。
CREATE TABLE IF NOT EXISTS rss_feed_cursors (
  feed_id TEXT PRIMARY KEY,
  last_guid TEXT NOT NULL DEFAULT '',
  last_pub_at INTEGER NOT NULL DEFAULT 0,
  last_checked_at INTEGER NOT NULL DEFAULT 0,
  seen_guids TEXT NOT NULL DEFAULT '[]'
);
