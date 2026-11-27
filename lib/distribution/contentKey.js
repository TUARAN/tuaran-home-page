// 站内内容与分发任务台的 contentKey 约定（文章、调研等）。

export function resolveDistributionContentKey(category, slug) {
  const normalizedCategory = String(category || '').trim()
  const normalizedSlug = String(slug || '').trim()
  if (!normalizedSlug) return ''
  if (normalizedCategory === 'article') return `article:${normalizedSlug}`
  if (['companies', 'topics', 'people'].includes(normalizedCategory)) {
    return `research:${normalizedCategory}:${normalizedSlug}`
  }
  return ''
}

export function adminArticleDistributionHref(contentKey) {
  if (!contentKey) return '/admin/article-distribution'
  return `/admin/article-distribution?contentKey=${encodeURIComponent(contentKey)}`
}