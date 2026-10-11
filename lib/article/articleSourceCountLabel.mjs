export function articleSourceCountLabel(localCount, juejinCount) {
  const sources = []
  if (localCount > 0) sources.push(`站内 ${localCount}`)
  if (juejinCount > 0) sources.push(`掘金 ${juejinCount}`)
  return sources.join(' + ') || '暂无内容'
}
