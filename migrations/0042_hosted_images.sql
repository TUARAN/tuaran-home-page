-- 用户图床（/tools/image-hosting）
-- 文件本体存 Cloudflare R2（binding MEDIA，前缀 images/hosted/），D1 只存用户与文件元数据。
-- 每次上传由 point_ledger 写一笔 image_hosting_upload 负流水；删除图片不自动退燃币。
CREATE TABLE IF NOT EXISTS hosted_images (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hosted_images_user_created ON hosted_images (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hosted_images_object_key ON hosted_images (object_key);
