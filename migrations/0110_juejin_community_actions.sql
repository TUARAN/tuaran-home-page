-- 为掘金插件增加设备平台值；事件表的 platform 列没有枚举约束。
CREATE TABLE community_action_devices_next (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('x', 'xhs', 'juejin')),
  extension_version TEXT NOT NULL DEFAULT '',
  account_handle TEXT NOT NULL DEFAULT '',
  last_seen_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

INSERT INTO community_action_devices_next
  (id, platform, extension_version, account_handle, last_seen_at, created_at)
SELECT id, platform, extension_version, account_handle, last_seen_at, created_at
FROM community_action_devices;

DROP TABLE community_action_devices;
ALTER TABLE community_action_devices_next RENAME TO community_action_devices;
