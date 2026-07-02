-- 统一内容索引（内容 metadata 出仓库进 D1 的第一步）
-- 背景：专栏/调研/资源的 metadata 此前全部是构建期产物（articlesData / research catalog /
--       contentRegistry），新增或修改一条内容 metadata 必须重新构建部署。
--       本表把统一内容管线（lib/contentPipeline.js 的 entry 形状）落到 D1：
--       - source='sync'：站长后台一键从构建期注册表同步（构建产物的 D1 镜像）
--       - source='manual'：站长后台手工登记，无需构建即出现在 /articles 索引（发布不依赖构建）
-- 维护：/admin/content-index；公开读 /api/content 只返回 status='published'。
-- content_key 与评论 articleKey、燃币 gated_resources.resource_key 同一套约定
-- （'research:{cat}:{slug}' / 'article:{slug}' / 'resource:{slug}' / 'feed:{slug}'）。
CREATE TABLE IF NOT EXISTS content_index (
  content_key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,           -- 'research' | 'article' | 'resource' | 'feed'
  category TEXT NOT NULL,               -- companies/topics/people/posts/resource/feed
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  tags_json TEXT,                       -- JSON array
  href TEXT NOT NULL,
  date TEXT,                            -- 'YYYY-MM-DD'
  status TEXT NOT NULL DEFAULT 'published',  -- 'published' | 'draft' | 'retired'
  source TEXT NOT NULL DEFAULT 'sync',       -- 'sync' | 'manual'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_index_list
  ON content_index(status, content_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_content_index_source
  ON content_index(source, status);
