/**
 * 公开 RSS 订阅墙（blogroll）的内置种子。
 *
 * 即使 D1 未就绪（迁移 0031 未跑 / 未绑定），/resources/rss 也用它兜底渲染，
 * 保证页面不空、首条始终是「阮一峰的网络日志」。
 * 数据库迁移里写了同一组种子，二者保持一致。
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
    id: 'tuaran-home',
    siteName: '涂阿燃的网络日志',
    siteUrl: 'https://2aran.com/',
    rssUrl: 'https://2aran.com/rss.xml',
    description:
      '2aran.com 的本站 RSS：前端、AI Agent、技术分析、资源整理与独立开发笔记。',
    category: '个人站 / 技术',
    sortOrder: 90,
    createdAt: 1782000001000,
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
]
