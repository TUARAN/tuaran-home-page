-- 草稿状态补充 'generating'（生成中）。
-- 0060 的 CHECK 少了该状态导致起草插入失败；表为空，直接重建。
DROP TABLE IF EXISTS a_share_drafts;

CREATE TABLE a_share_drafts (
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
    CHECK (status IN ('generating', 'pending', 'reviewed', 'rejected')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_a_share_drafts_date
  ON a_share_drafts (draft_date DESC);

CREATE INDEX IF NOT EXISTS idx_a_share_drafts_code
  ON a_share_drafts (code, draft_date DESC);
