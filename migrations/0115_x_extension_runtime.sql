-- X 插件最近一次运行快照；与动作回执分离，心跳不等于任务成功。
CREATE TABLE IF NOT EXISTS x_extension_runtime (
  device_id TEXT PRIMARY KEY,
  account_handle TEXT NOT NULL DEFAULT '',
  flow_phase TEXT NOT NULL DEFAULT 'unknown',
  tasks_json TEXT NOT NULL DEFAULT '[]',
  reported_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_x_extension_runtime_recent
  ON x_extension_runtime(reported_at DESC);
