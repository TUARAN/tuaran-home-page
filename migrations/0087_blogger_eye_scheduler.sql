-- 小眼睛后台定时检查：记录每次执行结果，并保存 Runner 轮换游标。
CREATE TABLE IF NOT EXISTS blogger_eye_scheduler_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_runner_index INTEGER NOT NULL DEFAULT 0,
  last_runner_id TEXT NOT NULL DEFAULT '',
  last_exit_ip TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO blogger_eye_scheduler_state (
  id,
  next_runner_index,
  last_runner_id,
  last_exit_ip,
  updated_at
) VALUES (1, 0, '', '', 0);

CREATE TABLE IF NOT EXISTS blogger_eye_runs (
  id TEXT PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  mode TEXT NOT NULL,
  target_url TEXT NOT NULL,
  runner_id TEXT NOT NULL DEFAULT '',
  runner_label TEXT NOT NULL DEFAULT '',
  exit_ip TEXT NOT NULL DEFAULT '',
  previous_exit_ip TEXT NOT NULL DEFAULT '',
  ip_changed INTEGER,
  http_status INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  effective_url TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blogger_eye_runs_scheduled_at
  ON blogger_eye_runs (scheduled_at DESC);
