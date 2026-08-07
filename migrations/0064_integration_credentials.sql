-- 集成与 API Keys 管理：外部服务凭证统一登记。
-- 明文用 AES-GCM 加密后落库（主密钥 INTEGRATION_KEYS_ENC_SECRET，
-- 未配置时回退 DEEPSEEK_KEYS_ENC_SECRET），界面只展示掩码。
-- env_ref 记录该凭证在 Cloudflare Pages 里对应的环境变量名（如 X_API_KEY），
-- 便于把「环境变量 Secret」与「站内登记凭证」两种形态收口到同一台账。
CREATE TABLE IF NOT EXISTS integration_credentials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'secret'
    CHECK (kind IN ('secret', 'token', 'webhook')),
  env_ref TEXT NOT NULL DEFAULT '',
  key_hint TEXT NOT NULL DEFAULT '',
  key_cipher TEXT NOT NULL DEFAULT '',
  base_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  note TEXT NOT NULL DEFAULT '',
  used_count INTEGER NOT NULL DEFAULT 0,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_service
  ON integration_credentials (service, status, updated_at DESC);
