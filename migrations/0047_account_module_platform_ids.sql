-- 账号模块：站内账号与具体登录方式彻底分离。
--
-- site_users.id 在早期版本中直接存 github:<id> / google:<sub> / email:<uuid>。
-- 此迁移保留它作为兼容别名，新增 platform_id 作为唯一、不可变的站内账号 ID；
-- 后续所有业务 user_id 都改为 platform_id。OAuth、微信和邮箱只保存在
-- account_identities，游客历史则保存在既有 guest_bindings。

ALTER TABLE site_users ADD COLUMN platform_id TEXT;

-- D1/SQLite 没有内置 UUID 函数；32 位随机十六进制值与 acct_ 前缀组成平台 ID。
-- platform_id 有唯一索引，极小概率冲突会由后续账号创建逻辑重新生成。
UPDATE site_users
SET platform_id = 'acct_' || lower(hex(randomblob(16)))
WHERE platform_id IS NULL OR platform_id = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_users_platform_id
  ON site_users(platform_id);

CREATE TABLE IF NOT EXISTS platform_accounts (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO platform_accounts (id, created_at, updated_at)
SELECT platform_id, first_seen_at, last_seen_at
FROM site_users
WHERE platform_id IS NOT NULL AND platform_id != '';

-- 0046 已把 OAuth 身份写入 account_identities；把它们的目标改为平台账号。
UPDATE account_identities
SET user_id = (
  SELECT platform_id FROM site_users WHERE site_users.id = account_identities.user_id
)
WHERE user_id IN (SELECT id FROM site_users WHERE platform_id IS NOT NULL AND platform_id != '');

-- 邮箱密码也是一种登录身份。账号键使用规范化邮箱，而非可变的显示名称。
INSERT OR IGNORE INTO account_identities
  (provider, provider_account_id, user_id, provider_login, provider_name, provider_image, created_at, updated_at)
SELECT
  'email', lower(e.email), s.platform_id, lower(e.email), e.name, NULL, e.created_at, e.updated_at
FROM email_users e
JOIN site_users s ON s.id = e.id;

-- 所有站内业务数据以平台 ID 作为外键语义。游客 guest:<uuid> 不在 site_users，
-- 因而不会受这些更新影响，仍由 guest_bindings 记录其随后归属的账号。
UPDATE stomps SET user_id = (SELECT platform_id FROM site_users WHERE id = stomps.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE dad_todo_completions SET user_id = (SELECT platform_id FROM site_users WHERE id = dad_todo_completions.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE short_links SET user_id = (SELECT platform_id FROM site_users WHERE id = short_links.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE voice_tasks SET user_id = (SELECT platform_id FROM site_users WHERE id = voice_tasks.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE article_comments SET user_id = (SELECT platform_id FROM site_users WHERE id = article_comments.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE private_records SET user_id = (SELECT platform_id FROM site_users WHERE id = private_records.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE article_likes SET user_id = (SELECT platform_id FROM site_users WHERE id = article_likes.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE article_likes SET voter_key = 'user:' || (SELECT platform_id FROM site_users WHERE 'user:' || site_users.id = article_likes.voter_key)
WHERE voter_key IN (SELECT 'user:' || id FROM site_users);
UPDATE guest_bindings SET user_id = (SELECT platform_id FROM site_users WHERE id = guest_bindings.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE point_ledger SET user_id = (SELECT platform_id FROM site_users WHERE id = point_ledger.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE user_points SET user_id = (SELECT platform_id FROM site_users WHERE id = user_points.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE resource_unlocks SET user_id = (SELECT platform_id FROM site_users WHERE id = resource_unlocks.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE wc_predictions SET user_id = (SELECT platform_id FROM site_users WHERE id = wc_predictions.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE comment_notifications SET recipient_user_id = (SELECT platform_id FROM site_users WHERE id = comment_notifications.recipient_user_id)
WHERE recipient_user_id IN (SELECT id FROM site_users);
UPDATE comment_notifications SET actor_user_id = (SELECT platform_id FROM site_users WHERE id = comment_notifications.actor_user_id)
WHERE actor_user_id IN (SELECT id FROM site_users);
UPDATE newsletter_subscribers SET user_id = (SELECT platform_id FROM site_users WHERE id = newsletter_subscribers.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE hosted_images SET user_id = (SELECT platform_id FROM site_users WHERE id = hosted_images.user_id)
WHERE user_id IN (SELECT id FROM site_users);
UPDATE resource_events SET user_id = (SELECT platform_id FROM site_users WHERE id = resource_events.user_id)
WHERE user_id IN (SELECT id FROM site_users);
