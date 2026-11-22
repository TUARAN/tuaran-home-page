-- x.2aran.com 工作台 P1/P4：草稿与排期。云端只排队，由插件领取后在 X 页面内执行。
CREATE TABLE IF NOT EXISTS x_drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_x_drafts_user ON x_drafts(user_id, handle, updated_at DESC);

CREATE TABLE IF NOT EXISTS x_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  text TEXT NOT NULL,
  run_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'claimed', 'done', 'failed', 'cancelled')),
  result TEXT NOT NULL DEFAULT '',
  claimed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_x_schedules_due ON x_schedules(user_id, handle, status, run_at);
