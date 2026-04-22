-- 待办按日勾选：主键 (user_id, item_id, check_date)
PRAGMA foreign_keys=OFF;
CREATE TABLE dad_todo_migrated (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  check_date TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id, check_date)
);
INSERT INTO dad_todo_migrated (user_id, item_id, check_date, updated_at)
SELECT user_id, item_id, date('now'), updated_at FROM dad_todo_completions;
DROP TABLE dad_todo_completions;
ALTER TABLE dad_todo_migrated RENAME TO dad_todo_completions;
CREATE INDEX IF NOT EXISTS idx_dad_todo_user_date ON dad_todo_completions (user_id, check_date);
PRAGMA foreign_keys=ON;
