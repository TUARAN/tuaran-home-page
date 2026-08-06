-- DeepSeek 密钥管理与调用记录关联。
-- key_cipher 是 AES-GCM 密文（v1 payload），界面只展示 key_hint 掩码；
-- 加密主密钥 DEEPSEEK_KEYS_ENC_SECRET 走 Cloudflare Secret，不落库。
-- bound_tasks 为 JSON 数组：[{ "source": "...", "taskType": "..." }]，
-- source 匹配必填，taskType 为空表示该 source 下全部任务；空数组表示全局兜底。
CREATE TABLE IF NOT EXISTS deepseek_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  key_hint TEXT NOT NULL DEFAULT '',
  key_cipher TEXT NOT NULL DEFAULT '',
  env_ref TEXT NOT NULL DEFAULT '',
  base_url TEXT NOT NULL DEFAULT '',
  default_model TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  note TEXT NOT NULL DEFAULT '',
  bound_tasks TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_used_at INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_deepseek_keys_status
  ON deepseek_keys (status, updated_at DESC);

-- 调用记录关联到具体密钥（只存 key_id 与冗余 key_name，便于台账展示）。
ALTER TABLE deepseek_tasks ADD COLUMN key_id TEXT NOT NULL DEFAULT '';
ALTER TABLE deepseek_tasks ADD COLUMN key_name TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_deepseek_tasks_key
  ON deepseek_tasks (key_id, created_at DESC);
