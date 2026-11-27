import { DISTRIBUTION_PLATFORMS } from '../distribution/platforms.js'

export const ARTICLE_DISTRIBUTION_PLATFORMS = DISTRIBUTION_PLATFORMS
  .filter((platform) => platform.articleDistribution)
  .map(({ id, label, shortLabel, home }) => ({ id, label, shortLabel, home }))

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
