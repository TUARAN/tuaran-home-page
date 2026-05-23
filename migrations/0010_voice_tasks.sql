CREATE TABLE IF NOT EXISTS voice_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  due_at INTEGER,
  source TEXT NOT NULL DEFAULT 'voice',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  voided_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_voice_tasks_status_created_at ON voice_tasks (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_user_status_created_at ON voice_tasks (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_due_at ON voice_tasks (due_at);
