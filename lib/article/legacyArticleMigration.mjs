export function legacyArticleToMarkdown(article) {
  if (typeof article?.markdown === 'string' && article.markdown.trim()) return article.markdown

  return (article?.content || [])
    .map((block) => {
      if (!block) return ''
      if (typeof block === 'string') return block
      if (block.date) {
        const stamp = block.dateStart && block.dateStart !== block.date
          ? `${block.dateStart}～${block.date}`
          : block.date
        return `## ${[stamp, block.label, block.category].filter(Boolean).join('｜')}`
      }
      if (block.heading) return `## ${block.heading}`
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export function diaryContentFromMarkdown(markdown) {
  const blocks = String(markdown || '').split(/\r?\n\s*\r?\n/).map((block) => block.trim()).filter(Boolean)
  return blocks.map((block) => {
    const heading = /^##\s+(\d{4}-\d{2}-\d{2})(?:～(\d{4}-\d{2}-\d{2}))?(?:｜([^\n｜]*))?(?:｜([^\n｜]*))?$/.exec(block)
    if (!heading) return block
    const date = heading[2] || heading[1]
    const entry = { date }
    if (heading[2]) entry.dateStart = heading[1]
    entry.label = heading[3]?.trim() || date
    entry.category = heading[4]?.trim() || '日记'
    return entry
  })
}
