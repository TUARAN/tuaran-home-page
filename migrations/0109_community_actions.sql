-- 社区动作回执：浏览器插件上报心跳和已确认的动作，后台只收集，不改插件里的开始、停止和挡位。
CREATE TABLE IF NOT EXISTS community_action_devices (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'xhs')),
  extension_version TEXT NOT NULL DEFAULT '',
  account_handle TEXT NOT NULL DEFAULT '',
  last_seen_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS community_action_events (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  task TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'failed', 'skipped', 'limited')),
  target_id TEXT NOT NULL DEFAULT '',
  account_handle TEXT NOT NULL DEFAULT '',
  error_code TEXT NOT NULL DEFAULT '',
  extension_version TEXT NOT NULL DEFAULT '',
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_community_action_events_recent
  ON community_action_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_action_events_day
  ON community_action_events(occurred_at, platform, task, result);
