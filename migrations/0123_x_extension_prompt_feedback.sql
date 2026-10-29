CREATE TABLE IF NOT EXISTS x_extension_prompt_feedback (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('good', 'bad')),
  prompt_key TEXT NOT NULL CHECK (prompt_key IN ('replyTimelinePrompt', 'replyCommentPrompt', 'postNormalPrompt', 'postPremiumPrompt')),
  content TEXT NOT NULL,
  assessment TEXT NOT NULL,
  expected TEXT NOT NULL DEFAULT '',
  context TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'owner',
  reviewed_at INTEGER,
  synced_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_x_extension_prompt_feedback_status_created
  ON x_extension_prompt_feedback(status, created_at DESC);
