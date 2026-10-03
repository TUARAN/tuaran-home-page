-- AIHOT 已迁移至 aihot.news；只替换仍使用官方旧地址的种子记录，保留站长自定义值。
UPDATE rss_feeds
SET
  site_url = 'https://aihot.news/',
  rss_url = 'https://aihot.news/feed.xml'
WHERE id = 'ai-hot'
  AND rss_url = 'https://aihot.virxact.com/feed.xml';
