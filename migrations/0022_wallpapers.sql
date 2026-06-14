-- 壁纸资源库（/resources/wallpapers + /admin/wallpapers）
-- 文件本体存 Cloudflare R2（binding MEDIA，前缀 downloads/），D1 只存元数据。
-- object_key 形如 downloads/<id>.<ext>；公开 URL = R2_PUBLIC_BASE + '/' + object_key。
-- 站长在 /admin/wallpapers 上传/删除；published=0 时不在公开画廊展示。
CREATE TABLE IF NOT EXISTS wallpapers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'misc',
  object_key TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  downloads INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallpapers_category ON wallpapers (category);
CREATE INDEX IF NOT EXISTS idx_wallpapers_published ON wallpapers (published);
