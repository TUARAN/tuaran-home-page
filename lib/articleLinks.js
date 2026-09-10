import { CONTENT_TYPE_LABELS, resolveContentEntry } from './contentRegistry'

export function resolveContentKey(category, slug, metadata = new Map()) {
  const key = ['companies', 'topics', 'people'].includes(category) ? `research:${category}:${slug}` : `${category}:${slug}`
  const indexed = metadata.get(key)
  if (indexed) return { ...indexed, type: CONTENT_TYPE_LABELS[category] || '调研' }
  const content = resolveContentEntry(category, slug)
  if (content) return { title: content.title, href: content.href, type: content.typeLabel }
  return {
    title: `${category}/${slug}`,
    href: `/articles/research/${category}/${slug}`,
    type: CONTENT_TYPE_LABELS[category] || '调研',
  }
}

export function resolveArticleKey(articleKey, metadata = new Map()) {
  const key = String(articleKey || '')
  if (metadata.has(key)) return metadata.get(key)
  if (key.startsWith('research:')) {
    const [, category, slug] = key.split(':')
    if (category && slug) {
      const entry = resolveContentKey(category, slug, metadata)
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
