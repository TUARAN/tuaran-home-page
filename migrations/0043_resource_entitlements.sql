-- 资源权益改造：解锁价格冻结 + 领取/打开记录。
-- 资源的用户文案与站长运营文案维护在 lib/resourceCatalog.js；此处只保存可审计事实。

ALTER TABLE resource_unlocks ADD COLUMN cost_points INTEGER;

-- 先冻结旧权益的历史价格：调研一直是 5，旧版 resource:* 一直按 10 计价。
-- 已有显式配置时优先使用当时配置，避免后台覆盖过的资源被错误回填。
UPDATE resource_unlocks
   SET cost_points = COALESCE(
     (SELECT gr.cost_points FROM gated_resources gr WHERE gr.resource_key = resource_unlocks.resource_key),
     CASE
       WHEN resource_key LIKE 'research:%' THEN 5
       WHEN resource_key LIKE 'resource:%' THEN 10
       ELSE 0
     END
   )
 WHERE cost_points IS NULL;

CREATE TABLE IF NOT EXISTS resource_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  event_type TEXT NOT NULL, -- download | external_open
  item_key TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resource_events_user_created
  ON resource_events (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_resource_events_resource_created
  ON resource_events (resource_key, created_at DESC, id DESC);

-- 工具包按“领取”而不是“阅读”定价。文字资源则回退到新的 resource:* 默认 5。
INSERT OR IGNORE INTO gated_resources (resource_key, cost_points, min_role, created_at)
VALUES
  ('resource:x-mutual-cleaner-extension', 10, 'guest', 1783766400000),
  ('resource:2aran-desktop', 10, 'guest', 1783766400000);
