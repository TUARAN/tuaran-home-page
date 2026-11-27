-- 分发智能体任务台账（#661）。token 只存 SHA-256 哈希，任务结束或取消后清空。
CREATE TABLE IF NOT EXISTS distribution_jobs (
  id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  markdown TEXT NOT NULL,
  platforms_json TEXT NOT NULL DEFAULT '[]',
  harness_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token_hash TEXT NOT NULL DEFAULT '',
  token_expires_at INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  claimed_at INTEGER,
  finished_at INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_distribution_jobs_created ON distribution_jobs(created_at DESC);
CREATE TABLE IF NOT EXISTS distribution_job_results (
  job_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  status TEXT NOT NULL,
  article_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  playbook_deviation TEXT NOT NULL DEFAULT '',
  reported_at INTEGER NOT NULL,
  PRIMARY KEY (job_id, platform_id)
);
