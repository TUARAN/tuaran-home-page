-- 游客目录物化层：后台列表和总览只读取这两张小表，不再扫描业务表。
CREATE TABLE IF NOT EXISTS guest_directory (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  earned INTEGER NOT NULL DEFAULT 0,
  spent INTEGER NOT NULL DEFAULT 0,
  ledger_count INTEGER NOT NULL DEFAULT 0,
  unlock_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL DEFAULT 0,
  is_bound INTEGER NOT NULL DEFAULT 0 CHECK (is_bound IN (0, 1)),
  bound_user_id TEXT NOT NULL DEFAULT '',
  bound_at INTEGER NOT NULL DEFAULT 0,
  latest_ledger_id INTEGER,
  latest_delta INTEGER,
  latest_reason TEXT NOT NULL DEFAULT '',
  latest_ref TEXT NOT NULL DEFAULT '',
  latest_created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_guest_directory_recent
  ON guest_directory(last_seen_at DESC, user_id DESC);
CREATE INDEX IF NOT EXISTS idx_guest_directory_bound_recent
  ON guest_directory(is_bound, last_seen_at DESC, user_id DESC);

-- 一次性回填。后续变化全部由下方触发器增量维护。
INSERT OR REPLACE INTO guest_directory (
  user_id, balance, earned, spent, ledger_count, unlock_count, comment_count,
  first_seen_at, last_seen_at, is_bound, bound_user_id, bound_at,
  latest_ledger_id, latest_delta, latest_reason, latest_ref, latest_created_at, updated_at
)
WITH guest_ids AS (
  SELECT user_id FROM user_points WHERE user_id GLOB 'guest:*'
  UNION SELECT user_id FROM point_ledger WHERE user_id GLOB 'guest:*'
  UNION SELECT user_id FROM resource_unlocks WHERE user_id GLOB 'guest:*'
  UNION SELECT user_id FROM article_comments WHERE user_id GLOB 'guest:*'
  UNION SELECT 'guest:' || gid FROM guest_bindings
),
activity AS (
  SELECT user_id, MIN(event_at) AS first_seen_at, MAX(event_at) AS last_seen_at
  FROM (
    SELECT user_id, updated_at AS event_at FROM user_points WHERE user_id GLOB 'guest:*'
    UNION ALL SELECT user_id, created_at FROM point_ledger WHERE user_id GLOB 'guest:*'
    UNION ALL SELECT user_id, unlocked_at FROM resource_unlocks WHERE user_id GLOB 'guest:*'
    UNION ALL SELECT user_id, created_at FROM article_comments WHERE user_id GLOB 'guest:*'
    UNION ALL SELECT 'guest:' || gid, bound_at FROM guest_bindings
  ) events
  GROUP BY user_id
),
ledger_rollup AS (
  SELECT user_id,
         COUNT(*) AS ledger_count,
         SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) AS earned,
         SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END) AS spent,
         MAX(id) AS latest_id
  FROM point_ledger
  WHERE user_id GLOB 'guest:*'
  GROUP BY user_id
),
unlock_rollup AS (
  SELECT user_id, COUNT(*) AS unlock_count
  FROM resource_unlocks
  WHERE user_id GLOB 'guest:*'
  GROUP BY user_id
),
comment_rollup AS (
  SELECT user_id, COUNT(*) AS comment_count
  FROM article_comments
  WHERE user_id GLOB 'guest:*'
  GROUP BY user_id
)
SELECT g.user_id,
       COALESCE(up.balance, 0),
       COALESCE(lr.earned, 0),
       COALESCE(lr.spent, 0),
       COALESCE(lr.ledger_count, 0),
       COALESCE(ur.unlock_count, 0),
       COALESCE(cr.comment_count, 0),
       COALESCE(a.first_seen_at, 0),
       COALESCE(a.last_seen_at, 0),
       CASE WHEN gb.gid IS NULL THEN 0 ELSE 1 END,
       COALESCE(gb.user_id, ''),
       COALESCE(gb.bound_at, 0),
       ll.id, ll.delta, COALESCE(ll.reason, ''), COALESCE(ll.ref, ''), COALESCE(ll.created_at, 0),
       COALESCE(a.last_seen_at, 0)
FROM guest_ids g
LEFT JOIN user_points up ON up.user_id = g.user_id
LEFT JOIN activity a ON a.user_id = g.user_id
LEFT JOIN ledger_rollup lr ON lr.user_id = g.user_id
LEFT JOIN point_ledger ll ON ll.id = lr.latest_id
LEFT JOIN unlock_rollup ur ON ur.user_id = g.user_id
LEFT JOIN comment_rollup cr ON cr.user_id = g.user_id
LEFT JOIN guest_bindings gb ON ('guest:' || gb.gid) = g.user_id;

CREATE TABLE IF NOT EXISTS guest_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  bound INTEGER NOT NULL DEFAULT 0,
  total_balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  unlocks INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

INSERT OR REPLACE INTO guest_stats (
  id, total, active, bound, total_balance, total_earned, total_spent, unlocks, comments, updated_at
)
SELECT 1,
       COUNT(*),
       COALESCE(SUM(CASE WHEN is_bound = 0 THEN 1 ELSE 0 END), 0),
       COALESCE(SUM(CASE WHEN is_bound = 1 THEN 1 ELSE 0 END), 0),
       COALESCE(SUM(balance), 0), COALESCE(SUM(earned), 0), COALESCE(SUM(spent), 0),
       COALESCE(SUM(unlock_count), 0), COALESCE(SUM(comment_count), 0),
       CAST(unixepoch('subsec') * 1000 AS INTEGER)
FROM guest_directory;

-- 目录行变化同步到全局单行汇总。
CREATE TRIGGER IF NOT EXISTS trg_guest_directory_stats_insert
AFTER INSERT ON guest_directory
BEGIN
  UPDATE guest_stats SET
    total = total + 1,
    active = active + CASE WHEN NEW.is_bound = 0 THEN 1 ELSE 0 END,
    bound = bound + CASE WHEN NEW.is_bound = 1 THEN 1 ELSE 0 END,
    total_balance = total_balance + NEW.balance,
    total_earned = total_earned + NEW.earned,
    total_spent = total_spent + NEW.spent,
    unlocks = unlocks + NEW.unlock_count,
    comments = comments + NEW.comment_count,
    updated_at = NEW.updated_at
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_directory_stats_update
AFTER UPDATE ON guest_directory
BEGIN
  UPDATE guest_stats SET
    active = active + (CASE WHEN NEW.is_bound = 0 THEN 1 ELSE 0 END) - (CASE WHEN OLD.is_bound = 0 THEN 1 ELSE 0 END),
    bound = bound + (CASE WHEN NEW.is_bound = 1 THEN 1 ELSE 0 END) - (CASE WHEN OLD.is_bound = 1 THEN 1 ELSE 0 END),
    total_balance = total_balance + NEW.balance - OLD.balance,
    total_earned = total_earned + NEW.earned - OLD.earned,
    total_spent = total_spent + NEW.spent - OLD.spent,
    unlocks = unlocks + NEW.unlock_count - OLD.unlock_count,
    comments = comments + NEW.comment_count - OLD.comment_count,
    updated_at = NEW.updated_at
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_directory_stats_delete
AFTER DELETE ON guest_directory
BEGIN
  UPDATE guest_stats SET
    total = MAX(0, total - 1),
    active = MAX(0, active - CASE WHEN OLD.is_bound = 0 THEN 1 ELSE 0 END),
    bound = MAX(0, bound - CASE WHEN OLD.is_bound = 1 THEN 1 ELSE 0 END),
    total_balance = total_balance - OLD.balance,
    total_earned = total_earned - OLD.earned,
    total_spent = total_spent - OLD.spent,
    unlocks = MAX(0, unlocks - OLD.unlock_count),
    comments = MAX(0, comments - OLD.comment_count),
    updated_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)
  WHERE id = 1;
END;

-- 余额变化。
CREATE TRIGGER IF NOT EXISTS trg_guest_points_insert
AFTER INSERT ON user_points WHEN NEW.user_id GLOB 'guest:*'
BEGIN
  INSERT INTO guest_directory (user_id, balance, first_seen_at, last_seen_at, updated_at)
  VALUES (NEW.user_id, NEW.balance, NEW.updated_at, NEW.updated_at, NEW.updated_at)
  ON CONFLICT(user_id) DO UPDATE SET
    balance = excluded.balance,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at),
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_points_update
AFTER UPDATE OF balance, updated_at ON user_points WHEN NEW.user_id GLOB 'guest:*'
BEGIN
  INSERT INTO guest_directory (user_id, balance, first_seen_at, last_seen_at, updated_at)
  VALUES (NEW.user_id, NEW.balance, NEW.updated_at, NEW.updated_at, NEW.updated_at)
  ON CONFLICT(user_id) DO UPDATE SET
    balance = excluded.balance,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at),
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_points_delete
AFTER DELETE ON user_points WHEN OLD.user_id GLOB 'guest:*'
BEGIN
  UPDATE guest_directory SET balance = 0, updated_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)
  WHERE user_id = OLD.user_id;
END;

-- 流水只增不改；每次插入同时维护累计值和最新一条。
CREATE TRIGGER IF NOT EXISTS trg_guest_ledger_insert
AFTER INSERT ON point_ledger WHEN NEW.user_id GLOB 'guest:*'
BEGIN
  INSERT INTO guest_directory (
    user_id, earned, spent, ledger_count, first_seen_at, last_seen_at,
    latest_ledger_id, latest_delta, latest_reason, latest_ref, latest_created_at, updated_at
  ) VALUES (
    NEW.user_id, CASE WHEN NEW.delta > 0 THEN NEW.delta ELSE 0 END,
    CASE WHEN NEW.delta < 0 THEN -NEW.delta ELSE 0 END, 1, NEW.created_at, NEW.created_at,
    NEW.id, NEW.delta, NEW.reason, NEW.ref, NEW.created_at, NEW.created_at
  )
  ON CONFLICT(user_id) DO UPDATE SET
    earned = guest_directory.earned + excluded.earned,
    spent = guest_directory.spent + excluded.spent,
    ledger_count = guest_directory.ledger_count + 1,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at),
    latest_ledger_id = excluded.latest_ledger_id,
    latest_delta = excluded.latest_delta,
    latest_reason = excluded.latest_reason,
    latest_ref = excluded.latest_ref,
    latest_created_at = excluded.latest_created_at,
    updated_at = excluded.updated_at;
END;

-- 解锁增删/迁移。
CREATE TRIGGER IF NOT EXISTS trg_guest_unlock_insert
AFTER INSERT ON resource_unlocks WHEN NEW.user_id GLOB 'guest:*'
BEGIN
  INSERT INTO guest_directory (user_id, unlock_count, first_seen_at, last_seen_at, updated_at)
  VALUES (NEW.user_id, 1, NEW.unlocked_at, NEW.unlocked_at, NEW.unlocked_at)
  ON CONFLICT(user_id) DO UPDATE SET
    unlock_count = guest_directory.unlock_count + 1,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at),
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_unlock_delete
AFTER DELETE ON resource_unlocks WHEN OLD.user_id GLOB 'guest:*'
BEGIN
  UPDATE guest_directory SET unlock_count = MAX(0, unlock_count - 1), updated_at = OLD.unlocked_at
  WHERE user_id = OLD.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_unlock_move_from
AFTER UPDATE OF user_id ON resource_unlocks WHEN OLD.user_id GLOB 'guest:*' AND OLD.user_id <> NEW.user_id
BEGIN
  UPDATE guest_directory SET unlock_count = MAX(0, unlock_count - 1), updated_at = NEW.unlocked_at
  WHERE user_id = OLD.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_unlock_move_to
AFTER UPDATE OF user_id ON resource_unlocks WHEN NEW.user_id GLOB 'guest:*' AND OLD.user_id <> NEW.user_id
BEGIN
  INSERT INTO guest_directory (user_id, unlock_count, first_seen_at, last_seen_at, updated_at)
  VALUES (NEW.user_id, 1, NEW.unlocked_at, NEW.unlocked_at, NEW.unlocked_at)
  ON CONFLICT(user_id) DO UPDATE SET unlock_count = guest_directory.unlock_count + 1,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at), updated_at = excluded.updated_at;
END;

-- 评论增删/迁移。
CREATE TRIGGER IF NOT EXISTS trg_guest_comment_insert
AFTER INSERT ON article_comments WHEN NEW.user_id GLOB 'guest:*'
BEGIN
  INSERT INTO guest_directory (user_id, comment_count, first_seen_at, last_seen_at, updated_at)
  VALUES (NEW.user_id, 1, NEW.created_at, NEW.created_at, NEW.created_at)
  ON CONFLICT(user_id) DO UPDATE SET
    comment_count = guest_directory.comment_count + 1,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at),
    updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_comment_delete
AFTER DELETE ON article_comments WHEN OLD.user_id GLOB 'guest:*'
BEGIN
  UPDATE guest_directory SET comment_count = MAX(0, comment_count - 1), updated_at = OLD.created_at
  WHERE user_id = OLD.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_comment_move_from
AFTER UPDATE OF user_id ON article_comments WHEN OLD.user_id GLOB 'guest:*' AND OLD.user_id <> NEW.user_id
BEGIN
  UPDATE guest_directory SET comment_count = MAX(0, comment_count - 1), updated_at = NEW.created_at
  WHERE user_id = OLD.user_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_comment_move_to
AFTER UPDATE OF user_id ON article_comments WHEN NEW.user_id GLOB 'guest:*' AND OLD.user_id <> NEW.user_id
BEGIN
  INSERT INTO guest_directory (user_id, comment_count, first_seen_at, last_seen_at, updated_at)
  VALUES (NEW.user_id, 1, NEW.created_at, NEW.created_at, NEW.created_at)
  ON CONFLICT(user_id) DO UPDATE SET comment_count = guest_directory.comment_count + 1,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at), updated_at = excluded.updated_at;
END;

-- 游客绑定状态。
CREATE TRIGGER IF NOT EXISTS trg_guest_binding_insert
AFTER INSERT ON guest_bindings
BEGIN
  INSERT INTO guest_directory (user_id, is_bound, bound_user_id, bound_at, first_seen_at, last_seen_at, updated_at)
  VALUES ('guest:' || NEW.gid, 1, NEW.user_id, NEW.bound_at, NEW.bound_at, NEW.bound_at, NEW.bound_at)
  ON CONFLICT(user_id) DO UPDATE SET is_bound = 1, bound_user_id = excluded.bound_user_id,
    bound_at = excluded.bound_at,
    first_seen_at = CASE WHEN guest_directory.first_seen_at = 0 OR excluded.first_seen_at < guest_directory.first_seen_at THEN excluded.first_seen_at ELSE guest_directory.first_seen_at END,
    last_seen_at = MAX(guest_directory.last_seen_at, excluded.last_seen_at), updated_at = excluded.updated_at;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_binding_update
AFTER UPDATE OF user_id, bound_at ON guest_bindings
BEGIN
  UPDATE guest_directory SET is_bound = 1, bound_user_id = NEW.user_id, bound_at = NEW.bound_at,
    last_seen_at = MAX(last_seen_at, NEW.bound_at), updated_at = NEW.bound_at
  WHERE user_id = 'guest:' || NEW.gid;
END;

CREATE TRIGGER IF NOT EXISTS trg_guest_binding_delete
AFTER DELETE ON guest_bindings
BEGIN
  UPDATE guest_directory SET is_bound = 0, bound_user_id = '', bound_at = 0,
    updated_at = CAST(unixepoch('subsec') * 1000 AS INTEGER)
  WHERE user_id = 'guest:' || OLD.gid;
END;
