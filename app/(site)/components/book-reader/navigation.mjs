export function pickBookSection(entries, line = 136) {
  const visible = entries.filter(({ top }) => Number.isFinite(top)).sort((a, b) => a.top - b.top)
  if (!visible.length) return ''
  let active = visible[0].id
  for (const entry of visible) {
    if (entry.top > line) break
    active = entry.id
  }
  return active
}
