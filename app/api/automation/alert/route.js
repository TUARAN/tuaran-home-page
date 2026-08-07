import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { safeEqual } from '../../../../lib/ownerAuth'
import { createAutomationAlertNotification } from '../../../../lib/siteNotifications'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-automation-alert-secret'

/**
 * 自动化监控告警入口：GitHub Actions 定时任务失败时由工作流调用，
 * 向站长消息中心写入一条 automation_monitor 类型通知。
 *
 * 鉴权复用现有 Secret 回退链：优先 AUTOMATION_ALERT_SECRET，
 * 未配置时 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET 任一放行
 * （与仓库其他定时任务同一回退链）。
 */
async function handle(request) {
  const env = getOptionalRequestContext()?.env || {}
  const configuredSecrets = [
    env.AUTOMATION_ALERT_SECRET,
    env.WEEKLY_SUMMARY_SECRET,
    env.PUBLIC_OPINION_COLLECT_SECRET,
    process.env.AUTOMATION_ALERT_SECRET,
    process.env.WEEKLY_SUMMARY_SECRET,
    process.env.PUBLIC_OPINION_COLLECT_SECRET,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  if (!configuredSecrets.length) {
    return Response.json(
      {
        ok: false,
        error: 'AUTOMATION_ALERT_SECRET_NOT_CONFIGURED',
        detail: '请配置 AUTOMATION_ALERT_SECRET（或兼容回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET）。',
      },
      { status: 503 },
    )
  }

  const suppliedSecret = request.headers.get(HEADER_SECRET) || ''
  if (!configuredSecrets.some((secret) => safeEqual(suppliedSecret, secret))) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const workflow = String(body?.workflow || '').trim()
  const runId = String(body?.runId || '').trim()
  if (!workflow || !runId) {
    return Response.json(
      { ok: false, error: 'MISSING_FIELDS', detail: 'workflow 与 runId 必填。' },
      { status: 400 },
    )
  }

  try {
    const result = await createAutomationAlertNotification(env.DB, {
      workflow,
      runId,
      taskName: String(body?.taskName || workflow).slice(0, 80),
      status: String(body?.status || 'failed').slice(0, 20),
      error: String(body?.error || '').slice(0, 2000),
      runUrl: String(body?.runUrl || '').slice(0, 500),
    })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    return Response.json(
      { ok: false, error: 'AUTOMATION_ALERT_FAILED', detail: String(error?.message || error).slice(0, 500) },
      { status: 500 },
    )
  }
}

export const POST = handle
