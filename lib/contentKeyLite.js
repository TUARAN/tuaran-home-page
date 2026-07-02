function humanizeSlug(slug) {
  return String(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function fallbackHrefForContentKey(contentKey) {
  const key = String(contentKey || '')
  if (key.startsWith('research:')) {
    const [, category, slug] = key.split(':')
    return category && slug ? `/articles/research/${category}/${slug}` : null
  }
  if (key.startsWith('article:')) {
    const slug = key.slice('article:'.length)
    return slug ? `/articles/${slug}` : null
  }
  if (key.startsWith('resource:')) {
    const slug = key.slice('resource:'.length)
    return slug ? `/${slug}` : null
  }
  if (key.startsWith('feed:')) {
    const slug = key.slice('feed:'.length)
    if (!slug || slug === 'index') return '/feed'
    return `/feed/${slug}`
  }
  return null
}

export function fallbackTitleForContentKey(contentKey) {
  const key = String(contentKey || '')
  const slug = key.includes(':') ? key.split(':').pop() : key
  return humanizeSlug(slug) || key || '未知内容'
}

export function resolveContentKeyLite(contentKey, metaMap) {
  const key = String(contentKey || '')
  const meta = metaMap?.get(key)
  return {
    title: meta?.title || fallbackTitleForContentKey(key),
    href: meta?.href || fallbackHrefForContentKey(key),
  }
}

export async function loadContentKeyMeta(db, contentKeys) {
  const keys = [...new Set((contentKeys || []).map((key) => String(key || '').trim()).filter(Boolean))]
    .slice(0, 100)
  if (!db || keys.length === 0) return new Map()

  try {
    const placeholders = keys.map((_, index) => `?${index + 1}`).join(', ')
    const result = await db
      .prepare(
        `SELECT content_key, title, href
         FROM content_index
         WHERE content_key IN (${placeholders})`
      )
      .bind(...keys)
      .all()

    return new Map(
      (result?.results || []).map((row) => [
        String(row.content_key || ''),
        { title: row.title || '', href: row.href || '' },
      ])
    )
  } catch {
    return new Map()
  }
}
