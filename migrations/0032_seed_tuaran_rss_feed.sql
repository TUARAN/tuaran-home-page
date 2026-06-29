-- 给已跑过 0031 的线上 D1 补充本站 RSS；新建数据库也可安全重复执行。
-- 排序放在阮一峰（100）后面。
INSERT OR IGNORE INTO rss_feeds
  (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
VALUES (
  'tuaran-home',
  '涂阿燃的网络日志',
  'https://2aran.com/',
  'https://2aran.com/rss.xml',
  '2aran.com 的本站 RSS：前端、AI Agent、技术调研、资源整理与独立开发笔记。',
  '个人站 / 技术',
  1,
  90,
  1782000001000
);
