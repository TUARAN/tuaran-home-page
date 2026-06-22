-- 燃币体系（二期·燃币解锁）
-- 设计正本是「只增不改的流水账本（point_ledger）」，user_points 只是它的物化余额。
-- 扣燃币 = 再插一条负数，不改历史；余额错了能从账本重算。
-- 解锁记一条权益（resource_unlocks），解锁一次后永久可读，不再重复扣。
-- 表名/字段沿用通用范式（point_ledger / user_points / cost_points），
-- 仅前端与文案使用「燃币」称谓。

-- 燃币流水（正本，只增不改）
CREATE TABLE IF NOT EXISTS point_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,          -- register|checkin|comment|unlock|admin
  ref TEXT NOT NULL DEFAULT '',  -- 幂等键，如 checkin:2026-06-22 / unlock:r7
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_idem ON point_ledger(user_id, reason, ref);

-- 物化余额（可由账本重算）
CREATE TABLE IF NOT EXISTS user_points (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- 资源门槛配置
CREATE TABLE IF NOT EXISTS gated_resources (
  resource_key TEXT PRIMARY KEY,
  cost_points INTEGER NOT NULL DEFAULT 0,
  min_role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER NOT NULL
);

-- 解锁权益（解锁一次，永久可读）
CREATE TABLE IF NOT EXISTS resource_unlocks (
  user_id TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, resource_key)
);
