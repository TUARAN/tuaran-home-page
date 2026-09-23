export const AUTOMATION_LAST_RUN_PREFIX = 'automation:last-run:'

export function lastRunSettingKey(workflow) {
  const id = String(workflow || '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${AUTOMATION_LAST_RUN_PREFIX}${id || 'unknown'}`
}

export function workflowIdFromEntry(entry) {
  const match = String(entry || '').match(/\/workflows\/([^/?#]+)\.ya?ml/i)
  return match?.[1] || ''
}

export function workflowIdFromAlertKey(articleKey) {
  const parts = String(articleKey || '').split(':')
  return parts[0] === 'system' && parts[1] === 'automation' ? String(parts[2] || '') : ''
}

export function isSuccessfulAutomationStatus(status, excerpt = '') {
  const value = String(status || '').toLowerCase()
  if (value === 'ok' || value === 'success') return true
  return /运行成功|运行恢复/.test(String(excerpt || ''))
}

export function formatAutomationLastRun(payload, now = Date.now()) {
  if (!payload) return null
  const at = Number(payload.at || payload.created_at || 0)
  const label = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at || now)
  const ok = payload.ok === true || isSuccessfulAutomationStatus(payload.status, payload.error || payload.message_excerpt)
  if (ok) return `${label} 成功`
  const error = String(payload.error || payload.message_excerpt || '')
    .replace(/\s+/g, ' ')
    .replace(/^.*?运行失败\s*/, '')
    .trim()
    .slice(0, 24)
  return error ? `${label} 失败（${error}）` : `${label} 失败`
}

export function pickLatestAlertByWorkflow(rows) {
  const latest = {}
  for (const row of rows || []) {
    const workflow = workflowIdFromAlertKey(row?.article_key)
    if (!workflow || latest[workflow]) continue
    latest[workflow] = row
  }
  return latest
}

export function resolveRegistryLastRun(item, { lastRuns = {}, alertsByWorkflow = {} } = {}) {
  const workflow = workflowIdFromEntry(item?.entry)
  if (!workflow) return item?.lastRun || null
  if (lastRuns[workflow]) return formatAutomationLastRun(lastRuns[workflow])
  if (alertsByWorkflow[workflow]) {
    return formatAutomationLastRun({
      at: alertsByWorkflow[workflow].created_at,
      ok: isSuccessfulAutomationStatus('', alertsByWorkflow[workflow].message_excerpt),
      error: alertsByWorkflow[workflow].message_excerpt,
    })
  }
  return item?.lastRun || null
}

export function safeAutomationRunUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    return url.href
  } catch {
    return ''
  }
}

export function extractAutomationRunUrl(text) {
  const match = String(text || '').match(/https?:\/\/[^\s<>"']+/)
  if (!match) return ''
  return safeAutomationRunUrl(match[0].replace(/[),.;，。]+$/g, ''))
}

function cleanIncidentError(text, runUrl) {
  return String(text || '')
    .replace(runUrl || '', '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
}

/** 最近一次失败：优先用告警回写，成功记录会盖掉更早的失败通知。 */
export function resolveAutomationIncident(workflow, { lastRuns = {}, alertsByWorkflow = {} } = {}) {
  const id = String(workflow || '').trim()
  if (!id) return null
  const recorded = lastRuns[id]
  if (recorded && (recorded.ok === true || isSuccessfulAutomationStatus(recorded.status, recorded.error))) return null
  if (recorded && recorded.ok === false) {
    const runUrl = safeAutomationRunUrl(recorded.runUrl) || extractAutomationRunUrl(recorded.error)
    return {
      at: Number(recorded.at) || 0,
      error: cleanIncidentError(recorded.error, runUrl),
      runUrl,
      runId: String(recorded.runId || '').slice(0, 80),
      taskName: String(recorded.taskName || '').slice(0, 80),
    }
  }
  const alert = alertsByWorkflow[id]
  if (!alert || isSuccessfulAutomationStatus('', alert.message_excerpt)) return null
  const runUrl = extractAutomationRunUrl(alert.message_excerpt)
  return {
    at: Number(alert.created_at) || 0,
    error: cleanIncidentError(alert.message_excerpt, runUrl),
    runUrl,
    runId: '',
    taskName: '',
  }
}

/** Pages 部署告警的工作流成功只表示通知已发出，台账要显示被监听的那次部署失败。 */
export function deploymentFailureStats(incident) {
  if (!incident) return null
  return {
    lastRun: formatAutomationLastRun({ at: incident.at, ok: false, error: incident.error }) || '失败',
    successRate: '—',
  }
}
