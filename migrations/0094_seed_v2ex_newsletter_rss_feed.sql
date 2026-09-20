-- 为「我的 RSS 订阅」补充 $V2EX Newsletter 日报。
-- INSERT OR IGNORE 避免覆盖站长已经在管理台修改过的同名条目。
INSERT OR IGNORE INTO rss_feeds
  (id, site_name, site_url, rss_url, description, category, published, sort_order, created_at)
VALUES (
  'v2ex-newsletter',
  '$V2EX Newsletter',
  'https://info.v2ex.pro/',
  'https://info.v2ex.pro/rss.xml',
  '第三方 $V2EX 日报：持币人数、10k+ 持仓、AMM 池、价格与社区规模，适合持续核对链上和运营数字。',
  '加密 / 日报',
  1,
  50,
  1789871400000
);
