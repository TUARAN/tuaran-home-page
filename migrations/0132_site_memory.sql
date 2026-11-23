-- 站点记忆：Claude Code 项目记忆与仓库 docs/context 的明文版本快照。
-- 只通过后台 owner 鉴权的 /api/admin/site-memory 读取，不进公开静态目录。
CREATE TABLE IF NOT EXISTS site_memory_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  hash TEXT NOT NULL,
  content TEXT NOT NULL,
  bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_memory_unique ON site_memory_versions(source_id, slug, created_at);
CREATE INDEX IF NOT EXISTS idx_site_memory_file ON site_memory_versions(source_id, slug, id);
