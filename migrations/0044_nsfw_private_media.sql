-- NSFW 私有媒体库：对象二进制存放在独立的、未公开暴露的 R2 桶 NSFW_MEDIA。
-- D1 仅保存管理所需的元数据；所有读取都经 owner-only API 代理。
CREATE TABLE IF NOT EXISTS nsfw_media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nsfw_media_status_created
  ON nsfw_media (status, created_at DESC);
