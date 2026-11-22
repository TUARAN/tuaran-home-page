-- x.2aran.com 工作台 P0：X 账号绑定、按账号的智能体人格与记忆、月额度记账。
-- 设计见 docs/specs/x-workbench.md。所有表按 user_id 隔离，user_id 取主站登录用户 id。
CREATE TABLE IF NOT EXISTS x_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, handle)
);

CREATE INDEX IF NOT EXISTS idx_x_accounts_user ON x_accounts(user_id, status);

CREATE TABLE IF NOT EXISTS x_agent_profiles (
  user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  persona_json TEXT NOT NULL DEFAULT '{}',
  memory_json TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, handle)
);

CREATE TABLE IF NOT EXISTS x_usage (
  user_id TEXT NOT NULL,
  period TEXT NOT NULL,
  kind TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, period, kind)
);
