-- X 自动发布成本流水：只记录 X 已确认创建成功的 Post。
-- 金额使用微美元，避免小数累计误差；post_id 唯一，重试不会重复记账。
CREATE TABLE IF NOT EXISTS x_api_cost_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL UNIQUE,
  automation_id TEXT NOT NULL,
  slot TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  pricing_key TEXT NOT NULL,
  unit_cost_micro_usd INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_x_api_cost_events_automation_created
  ON x_api_cost_events(automation_id, created_at DESC);
