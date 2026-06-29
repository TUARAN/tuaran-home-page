/**
 * 公开 RSS 订阅墙（blogroll）的内置种子。
 *
 * 即使 D1 未就绪（迁移 0031 未跑 / 未绑定），/resources/rss 也用它兜底渲染，
 * 保证页面不空、首条始终是「阮一峰的网络日志」。
 * migrations/0031_rss_feeds.sql 里写了同一条种子，二者保持一致。
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
  },
]
