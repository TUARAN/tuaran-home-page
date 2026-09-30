-- 发文打卡：登录用户按北京时间记录各内容平台的每日发布情况。
CREATE TABLE IF NOT EXISTS publishing_checkins (
  user_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  platform TEXT NOT NULL,
  post_url TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, checkin_date, platform)
);

CREATE INDEX IF NOT EXISTS idx_publishing_checkins_user_date
  ON publishing_checkins(user_id, checkin_date DESC);
