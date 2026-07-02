-- 邮箱临时账号：游客可先用邮箱 + 自设密码进入，需当天完成邮箱激活。
ALTER TABLE email_users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE email_users ADD COLUMN activation_expires_at INTEGER;

UPDATE email_users
   SET status = 'active',
       activation_expires_at = NULL
 WHERE email_verified_at > 0;
