-- 已发帖的赞/踩。同一账号同一条素材只留最新一次判断，不改默认提示。
CREATE TABLE IF NOT EXISTS x_extension_prompt_votes (
  id TEXT PRIMARY KEY,
  account_handle TEXT NOT NULL,
  source_id TEXT NOT NULL,
  prompt_key TEXT NOT NULL CHECK (prompt_key IN ('postNormalPrompt', 'postPremiumPrompt', 'postXPrompt')),
  kind TEXT NOT NULL CHECK (kind IN ('good', 'bad')),
  content TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  source_label TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (account_handle, source_id)
);

CREATE INDEX IF NOT EXISTS idx_x_extension_prompt_votes_recent
  ON x_extension_prompt_votes(updated_at DESC);
