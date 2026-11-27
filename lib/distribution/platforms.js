// 分发平台注册表：后台文章分发、插件监控和分发智能体共用这一份平台列表。
// articleDistribution: true 的平台出现在后台文章分发页（插件路径）。
// 只在插件监控里出现的平台不登记入口地址，补手册时再按实测填写。
// 智能体能执行哪些平台，以 ./playbooks.js 里有手册的平台为准。

export const DISTRIBUTION_PLATFORMS = [
  { id: 'twitter', label: 'X Articles', shortLabel: 'X', home: 'https://x.com/compose/articles', articleDistribution: true },
  { id: 'juejin', label: '掘金文章', shortLabel: '掘金', home: 'https://juejin.cn/editor/drafts/new?v=2', articleDistribution: true },
  { id: 'xiaohongshu', label: '小红书文章', shortLabel: '小红书', home: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article', articleDistribution: true },
  { id: 'csdn', label: 'CSDN 文章', shortLabel: 'CSDN', home: 'https://editor.csdn.net/md/', articleDistribution: true },
  { id: 'zhihu', label: '知乎文章', shortLabel: '知乎', home: 'https://zhuanlan.zhihu.com/write', articleDistribution: true },
  { id: 'toutiao', label: '今日头条文章', shortLabel: '头条', home: 'https://mp.toutiao.com/profile_v4/graphic/publish', articleDistribution: true },
  { id: 'weibo', label: '微博', shortLabel: '微博' },
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
