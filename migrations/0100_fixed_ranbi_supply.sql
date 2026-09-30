-- 燃币固定总量升级：21,000,000 枚一次性分配，之后只允许账户之间转账。
-- 旧 point_ledger 保留为历史正本；迁移先用账本修复 user_points，再把未释放额度放入五个储备池。

CREATE TABLE IF NOT EXISTS ranbi_supply (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_supply INTEGER NOT NULL CHECK (total_supply = 21000000),
  public_version TEXT NOT NULL,
  launched_at INTEGER NOT NULL,
  upgraded_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO ranbi_supply (id, total_supply, public_version, launched_at, upgraded_at)
VALUES (1, 21000000, '2026-fixed-21m-v1', 1782121133854, 1790730000000);

-- 账本为正本：修复已有缓存余额，并补出只有流水、没有 user_points 的身份。
UPDATE user_points
   SET balance = COALESCE((SELECT SUM(pl.delta) FROM point_ledger pl WHERE pl.user_id = user_points.user_id), 0),
       updated_at = 1790730000000;

INSERT OR IGNORE INTO user_points (user_id, balance, updated_at)
SELECT user_id, SUM(delta), 1790730000000
  FROM point_ledger
 GROUP BY user_id;

CREATE TABLE IF NOT EXISTS ranbi_system_accounts (
  account_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('pool', 'burn')),
  allocation INTEGER NOT NULL CHECK (allocation >= 0),
  balance INTEGER NOT NULL CHECK (balance >= 0),
  spendable INTEGER NOT NULL DEFAULT 1 CHECK (spendable IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- 历史累计正向发放全部计入社区池；历史负流水全部计入黑洞。
INSERT OR IGNORE INTO ranbi_system_accounts
  (account_id, label, account_type, allocation, balance, spendable, sort_order, updated_at)
VALUES
  ('pool:community', '社区参与池', 'pool', 6300000,
    6300000 - (SELECT COALESCE(SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END), 0) FROM point_ledger), 1, 10, 1790730000000),
  ('pool:owner', '站长与长期维护池', 'pool', 6300000, 6300000, 1, 20, 1790730000000),
  ('pool:contributors', '内容与资源贡献池', 'pool', 4200000, 4200000, 1, 30, 1790730000000),
  ('pool:ecosystem', '生态活动池', 'pool', 2100000, 2100000, 1, 40, 1790730000000),
  ('pool:reserve', '长期储备池', 'pool', 2100000, 2100000, 1, 50, 1790730000000),
  ('system:burn', '燃币黑洞', 'burn', 0,
    (SELECT COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) FROM point_ledger), 0, 99, 1790730000000);

CREATE TABLE IF NOT EXISTS ranbi_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  CHECK (from_account <> to_account),
  UNIQUE (from_account, to_account, reason, ref)
);

CREATE INDEX IF NOT EXISTS idx_ranbi_transfers_created
  ON ranbi_transfers (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_ranbi_transfers_from_created
  ON ranbi_transfers (from_account, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ranbi_transfers_to_created
  ON ranbi_transfers (to_account, created_at DESC);

-- 在数据库层拒绝黑洞转出、未知系统账户、余额不足和无余额用户。
CREATE TRIGGER IF NOT EXISTS ranbi_transfer_validate
BEFORE INSERT ON ranbi_transfers
BEGIN
  SELECT CASE
    WHEN NEW.from_account = 'system:burn' THEN RAISE(ABORT, 'RANBI_BURN_LOCKED')
    WHEN (NEW.from_account LIKE 'pool:%' OR NEW.from_account LIKE 'system:%')
      AND NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.from_account)
      THEN RAISE(ABORT, 'RANBI_UNKNOWN_SOURCE')
    WHEN (NEW.to_account LIKE 'pool:%' OR NEW.to_account LIKE 'system:%')
      AND NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.to_account)
      THEN RAISE(ABORT, 'RANBI_UNKNOWN_DESTINATION')
    WHEN EXISTS (
      SELECT 1 FROM ranbi_system_accounts
       WHERE account_id = NEW.from_account AND (spendable = 0 OR balance < NEW.amount)
    ) THEN RAISE(ABORT, 'RANBI_POOL_EXHAUSTED')
    WHEN NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.from_account)
      AND COALESCE((SELECT balance FROM user_points WHERE user_id = NEW.from_account), -1) < NEW.amount
      THEN RAISE(ABORT, 'RANBI_INSUFFICIENT_BALANCE')
  END;
END;

-- 一笔 transfer 同时更新系统池、用户余额和兼容流水；INSERT OR IGNORE 保证幂等。
CREATE TRIGGER IF NOT EXISTS ranbi_transfer_apply
AFTER INSERT ON ranbi_transfers
BEGIN
  UPDATE ranbi_system_accounts
     SET balance = balance - NEW.amount, updated_at = NEW.created_at
   WHERE account_id = NEW.from_account;

  UPDATE user_points
     SET balance = balance - NEW.amount, updated_at = NEW.created_at
   WHERE user_id = NEW.from_account
     AND NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.from_account);

  UPDATE ranbi_system_accounts
     SET balance = balance + NEW.amount, updated_at = NEW.created_at
   WHERE account_id = NEW.to_account;

  INSERT INTO user_points (user_id, balance, updated_at)
  SELECT NEW.to_account, NEW.amount, NEW.created_at
   WHERE NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.to_account)
  ON CONFLICT(user_id) DO UPDATE SET
    balance = user_points.balance + excluded.balance,
    updated_at = excluded.updated_at;

  INSERT OR IGNORE INTO point_ledger (user_id, delta, reason, ref, created_at)
  SELECT NEW.from_account, -NEW.amount, NEW.reason, NEW.ref, NEW.created_at
   WHERE NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.from_account);

  INSERT OR IGNORE INTO point_ledger (user_id, delta, reason, ref, created_at)
  SELECT NEW.to_account, NEW.amount, NEW.reason, NEW.ref, NEW.created_at
   WHERE NOT EXISTS (SELECT 1 FROM ranbi_system_accounts WHERE account_id = NEW.to_account);
END;

-- 游客只在首次尝试资源时领取一篇文字内容所需的试用额度。
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);

INSERT INTO site_settings (key, value, updated_at, updated_by)
VALUES ('ranbi.guestSeed', '5', 1790730000000, 'migration:0100')
ON CONFLICT(key) DO UPDATE SET
  value = excluded.value,
  updated_at = excluded.updated_at,
  updated_by = excluded.updated_by;
