-- 插件历史同步与按账号监控都按 platform + account_handle + occurred_at 过滤。
-- 原先只有 occurred_at / platform+occurred_at 索引，过滤账号时容易扫过多行，
-- 在 Free 套餐「每日 500 万行读取（账号级）」下很容易把额度打穿。
CREATE INDEX IF NOT EXISTS idx_community_action_events_platform_account_time
  ON community_action_events(platform, account_handle, occurred_at DESC);
