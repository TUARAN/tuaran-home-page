-- 签到礼物铺：站长维护礼物，登录用户使用燃币兑换，实物订单由站长人工履约。
CREATE TABLE IF NOT EXISTS reward_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎁',
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  item_type TEXT NOT NULL DEFAULT 'physical' CHECK (item_type IN ('physical', 'digital')),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1), -- -1 表示不限库存
  per_user_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_user_limit >= 0), -- 0 表示不限
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  reward_title TEXT NOT NULL,
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('physical', 'digital')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'completed', 'cancelled')),
  recipient_name TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  shipping_address TEXT NOT NULL DEFAULT '',
  user_note TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  tracking_no TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (reward_id) REFERENCES reward_items(id)
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_created
  ON reward_redemptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status_created
  ON reward_redemptions(status, created_at DESC);
