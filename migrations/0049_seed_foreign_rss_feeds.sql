-- 为「我的 RSS 订阅」补充两个长期更新的国外技术博客。
-- INSERT OR IGNORE 避免覆盖站长已经在管理台修改过的同名条目。
INSERT OR IGNORE INTO rss_feeds
  (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
VALUES (
  'simon-willison',
  'Simon Willison''s Weblog',
  'https://simonwillison.net/',
  'https://simonwillison.net/atom/entries/',
  'Django 联合创始人 Simon Willison 的英文技术博客，持续记录 LLM、AI 工具、Python、SQLite 与数据工程实践。',
  'AI / 开发工具',
  1,
  80,
  1784012400000
);

INSERT OR IGNORE INTO rss_feeds
  (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
VALUES (
  'julia-evans',
  'Julia Evans',
  'https://jvns.ca/',
  'https://jvns.ca/atom.xml',
  '用清晰图解和短文讲透 Linux、网络、Git、终端与调试原理，英文技术基础内容尤其值得长期订阅。',
  '系统 / 编程基础',
  1,
  70,
  1784012401000
);
