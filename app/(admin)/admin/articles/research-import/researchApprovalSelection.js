export function splitResearchQueueTabs(pending = []) {
  const drafts = []
  const approval = []
  for (const item of pending) {
    if (item?.reason === 'draft') drafts.push(item)
    else approval.push(item)
  }
  return { drafts, approval }
}

export function researchQueueBucket(pending = [], sourcePath) {
  const item = pending.find((entry) => entry?.sourcePath === sourcePath)
  if (!item) return 'published'
  return item.reason === 'draft' ? 'draft' : 'pending'
}

export function initialReviewSourcePath(pending = [], requestedPath = '') {
  if (requestedPath) return requestedPath
  return pending.find((item) => item?.reason !== 'draft')?.sourcePath || pending[0]?.sourcePath || ''
}

export function applyQueueStatus(pending = [], { sourcePath, status, revision, fallback } = {}) {
  const reason = status === 'published' ? 'updated' : status
  const next = []
  let found = false
  for (const item of pending) {
    if (item?.sourcePath !== sourcePath) {
      next.push(item)
      continue
    }
    found = true
    if (status !== 'published') next.push({ ...item, reason, d1Status: status, revision })
  }
  if (found || status === 'published' || !fallback?.sourcePath) return next
  const item = { ...fallback, reason: status, d1Status: status, revision }
  const index = next.findIndex((entry) => {
    const byName = String(entry.filename || '').localeCompare(String(item.filename || ''))
    if (byName !== 0) return byName < 0
    return String(entry.slug || '').localeCompare(String(item.slug || '')) > 0
  })
  if (index === -1) next.push(item)
  else next.splice(index, 0, item)
  return next
}

export function toggleSelectedPath(selected, sourcePath) {
  const next = new Set(selected)
  if (next.has(sourcePath)) next.delete(sourcePath)
  else next.add(sourcePath)
  return next
}

export function applyVisibleSelection(selected, visiblePaths, checked) {
  const next = new Set(selected)
  for (const path of visiblePaths) {
    if (checked) next.add(path)
    else next.delete(path)
  }
  return next
}

export function pruneSelectedPaths(selected, pendingPaths) {
  const allowed = new Set(pendingPaths)
  let changed = false
  const next = new Set()
  for (const path of selected) {
    if (allowed.has(path)) next.add(path)
    else changed = true
  }
  return changed ? next : selected
}

export function visibleSelectionState(selected, visiblePaths) {
  const visibleCount = visiblePaths.reduce((count, path) => count + (selected.has(path) ? 1 : 0), 0)
  return {
    all: visiblePaths.length > 0 && visibleCount === visiblePaths.length,
    some: visibleCount > 0 && visibleCount < visiblePaths.length,
    selectedCount: selected.size,
    visibleCount,
  }
}

export function summarizeBatchPublish(results) {
  const published = results.filter((item) => item.ok)
  const failed = results.filter((item) => !item.ok)
  if (!results.length) return { tone: 'info', text: '' }
  if (!failed.length) return { tone: 'success', text: `已发布 ${published.length} 篇。` }
  const failedText = failed.map((item) => item.error ? `${item.label}（${item.error}）` : item.label).join('；')
  if (!published.length) return { tone: 'danger', text: `发布失败 ${failed.length} 篇：${failedText}` }
  return { tone: 'warning', text: `已发布 ${published.length} 篇，失败 ${failed.length} 篇：${failedText}` }
}
