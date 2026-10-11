export const ARTICLE_DISTRIBUTION_PLATFORMS = [
  {
    id: 'twitter',
    label: 'X Articles',
    shortLabel: 'X',
    home: 'https://x.com/compose/articles',
  },
  {
    id: 'juejin',
    label: '掘金文章',
    shortLabel: '掘金',
    home: 'https://juejin.cn/editor/drafts/new?v=2',
  },
  {
    id: 'xiaohongshu',
    label: '小红书文章',
    shortLabel: '小红书',
    home: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
  },
  {
    id: 'csdn',
    label: 'CSDN 文章',
    shortLabel: 'CSDN',
    home: 'https://editor.csdn.net/md/',
  },
  {
    id: 'zhihu',
    label: '知乎文章',
    shortLabel: '知乎',
    home: 'https://zhuanlan.zhihu.com/write',
  },
  {
    id: 'toutiao',
    label: '今日头条文章',
    shortLabel: '头条',
    home: 'https://mp.toutiao.com/profile_v4/graphic/publish',
  },
]

const PLATFORM_ID_SET = new Set(ARTICLE_DISTRIBUTION_PLATFORMS.map((platform) => platform.id))

export function normalizeArticleDistributionPlatformIds(ids) {
  const seen = new Set()
  return (Array.isArray(ids) ? ids : [])
    .map((id) => String(id || '').trim().toLowerCase())
    .filter((id) => PLATFORM_ID_SET.has(id) && !seen.has(id) && seen.add(id))
}
export function resolveArticleDistributionAccounts(extensionPlatforms, selectedIds) {
  const selected = new Set(normalizeArticleDistributionPlatformIds(selectedIds))
  const byId = new Map(
    (Array.isArray(extensionPlatforms) ? extensionPlatforms : [])
      .map((account) => [String(account?.uid || account?.type || '').trim().toLowerCase(), account])
      .filter(([id]) => id),
  )

  return ARTICLE_DISTRIBUTION_PLATFORMS
    .filter((platform) => selected.has(platform.id))
    .map((platform) => {
      const account = byId.get(platform.id)
      if (!account) return null
      return {
        ...account,
        uid: account.uid || platform.id,
        type: account.type || platform.id,
        title: account.title || platform.label,
        displayName: account.displayName || account.title || platform.label,
        home: account.home || platform.home,
        checked: true,
      }
    })
    .filter(Boolean)
}
