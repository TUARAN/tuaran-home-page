-- A 股公司观察在线自动化存储。
-- 公司池快照、每日选题状态、自动生成草稿与运行日志都落在 D1，
-- 由外部调度器（GitHub Actions cron）POST /api/cron/a-share-research 触发。
CREATE TABLE IF NOT EXISTS a_share_pool (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  exchange TEXT NOT NULL DEFAULT '',
  board TEXT NOT NULL DEFAULT '',
  snapshot_date TEXT NOT NULL DEFAULT '',
  generated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_a_share_pool_exchange
  ON a_share_pool (exchange, code);

CREATE TABLE IF NOT EXISTS a_share_selections (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'selected'
    CHECK (status IN ('selected', 'completed', 'skipped')),
  selected_at INTEGER NOT NULL,
  selection_date TEXT NOT NULL DEFAULT '',
  draft_id TEXT NOT NULL DEFAULT '',
  completed_at INTEGER,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_a_share_selections_status
  ON a_share_selections (status, selected_at DESC);

CREATE TABLE IF NOT EXISTS a_share_drafts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  draft_date TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  template_version TEXT NOT NULL DEFAULT '',
  style_id TEXT NOT NULL DEFAULT '',
  deepseek_task_id TEXT NOT NULL DEFAULT '',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('generating', 'pending', 'reviewed', 'rejected')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_a_share_drafts_date
  ON a_share_drafts (draft_date DESC);

CREATE INDEX IF NOT EXISTS idx_a_share_drafts_code
  ON a_share_drafts (code, draft_date DESC);

CREATE TABLE IF NOT EXISTS a_share_pool_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  snapshot_date TEXT NOT NULL DEFAULT '',
  count INTEGER NOT NULL DEFAULT 0,
  generated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS a_share_run_log (
  id TEXT PRIMARY KEY,
  ran_at INTEGER NOT NULL,
  action TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  draft_id TEXT NOT NULL DEFAULT '',
  deepseek_task_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ok'
    CHECK (status IN ('ok', 'failed', 'skipped')),
  error TEXT NOT NULL DEFAULT '',
  duration_ms INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_a_share_run_log_ran
  ON a_share_run_log (ran_at DESC);

-- 迁移前仓库已完成调研的公司，纳入在线状态避免重复选题。
INSERT OR IGNORE INTO a_share_selections
  (code, name, status, selected_at, selection_date, completed_at)
VALUES
  ('688071', '华依科技', 'completed', 1785481554510, '2026-07-31', 1785481282743),
  ('600136', 'ST明诚', 'completed', 1785591415964, '2026-08-01', 1785604719877),
  ('600733', '北汽蓝谷', 'completed', 1785677710667, '2026-08-02', 1785685980503),
  ('000712', '锦龙股份', 'completed', 1785762930032, '2026-08-03', 1785768388274),
  ('300296', '利亚德', 'completed', 1785849299543, '2026-08-04', 1785857713818),
  ('000429', '粤高速A', 'completed', 1785935696014, '2026-08-05', 1785936432636);
