-- 统一大模型调用台账，并增加可管理的 NAS / Ollama 服务。
-- Ollama 的访问令牌可选；若填写，使用与 DeepSeek Key 相同的主密钥加密。
CREATE TABLE IF NOT EXISTS llm_providers (
  id TEXT PRIMARY KEY,
  provider_type TEXT NOT NULL DEFAULT 'ollama'
    CHECK (provider_type IN ('ollama')),
  name TEXT NOT NULL DEFAULT '',
  base_url TEXT NOT NULL DEFAULT '',
  default_model TEXT NOT NULL DEFAULT '',
  auth_hint TEXT NOT NULL DEFAULT '',
  auth_cipher TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  note TEXT NOT NULL DEFAULT '',
  last_checked_at INTEGER,
  last_check_status TEXT NOT NULL DEFAULT '',
  last_check_detail TEXT NOT NULL DEFAULT '',
  last_used_at INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_llm_providers_type_status
  ON llm_providers (provider_type, status, updated_at DESC);

-- 旧记录统一标记为 DeepSeek；新 Ollama 调用写入 provider_id / provider_name。
ALTER TABLE deepseek_tasks ADD COLUMN provider TEXT NOT NULL DEFAULT 'deepseek';
ALTER TABLE deepseek_tasks ADD COLUMN provider_id TEXT NOT NULL DEFAULT '';
ALTER TABLE deepseek_tasks ADD COLUMN provider_name TEXT NOT NULL DEFAULT 'DeepSeek';

CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_provider
  ON deepseek_tasks (provider, created_at DESC);
