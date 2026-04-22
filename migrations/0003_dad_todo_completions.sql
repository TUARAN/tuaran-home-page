CREATE TABLE IF NOT EXISTS dad_todo_completions (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_dad_todo_user_id ON dad_todo_completions (user_id);
