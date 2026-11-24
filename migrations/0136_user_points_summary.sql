-- user_points 汇总计数器：让 /ranbi 供应量取数从「整表扫 4.8 万行」降到「读 1 行」。
--
-- 为什么用触发器而不是在 JS 写入路径里加减：写 user_points 的地方只有三处，
-- 全部经过 SQL —— 0100 的 ranbi_transfer_apply（转账应用）、
-- repairBalanceFromLedger 的 upsert、历史迁移。触发器挂在表上才能覆盖所有路径，
-- 并与转账在同一事务内原子完成，不会出现「钱动了、计数没动」的窗口。
--
-- 顺序要求：先建表并回填，再建触发器。触发器里的 UPDATE ... WHERE id = 1
-- 在汇总行不存在时影响 0 行，先回填可避免计数器从 0 起算。
--
-- 计数器只是读侧缓存，账本仍是正本；lib/ledger/points.js 的
-- reconcileUserPointsSummary 会用全表聚合重算并与计数器比对，兜底漂移。

CREATE TABLE IF NOT EXISTS user_points_summary (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  identities INTEGER NOT NULL DEFAULT 0,
  circulating INTEGER NOT NULL DEFAULT 0,
  max_updated_at INTEGER NOT NULL DEFAULT 0,
  synced_at INTEGER NOT NULL DEFAULT 0
);

-- SQLite 的 upsert 不能直接跟在 SELECT 后面（会被当成 join 约束），
-- 这里用 OR IGNORE 保证重复执行时不重置计数器。
INSERT OR IGNORE INTO user_points_summary (id, identities, circulating, max_updated_at, synced_at)
SELECT 1, COUNT(*), COALESCE(SUM(balance), 0), COALESCE(MAX(updated_at), 0), 0
  FROM user_points;

-- 新身份首次入账：人数 +1，流通量累加。
CREATE TRIGGER IF NOT EXISTS user_points_summary_insert
AFTER INSERT ON user_points
BEGIN
  UPDATE user_points_summary
     SET identities = identities + 1,
         circulating = circulating + NEW.balance,
         max_updated_at = MAX(max_updated_at, NEW.updated_at)
   WHERE id = 1;
END;

-- 余额变动：人数不变，流通量按差额累加。只在 SET 里出现 balance 时触发。
CREATE TRIGGER IF NOT EXISTS user_points_summary_update
AFTER UPDATE OF balance ON user_points
BEGIN
  UPDATE user_points_summary
     SET circulating = circulating + (NEW.balance - OLD.balance),
         max_updated_at = MAX(max_updated_at, NEW.updated_at)
   WHERE id = 1;
END;

-- 删除身份：人数 -1，流通量扣回。
CREATE TRIGGER IF NOT EXISTS user_points_summary_delete
AFTER DELETE ON user_points
BEGIN
  UPDATE user_points_summary
     SET identities = identities - 1,
         circulating = circulating - OLD.balance
   WHERE id = 1;
END;
