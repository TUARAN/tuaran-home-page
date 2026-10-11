/**
 * 列表、推荐、目录和 RSS 共用的公开摘要：有 tldr 用 tldr，否则用 summary。
 * 同一篇文章不能在首页用长摘要、在目录用短摘要。
 */
export function researchPublicSummary(entry) {
  return String(entry?.tldr || entry?.summary || '').trim()
}
