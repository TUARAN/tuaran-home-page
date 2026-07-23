-- 将已经发布的在线文章补进统一内容索引。
-- 后续发布、转草稿、改 slug 和删除由 /api/admin/articles/[id] 原子维护。
INSERT INTO content_index (
  content_key,
  content_type,
  category,
  slug,
  title,
  summary,
  tags_json,
  href,
  date,
  status,
  source,
  created_at,
  updated_at
)
SELECT
  'article:' || slug,
  'article',
  'posts',
  slug,
  title,
  CASE
    WHEN TRIM(COALESCE(summary, '')) <> '' THEN summary
    ELSE SUBSTR(COALESCE(content_text, ''), 1, 160)
  END,
  COALESCE(tags_json, '[]'),
  '/articles/' || slug,
  STRFTIME('%Y-%m-%d', COALESCE(published_at, updated_at, created_at) / 1000, 'unixepoch'),
  'published',
  'manual',
  created_at,
  updated_at
FROM article_posts
WHERE status = 'published'
ON CONFLICT(content_key) DO UPDATE SET
  content_type = excluded.content_type,
  category = excluded.category,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  tags_json = excluded.tags_json,
  href = excluded.href,
  date = excluded.date,
  status = excluded.status,
  source = excluded.source,
  updated_at = excluded.updated_at;
