-- 生成失败需要成为可见、可重试的草稿状态，并保留最近一次错误。
CREATE TABLE a_share_drafts_new (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  draft_date TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  template_version TEXT NOT NULL DEFAULT '',
  style_id TEXT NOT NULL DEFAULT '',
  deepseek_task_id TEXT NOT NULL DEFAULT '',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('generating', 'failed', 'pending', 'reviewed', 'rejected', 'published')),
  generation_error TEXT NOT NULL DEFAULT '',
  publish_commit TEXT NOT NULL DEFAULT '',
  publish_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT INTO a_share_drafts_new
  (id, code, name, title, draft_date, content, template_version, style_id,
   deepseek_task_id, attempt_count, status, generation_error, publish_commit,
   publish_at, created_at, updated_at)
SELECT
  id, code, name, title, draft_date, content, template_version, style_id,
  deepseek_task_id, attempt_count, status, '', publish_commit,
  publish_at, created_at, updated_at
FROM a_share_drafts;

DROP TABLE a_share_drafts;

ALTER TABLE a_share_drafts_new RENAME TO a_share_drafts;

CREATE INDEX IF NOT EXISTS idx_a_share_drafts_date
  ON a_share_drafts (draft_date DESC);

CREATE INDEX IF NOT EXISTS idx_a_share_drafts_code
  ON a_share_drafts (code, draft_date DESC);
