import { CONTENT_TYPE_LABELS, resolveContentEntry } from './contentRegistry'
import { RESEARCH_ENTRY_META } from './research/catalog'

export function resolveContentKey(category, slug) {
  const content = resolveContentEntry(category, slug)
  if (content) return { title: content.title, href: content.href, type: content.typeLabel }
  const meta = RESEARCH_ENTRY_META[`${category}/${slug}`]
  return {
    title: meta?.title || `${category}/${slug}`,
    href: `/articles/research/${category}/${slug}`,
    type: CONTENT_TYPE_LABELS[category] || '调研',
  }
}

export function resolveArticleKey(articleKey) {
  const key = String(articleKey || '')
  if (key.startsWith('research:')) {
    const [, category, slug] = key.split(':')
    if (category && slug) {
      const entry = resolveContentKey(category, slug)
      return { title: entry.title, href: entry.href }
    }
  }
  if (key.startsWith('article:')) {
    const slug = key.slice('article:'.length)
    return { title: slug || key, href: slug ? `/articles/${slug}` : null }
  }
  // 资源主题页 / 灵感流的评论 key（ContentEngagement 挂载，与燃币 resourceKey 同约定）
  if (key.startsWith('resource:') || key.startsWith('feed:')) {
    const [category, slug] = key.split(':')
    const entry = resolveContentEntry(category, slug)
    if (entry) return { title: entry.title, href: entry.href }
  }
  return { title: key, href: null }
}
