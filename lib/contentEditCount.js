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

export function resolveContentVersion({ version, revision, editCount } = {}) {
  const recordedVersion = String(version || '').trim()
  if (recordedVersion) return recordedVersion

  const revisionValue = Number(revision)
  const fromRevision = Number.isSafeInteger(revisionValue) && revisionValue > 0 ? revisionValue : 1
  return `v${Math.max(fromRevision, resolveEditCount({ revision, editCount }) + 1)}`
}
