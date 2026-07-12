-- 登录身份与站内账号分离：一个 site_users.id 可以绑定多个 OAuth 身份。
-- provider_account_id 对每个提供方全局唯一，防止同一个微信/GitHub/Google
-- 身份被绑定到多个站内账号。
CREATE TABLE IF NOT EXISTS account_identities (
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider_login TEXT NOT NULL DEFAULT '',
  provider_name TEXT NOT NULL DEFAULT '',
  provider_image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_account_identities_user
  ON account_identities (user_id);

-- 迁移前的 OAuth 账号 id 已经固定为 "provider:providerAccountId"，回填后仍指向原账号。
INSERT OR IGNORE INTO account_identities
  (provider, provider_account_id, user_id, provider_login, provider_name, provider_image, created_at, updated_at)
SELECT
  provider,
  substr(id, instr(id, ':') + 1),
  id,
  login,
  name,
  image,
  first_seen_at,
  last_seen_at
FROM site_users
WHERE provider IN ('github', 'google')
  AND instr(id, ':') > 0;
