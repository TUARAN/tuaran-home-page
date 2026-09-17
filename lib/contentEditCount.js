export function editCountFromRevision(revision) {
  const value = Number(revision)
  if (!Number.isSafeInteger(value) || value < 2) return 0
  return value - 1
}

export function parseResearchGitEditCounts(output) {
  const counts = {}
  for (const line of String(output || '').split('\n')) {
    const match = /^research\/(companies|topics|people)\/\d{4}-\d{2}-\d{2}-([a-z0-9-]+)\.md$/.exec(line.trim())
    if (!match) continue
    const key = `${match[1]}/${match[2]}`
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

export function resolveEditCount({ revision, editCount } = {}) {
  const fromRevision = editCountFromRevision(revision)
  const recorded = Number(editCount)
  const fromRecord = Number.isSafeInteger(recorded) && recorded > 0 ? recorded : 0
  return Math.max(fromRevision, fromRecord)
}

export function ownerAuthorValue(author, revision, editCount) {
  const name = String(author || 'TUARAN').trim() || 'TUARAN'
  const count = resolveEditCount({ revision, editCount })
  return count ? `${name} · 修改过${count}次` : name
}
