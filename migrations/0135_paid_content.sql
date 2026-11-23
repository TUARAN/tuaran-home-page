-- 付费解锁：订单表 + 权益来源 + 现金价格。
-- 权益仍写在 resource_unlocks，与燃币共用一套判定；source 区分来源，便于审计与补单。

CREATE TABLE IF NOT EXISTS paid_orders (
  out_trade_no TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  amount_fen INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'xunhupay',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | closed | failed
  gateway_order_id TEXT,
  transaction_id TEXT,
  qr_code_url TEXT,
  pay_url TEXT,
  notify_count INTEGER NOT NULL DEFAULT 0,
  raw_notify TEXT,
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_paid_orders_user_created
  ON paid_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paid_orders_status_created
  ON paid_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paid_orders_resource
  ON paid_orders (resource_key, created_at DESC);

-- 权益来源与订单引用：燃币解锁保持 ranbi，现金为 paid，站长补单为 admin
ALTER TABLE resource_unlocks ADD COLUMN source TEXT DEFAULT 'ranbi';
ALTER TABLE resource_unlocks ADD COLUMN order_ref TEXT;

-- 现金价（分）。0 表示该资源不开放现金购买，只走燃币。
ALTER TABLE gated_resources ADD COLUMN price_fen INTEGER DEFAULT 0;

-- 示例：把一篇调研定价 10 元（上线时由站长在后台逐个配置，这里不预置业务数据）
-- INSERT OR IGNORE INTO gated_resources (resource_key, cost_points, min_role, created_at, price_fen)
-- VALUES ('research:companies:example-slug', 5, 'guest', 0, 1000);
