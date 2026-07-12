-- 语音记事改为登录用户工具：即使后台此前把该项覆写为 owner，也让它对任意已登录账户可见。
INSERT INTO nav_overrides (href, audience, updated_at)
VALUES ('/voice-tasks', 'authed', unixepoch() * 1000)
ON CONFLICT(href) DO UPDATE SET
  audience = excluded.audience,
  updated_at = excluded.updated_at;
