-- 所有插件平台共用按北京时间日期聚合的确认回执计数。
CREATE INDEX IF NOT EXISTS idx_community_action_events_platform_time
  ON community_action_events(platform, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_action_devices_platform_seen
  ON community_action_devices(platform, last_seen_at DESC);

DROP TRIGGER IF EXISTS trg_community_action_daily_counts_insert;

CREATE TRIGGER trg_community_action_daily_counts_insert
AFTER INSERT ON community_action_events
WHEN NEW.platform IN ('x', 'xhs', 'juejin')
BEGIN
  INSERT INTO community_action_daily_counts (platform, report_date, task, result, count)
  VALUES (NEW.platform, date(NEW.occurred_at / 1000, 'unixepoch', '+8 hours'), NEW.task, NEW.result, 1)
  ON CONFLICT(platform, report_date, task, result) DO UPDATE SET count = count + 1;
END;

-- 补齐历史小红书与掘金回执，重复执行时按实际回执总数覆盖。
INSERT INTO community_action_daily_counts (platform, report_date, task, result, count)
SELECT platform, date(occurred_at / 1000, 'unixepoch', '+8 hours'), task, result, COUNT(*)
FROM community_action_events
WHERE platform IN ('xhs', 'juejin')
GROUP BY platform, date(occurred_at / 1000, 'unixepoch', '+8 hours'), task, result
ON CONFLICT(platform, report_date, task, result) DO UPDATE SET count = excluded.count;
