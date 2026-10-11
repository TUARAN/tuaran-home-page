// Backwards compatible content_json envelope; existing Tiptap documents remain unchanged.
export const MAX_MARKDOWN_BYTES = 256 * 1024

export function isMarkdownDocument(content) {
  return content?.type === 'markdown' && typeof content.markdown === 'string'
}

export function normalizeArticleDocument(content, fallbackText = '') {
  if (content?.type === 'markdown') {
    if (typeof content.markdown !== 'string') return { error: 'INVALID_MARKDOWN' }
    if (new TextEncoder().encode(content.markdown).length > MAX_MARKDOWN_BYTES) return { error: 'MARKDOWN_TOO_LARGE' }
    return { content: { type: 'markdown', markdown: content.markdown }, contentText: content.markdown.trim() }
  }
  if (content?.type !== 'doc' || !Array.isArray(content.content)) return { error: 'INVALID_DOCUMENT' }
  return { content, contentText: String(fallbackText || '').trim().slice(0, 200000) }
}

export function markdownFileToDraft(markdown, filename = 'article.md') {
  const text = String(markdown || '').replace(/^\uFEFF/, '')
  // Research frontmatter carries privacy and publishing semantics. Never silently discard it.
  if (/^---\r?\n/.test(text)) throw new Error('含 frontmatter 的调研文件请使用调研发布流程，勿作为普通文章导入。')
  const normalized = normalizeArticleDocument({ type: 'markdown', markdown: text })
  if (normalized.error) throw new Error(normalized.error)
  const heading = text.match(/^#\s+(.+)$/m)
  return {
    title: heading?.[1]?.trim() || filename.replace(/\.md$/i, ''),
    ...normalized,
  }
}
