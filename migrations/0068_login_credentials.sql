-- 由站长通过本地 CLI 创建的登录凭证。明文凭证只在创建时显示一次，D1 仅保存
-- PBKDF2-SHA256 派生值。每个凭证固定指向一个平台账号，可用来登录后绑定 OAuth。
CREATE TABLE IF NOT EXISTS login_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  account_login TEXT NOT NULL DEFAULT '',
  account_name TEXT NOT NULL DEFAULT '',
  secret_salt TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  hash_iterations INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  disabled_at INTEGER,
  last_used_at INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_login_credentials_user
  ON login_credentials (user_id);
