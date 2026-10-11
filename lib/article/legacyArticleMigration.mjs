export function legacyArticleToMarkdown(article) {
  if (typeof article?.markdown === 'string' && article.markdown.trim()) return article.markdown

  return (article?.content || [])
    .map((block) => {
      if (!block) return ''
      if (typeof block === 'string') return block
      if (block.date) {
        return `## ${[block.date, block.label, block.category].filter(Boolean).join('｜')}`
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
    const heading = /^##\s+(\d{4}-\d{2}-\d{2})(?:｜([^\n｜]*))?(?:｜([^\n｜]*))?$/.exec(block)
    if (!heading) return block
    return {
      date: heading[1],
      label: heading[2]?.trim() || heading[1],
      category: heading[3]?.trim() || '日记',
    }
  })
}
