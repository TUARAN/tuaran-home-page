-- 站长监控使用增量计数，避免反复扫描全部社区动作回执。
CREATE TABLE IF NOT EXISTS community_action_daily_counts (
  platform TEXT NOT NULL,
  report_date TEXT NOT NULL,
  task TEXT NOT NULL,
  result TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (platform, report_date, task, result)
);

-- 先安装触发器，避免回填与新回执写入之间出现计数空档。
CREATE TRIGGER IF NOT EXISTS trg_community_action_daily_counts_insert
AFTER INSERT ON community_action_events
WHEN NEW.platform = 'x'
BEGIN
  INSERT INTO community_action_daily_counts (platform, report_date, task, result, count)
  VALUES (NEW.platform, date(NEW.occurred_at / 1000, 'unixepoch', '+8 hours'), NEW.task, NEW.result, 1)
  ON CONFLICT(platform, report_date, task, result) DO UPDATE SET count = count + 1;
END;

-- 历史数据按北京时间回填。重复 ID 被忽略时，触发器不会增加计数。
INSERT INTO community_action_daily_counts (platform, report_date, task, result, count)
SELECT platform, date(occurred_at / 1000, 'unixepoch', '+8 hours'), task, result, COUNT(*)
FROM community_action_events
WHERE platform = 'x'
GROUP BY platform, date(occurred_at / 1000, 'unixepoch', '+8 hours'), task, result
ON CONFLICT(platform, report_date, task, result) DO UPDATE SET count = excluded.count;
