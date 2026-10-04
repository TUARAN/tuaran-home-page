-- 签到补签卡：燃币礼物铺即时兑换，近七日内使用。补签只修复连续签到记录，不发燃币。
CREATE TABLE IF NOT EXISTS checkin_makeup_card_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL CHECK (delta IN (-1, 1)),
  reason TEXT NOT NULL CHECK (reason IN ('reward_redeem', 'makeup_checkin', 'admin')),
  ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, reason, ref)
);

CREATE INDEX IF NOT EXISTS idx_makeup_card_ledger_user_created
  ON checkin_makeup_card_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS checkin_makeups (
  user_id TEXT NOT NULL,
  checkin_date TEXT NOT NULL,
  card_ledger_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, checkin_date),
  FOREIGN KEY (card_ledger_id) REFERENCES checkin_makeup_card_ledger(id)
);

INSERT INTO reward_items
  (id, title, description, emoji, cost_points, item_type, stock, per_user_limit, active, sort_order, created_at, updated_at)
VALUES
  ('checkin-makeup-card', '签到补签卡', '漏签后可补近七日内的一天。补签只恢复连续签到记录，不补发当天燃币；每个账号最多同时持有 2 张。', '🗓️', 30, 'digital', -1, 0, 1, 100, 1791062400000, 1791062400000)
ON CONFLICT(id) DO NOTHING;
