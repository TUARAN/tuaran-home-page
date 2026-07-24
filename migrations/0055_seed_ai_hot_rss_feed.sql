-- 为「我的 RSS 订阅」补充 AI HOT 中文 AI 行业动态。
-- INSERT OR IGNORE 避免覆盖站长已经在管理台修改过的同名条目。
INSERT OR IGNORE INTO rss_feeds
  (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
VALUES (
  'ai-hot',
  'AI HOT',
  'https://aihot.virxact.com/',
  'https://aihot.virxact.com/feed.xml',
  '聚合 AI 行业动态、热点与日报的中文信息流，适合持续跟踪模型、产品、行业、论文和实用技巧。',
  'AI / 行业动态',
  1,
  60,
  1784880000000
);
