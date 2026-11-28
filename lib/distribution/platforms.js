// 分发平台注册表：分发智能体页、任务台和插件监控共用这一份平台列表。
// home 是平台的发文入口；登记了入口但还没有手册的平台，在分发智能体页显示为「待实测」。
// 智能体能执行哪些平台，以 ./playbooks.js 里有手册的平台为准。

export const DISTRIBUTION_PLATFORMS = [
  { id: 'twitter', label: 'X Articles', shortLabel: 'X', home: 'https://x.com/compose/articles' },
  { id: 'juejin', label: '掘金文章', shortLabel: '掘金', home: 'https://juejin.cn/editor/drafts/new?v=2' },
  { id: 'xiaohongshu', label: '小红书文章', shortLabel: '小红书', home: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article' },
  { id: 'csdn', label: 'CSDN 文章', shortLabel: 'CSDN', home: 'https://editor.csdn.net/md/' },
  { id: 'zhihu', label: '知乎文章', shortLabel: '知乎', home: 'https://zhuanlan.zhihu.com/write' },
  { id: 'toutiao', label: '今日头条文章', shortLabel: '头条', home: 'https://mp.toutiao.com/profile_v4/graphic/publish' },
  { id: '51cto', label: '51CTO 博客', shortLabel: '51CTO', home: 'https://blog.51cto.com/blogger/publish' },
  { id: 'weibo', label: '微博头条文章', shortLabel: '微博', home: 'https://card.weibo.com/article/v5/editor' },
  { id: 'wechat', label: '微信公众号', shortLabel: '公众号' },
  { id: 'segmentfault', label: '思否文章', shortLabel: '思否' },
  { id: 'cnblogs', label: '博客园文章', shortLabel: '博客园' },
  { id: 'tencentcloud', label: '腾讯云开发者社区', shortLabel: '腾讯云' },
  { id: 'aliyun', label: '阿里云开发者社区', shortLabel: '阿里云' },
  { id: 'huaweicloud', label: '华为云开发者社区', shortLabel: '华为云' },
]

const PLATFORM_BY_ID = new Map(DISTRIBUTION_PLATFORMS.map((platform) => [platform.id, platform]))

export function getDistributionPlatform(id) {
  return PLATFORM_BY_ID.get(String(id || '').trim().toLowerCase()) || null
}

export function distributionPlatformShortLabel(id) {
  return getDistributionPlatform(id)?.shortLabel || ''
}
