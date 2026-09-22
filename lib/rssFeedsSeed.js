/**
 * 公开 RSS 订阅墙（blogroll）的内置种子。
 *
 * 即使 D1 未就绪（迁移 0031 未跑 / 未绑定），/resources/rss 也用它兜底渲染，
 * 保证页面不空、首条始终是「阮一峰的网络日志」。
 * 本站 RSS 不进这里：订阅本站走独立入口（/rss.xml 与加密调研页订阅卡）。
 * 历史迁移里若仍有 tuaran-home 种子，由 0096 删除，公开列表也会过滤本站源。
 */
export const RSS_FEEDS_SEED = [
  {
    id: 'ruanyifeng',
    siteName: '阮一峰的网络日志',
    siteUrl: 'https://www.ruanyifeng.com/blog/',
    rssUrl: 'https://www.ruanyifeng.com/blog/atom.xml',
    description:
      '阮一峰的个人博客与《科技爱好者周刊》，中文技术圈最经典的 RSS 订阅之一，长期稳定更新。',
    category: '技术 / 周刊',
    sortOrder: 100,
    createdAt: 1782000000000,
  },
  {
    id: 'simon-willison',
    siteName: "Simon Willison's Weblog",
    siteUrl: 'https://simonwillison.net/',
    rssUrl: 'https://simonwillison.net/atom/entries/',
    description:
      'Django 联合创始人 Simon Willison 的英文技术博客，持续记录 LLM、AI 工具、Python、SQLite 与数据工程实践。',
    category: 'AI / 开发工具',
    sortOrder: 80,
    createdAt: 1784012400000,
  },
  {
    id: 'julia-evans',
    siteName: 'Julia Evans',
    siteUrl: 'https://jvns.ca/',
    rssUrl: 'https://jvns.ca/atom.xml',
    description:
      '用清晰图解和短文讲透 Linux、网络、Git、终端与调试原理，英文技术基础内容尤其值得长期订阅。',
    category: '系统 / 编程基础',
    sortOrder: 70,
    createdAt: 1784012401000,
  },
  {
    id: 'ai-hot',
    siteName: 'AI HOT',
    siteUrl: 'https://aihot.virxact.com/',
    rssUrl: 'https://aihot.virxact.com/feed.xml',
    description:
      '聚合 AI 行业动态、热点与日报的中文信息流，适合持续跟踪模型、产品、行业、论文和实用技巧。',
    category: 'AI / 行业动态',
    sortOrder: 60,
    createdAt: 1784880000000,
  },
  {
    id: 'v2ex-newsletter',
    siteName: '$V2EX Newsletter',
    siteUrl: 'https://info.v2ex.pro/',
    rssUrl: 'https://info.v2ex.pro/rss.xml',
    description:
      '第三方 $V2EX 日报：持币人数、10k+ 持仓、AMM 池、价格与社区规模，适合持续核对链上和运营数字。',
    category: '加密 / 日报',
    sortOrder: 50,
    createdAt: 1789871400000,
  },
]
