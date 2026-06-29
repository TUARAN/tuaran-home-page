-- 站长 RSS 订阅墙（blogroll）
-- 背景：/resources/rss 公开展示站长关注的 RSS 源（站名 / 简介 / 主页 / feed 链接），
--       只列出与一键复制，不在本站抓取对方文章（无版权 / 抓取风险）。
-- 维护：站长登录后在 /admin/rss-feeds 增 / 删 / 改；公开页只读 published = 1。
-- 排序：sort_order DESC, created_at DESC（数字大的靠前）。
CREATE TABLE IF NOT EXISTS rss_feeds (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  site_url TEXT,
  rss_url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_pub
  ON rss_feeds(published, sort_order DESC, created_at DESC);

-- 首条种子：阮一峰的网络日志（与 lib/rssFeedsSeed.js 保持一致）
INSERT OR IGNORE INTO rss_feeds
  (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
VALUES (
  'ruanyifeng',
  '阮一峰的网络日志',
  'https://www.ruanyifeng.com/blog/',
  'https://www.ruanyifeng.com/blog/atom.xml',
  '阮一峰的个人博客与《科技爱好者周刊》，中文技术圈最经典的 RSS 订阅之一，长期稳定更新。',
  '技术 / 周刊',
  1,
  100,
  1782000000000
);
