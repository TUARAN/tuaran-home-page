-- 一人一码：先作下载邀请，首次心跳后绑定为设备码并禁止再下载。
CREATE TABLE IF NOT EXISTS x_reply_person_invites (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('downloadable', 'bound', 'revoked')),
  device_id TEXT NOT NULL DEFAULT '',
  account_handle TEXT NOT NULL DEFAULT '',
  download_count INTEGER NOT NULL DEFAULT 0,
  last_download_at INTEGER,
  bound_at INTEGER,
  last_seen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_x_reply_person_invites_status
  ON x_reply_person_invites(status);

CREATE INDEX IF NOT EXISTS idx_x_reply_person_invites_code
  ON x_reply_person_invites(code);
