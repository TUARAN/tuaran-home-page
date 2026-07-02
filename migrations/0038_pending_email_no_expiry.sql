-- 邮箱 pending 账号不再强制过期：未激活只降低信任等级，不删除身份。
UPDATE email_users
   SET activation_expires_at = NULL
 WHERE status = 'pending';
