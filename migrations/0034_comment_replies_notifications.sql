-- 评论回复与站内提醒。
-- 规则：评论可指向被回复的评论；当被回复者是登录用户且不是自己时，
--       写入 comment_notifications，前端显示未读消息。
ALTER TABLE article_comments ADD COLUMN reply_to_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_article_comments_reply_to
  ON article_comments(reply_to_id);

CREATE TABLE IF NOT EXISTS comment_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'comment_reply',
  recipient_user_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_user_provider TEXT NOT NULL,
  actor_user_name TEXT NOT NULL,
  actor_user_image TEXT,
  article_key TEXT NOT NULL,
  comment_id INTEGER NOT NULL,
  reply_to_comment_id INTEGER NOT NULL,
  message_excerpt TEXT NOT NULL,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient_read_created
  ON comment_notifications(recipient_user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_notifications_recipient_created
  ON comment_notifications(recipient_user_id, created_at DESC);
