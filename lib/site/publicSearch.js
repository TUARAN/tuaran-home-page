import { flattenChannelRoutes } from './siteNav'

const HOME = { href: '/', title: '首页', titleEn: 'Home', summary: '涂阿燃的网络日志', summaryEn: 'TUARAN weblog', kind: 'page' }

export function publicSearchPages() {
  const seen = new Set(['/'])
  return [HOME, ...flattenChannelRoutes().filter((item) => {
    const href = item.href?.split('?')[0]
    if (!href?.startsWith('/') || href.startsWith('/admin') || seen.has(href)) return false
    seen.add(href)
    return true
  }).map((item) => ({
    href: item.href,
    title: item.label,
    titleEn: item.labelEn || item.label,
    summary: item.desc || '',
    summaryEn: item.descEn || item.desc || '',
    kind: 'page',
  }))]
}

function score(entry, query) {
  const title = `${entry.title || ''} ${entry.titleEn || ''}`.toLocaleLowerCase()
  const summary = `${entry.summary || ''} ${entry.summaryEn || ''}`.toLocaleLowerCase()
  const tags = Array.isArray(entry.tags) ? entry.tags.join(' ').toLocaleLowerCase() : ''
  if (title === query) return 100
  if (title.startsWith(query)) return 75
  if (title.includes(query)) return 50
  if (tags.includes(query)) return 30
  if (summary.includes(query)) return 15
  return 0
}

export function searchPublicEntries(query, contentItems = [], limit = 100) {
  const term = String(query || '').trim().slice(0, 100).toLocaleLowerCase()
  if (!term) return []
  const content = contentItems.filter((item) => item?.href?.startsWith('/')).map((item) => ({
    href: item.href,
    title: item.title,
    summary: item.summary || '',
    tags: item.tags || [],
    kind: 'content',
  }))
  const contentPaths = new Set(content.map((item) => item.href.split('?')[0]))
  return [...publicSearchPages().filter((item) => !contentPaths.has(item.href.split('?')[0])), ...content]
    .map((item) => ({ ...item, score: score(item, term) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-CN'))
    .slice(0, limit)
    .map(({ score: _score, ...item }) => item)
}
