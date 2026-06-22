-- DeepSeek 调用任务台账。
-- 只记录任务摘要、规划摘要、Token 和错误，不落完整 Prompt / API Key。
CREATE TABLE IF NOT EXISTS deepseek_tasks (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL DEFAULT '',
  task_type TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  execution_status TEXT NOT NULL DEFAULT 'running'
    CHECK (execution_status IN ('running', 'succeeded', 'failed')),
  management_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (management_status IN ('pending', 'reviewing', 'approved', 'archived')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high')),
  actor_id TEXT NOT NULL DEFAULT '',
  actor_name TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  input_summary TEXT NOT NULL DEFAULT '',
  result_summary TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_code TEXT NOT NULL DEFAULT '',
  error_detail TEXT NOT NULL DEFAULT '',
  management_note TEXT NOT NULL DEFAULT '',
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_created
  ON deepseek_tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_execution
  ON deepseek_tasks (execution_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_management
  ON deepseek_tasks (management_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_source
  ON deepseek_tasks (source, created_at DESC);
