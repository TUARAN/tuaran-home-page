-- 加密资产每日调研：市值池、选题、草稿与运行日志。
CREATE TABLE IF NOT EXISTS crypto_pool_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  snapshot_date TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  generated_at INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS crypto_selections (
  coin_id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  market_cap_rank INTEGER,
  status TEXT NOT NULL DEFAULT 'selected' CHECK (status IN ('selected', 'completed', 'skipped')),
  selected_at INTEGER NOT NULL,
  selection_date TEXT NOT NULL DEFAULT '',
  draft_id TEXT NOT NULL DEFAULT '',
  completed_at INTEGER,
  note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_crypto_selections_status ON crypto_selections (status, selected_at DESC);

CREATE TABLE IF NOT EXISTS crypto_drafts (
  id TEXT PRIMARY KEY,
  coin_id TEXT NOT NULL DEFAULT '',
  symbol TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  market_cap_rank INTEGER,
  title TEXT NOT NULL DEFAULT '',
  draft_date TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  template_version TEXT NOT NULL DEFAULT '',
  style_id TEXT NOT NULL DEFAULT '',
  deepseek_task_id TEXT NOT NULL DEFAULT '',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'failed', 'pending', 'reviewed', 'rejected', 'published')),
  generation_error TEXT NOT NULL DEFAULT '',
  publish_commit TEXT NOT NULL DEFAULT '',
  publish_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_crypto_drafts_date ON crypto_drafts (draft_date DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_drafts_coin ON crypto_drafts (coin_id, draft_date DESC);

CREATE TABLE IF NOT EXISTS crypto_run_log (
  id TEXT PRIMARY KEY,
  ran_at INTEGER NOT NULL,
  action TEXT NOT NULL DEFAULT '',
  coin_id TEXT NOT NULL DEFAULT '',
  symbol TEXT NOT NULL DEFAULT '',
  coin_name TEXT NOT NULL DEFAULT '',
  draft_id TEXT NOT NULL DEFAULT '',
  deepseek_task_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'failed', 'skipped')),
  error TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_crypto_run_log_ran ON crypto_run_log (ran_at DESC);
