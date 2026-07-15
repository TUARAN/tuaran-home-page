-- 首页“换一批”推荐规则。使用 site_settings JSON，便于后续增加规则字段。
INSERT OR IGNORE INTO site_settings (key, value, updated_at, updated_by)
VALUES (
  'recommendations.home',
  '{"enabled":true,"batchSize":6,"latestCount":1,"rotationMode":"random","avoidImmediateRepeats":true,"sources":{"feed":{"enabled":true,"weight":2},"column":{"enabled":true,"weight":3},"research":{"enabled":true,"weight":3},"resources":{"enabled":true,"weight":2}},"pinnedIds":[]}',
  strftime('%s','now') * 1000,
  'migration'
);
