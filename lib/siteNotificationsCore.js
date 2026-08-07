/**
 * 站内通知纯逻辑（无外部依赖，可单测）。
 * 与 lib/siteNotifications.js 保持同一套 key 与摘要口径。
 */

/** 自动化任务告警的通知去重 key：system:automation:<workflow>:<runId>。 */
export function automationAlertKey(workflow, runId) {
  const workflowId = String(workflow || 'unknown')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const id = String(runId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)
  return `system:automation:${workflowId || 'unknown'}:${id || 'unknown'}`
}

/** 告警摘要：任务名 + 状态 + 错误摘要 + 运行链接，控制在 160 字内。 */
export function buildAutomationAlertExcerpt({ taskName = '', status = 'failed', error = '', runUrl = '' } = {}) {
  const head = `${String(taskName || '自动化任务').slice(0, 30)} 运行${status === 'ok' ? '恢复' : '失败'}`
  const errText = String(error || '').trim().replace(/\s+/g, ' ').slice(0, 100)
  const urlText = String(runUrl || '').trim().slice(0, 90)
  const parts = [head]
  if (errText) parts.push(errText)
  if (urlText) parts.push(urlText)
  return parts.join('\n').slice(0, 160)
}
