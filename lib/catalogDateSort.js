export function compareCatalogDateDesc(a, b) {
  return String(b.date || '').localeCompare(String(a.date || ''))
    || (b.priority || 0) - (a.priority || 0)
    || String(a.title || '').localeCompare(String(b.title || ''), 'zh-CN')
}

export function sortCatalogItemsByDate(items) {
  return [...items].sort(compareCatalogDateDesc)
}
