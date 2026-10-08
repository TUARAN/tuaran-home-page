-- 固定总量上线后，WorkBuddy 仍直接写 point_ledger / user_points。
-- 这 6 笔游客试用各 5 枚已经在用户余额里，但没有从社区池转出。
-- 只扣减社区池。不能补插 ranbi_transfers，否则转账触发器会把这 30 枚再发给一次游客。
-- 重复执行不会再次扣减。

INSERT OR IGNORE INTO site_settings (key, value, updated_at, updated_by)
SELECT 'ranbi.reconcile.direct_guest_seed',
       CAST(COALESCE(SUM(pl.delta), 0) AS TEXT),
       1791446400000,
       'migration:0108'
FROM point_ledger pl
WHERE pl.reason = 'guest_seed'
  AND pl.delta > 0
  AND EXISTS (SELECT 1 FROM ranbi_transfers)
  AND pl.created_at > (SELECT MIN(created_at) FROM ranbi_transfers)
  AND NOT EXISTS (
    SELECT 1 FROM ranbi_transfers t
    WHERE t.to_account = pl.user_id
      AND t.reason = pl.reason
      AND t.ref = pl.ref
      AND t.amount = pl.delta
  )
HAVING COALESCE(SUM(pl.delta), 0) > 0;

UPDATE ranbi_system_accounts
   SET balance = balance - CAST(
         (SELECT value FROM site_settings
           WHERE key = 'ranbi.reconcile.direct_guest_seed' AND updated_by = 'migration:0108')
         AS INTEGER
       ),
       updated_at = 1791446400000
 WHERE account_id = 'pool:community'
   AND EXISTS (
     SELECT 1 FROM site_settings
      WHERE key = 'ranbi.reconcile.direct_guest_seed' AND updated_by = 'migration:0108'
   );

UPDATE site_settings
   SET updated_by = 'migration:0108:applied'
 WHERE key = 'ranbi.reconcile.direct_guest_seed' AND updated_by = 'migration:0108';
