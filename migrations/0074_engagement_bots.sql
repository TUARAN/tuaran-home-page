-- 路过互动：可管理人设（前台显示为「路过」），随机点赞 / DeepSeek 评论，并保留运行记录。
CREATE TABLE IF NOT EXISTS engagement_bots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  voice_prompt TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS engagement_bot_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  triggered_by TEXT NOT NULL,
  status TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  detail TEXT NOT NULL DEFAULT '',
  started_at INTEGER NOT NULL,
  finished_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS engagement_bot_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER,
  bot_id INTEGER,
  bot_slug TEXT NOT NULL DEFAULT '',
  bot_name TEXT NOT NULL DEFAULT '',
  action_type TEXT NOT NULL,
  article_key TEXT NOT NULL DEFAULT '',
  article_title TEXT NOT NULL DEFAULT '',
  comment_id INTEGER,
  message TEXT NOT NULL DEFAULT '',
  deepseek_task_id INTEGER,
  status TEXT NOT NULL,
  error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (run_id) REFERENCES engagement_bot_runs(id) ON DELETE SET NULL,
  FOREIGN KEY (bot_id) REFERENCES engagement_bots(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_engagement_bot_actions_created
  ON engagement_bot_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_bot_actions_bot_article
  ON engagement_bot_actions(bot_id, article_key, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_bot_runs_started
  ON engagement_bot_runs(started_at DESC);
