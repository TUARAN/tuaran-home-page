-- 站长后台向 X 插件下发的远程指令；插件心跳时拉取，执行后回写结果。
CREATE TABLE IF NOT EXISTS x_extension_commands (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  command TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  claimed_at INTEGER,
  finished_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_x_extension_commands_device_pending
  ON x_extension_commands(device_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_x_extension_commands_recent
  ON x_extension_commands(device_id, created_at DESC);
