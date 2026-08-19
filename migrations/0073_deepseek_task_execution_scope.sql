-- 区分由 2aran.com 服务端发起的云调用与个人设备发起的本地调用。
-- 历史记录和现有调用默认归为 cloud；Mac → NAS Qwen 同步记录显式写入 local。
ALTER TABLE deepseek_tasks ADD COLUMN execution_scope TEXT NOT NULL DEFAULT 'cloud'
  CHECK (execution_scope IN ('cloud', 'local'));

CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_scope
  ON deepseek_tasks (execution_scope, created_at DESC);
