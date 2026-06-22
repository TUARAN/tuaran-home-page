-- 游客身份绑定（一期·游客评论）
-- 背景：免登录游客的写操作（评论）记在 guest_id 名下，guest_id 来自
--       tuaran_guest 签名 cookie（HMAC，篡改即失效）。注册/登录瞬间，若请求
--       带有效 guest cookie，则写一条 guest_id → user_id 绑定，并把该 guest 的
--       历史评论迁移到正式账号下。
-- 抢绑保护：gid 为主键，INSERT OR IGNORE 保证一个 guest_id 只能绑第一个
--           完成绑定的账号（幂等、可重入）。
CREATE TABLE IF NOT EXISTS guest_bindings (
  gid TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bound_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guest_bindings_user ON guest_bindings(user_id);
