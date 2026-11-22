-- 配对码与插件令牌只保存 SHA-256 摘要。撤销或过期后不可提交。
CREATE TABLE IF NOT EXISTS x_plugin_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  secret_hash TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('code', 'token')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_x_plugin_user ON x_plugin_credentials(user_id, kind);
