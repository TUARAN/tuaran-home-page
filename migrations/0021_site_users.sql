-- 用户目录（/admin/users 用户管理）
-- 背景：GitHub / Google OAuth 用户只存在于签名 cookie 会话里，从未落库；
--       只有邮箱注册用户在 email_users。本表作为统一用户目录：
--       每次登录（4 个入口：github/google 回调、邮箱 login/register）upsert 一行。
-- 角色 role ∈ ('member','trusted','blocked')：
--   member  默认；trusted 预留（免限流/早期内容等）；blocked 禁止评论等写操作。
--   owner 不存这里——仍由环境变量（lib/ownerAuth.js）判定，避免 DB 成为提权面。
CREATE TABLE IF NOT EXISTS site_users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT '',
  login TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  image TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  note TEXT NOT NULL DEFAULT '',
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  login_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_site_users_last_seen
  ON site_users (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_users_role
  ON site_users (role);

-- 回填一：邮箱注册用户（email_users 是邮箱体系正本，本表只是目录视图）
INSERT OR IGNORE INTO site_users
  (id, provider, login, name, email, image, role, note, first_seen_at, last_seen_at, login_count)
SELECT
  id, 'email', email, name, email, NULL, 'member', '',
  created_at, updated_at, 0
FROM email_users;

-- 回填二：历史评论作者（OAuth 用户唯一留过痕迹的地方）
INSERT OR IGNORE INTO site_users
  (id, provider, login, name, email, image, role, note, first_seen_at, last_seen_at, login_count)
SELECT
  user_id,
  MAX(user_provider),
  '',
  MAX(user_name),
  '',
  MAX(user_image),
  'member',
  '回填自历史评论',
  MIN(created_at),
  MAX(created_at),
  0
FROM article_comments
GROUP BY user_id;
