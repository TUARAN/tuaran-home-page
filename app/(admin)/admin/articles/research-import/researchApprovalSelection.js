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
