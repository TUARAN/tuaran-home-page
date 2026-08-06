import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  AGENT_OPS_EXTERNAL_URL,
  AGENT_OPS_LOCAL_URL,
  AGENT_OPS_ROOT,
  AUTOMATION_REGISTRY,
  OPS_RECENT_RUNS,
  registryEntryText,
} from '../../../../lib/adminOpsRegistry'
import {
  MORNING_GREETING_ID,
  MORNING_GREETING_LAST_RUN_KEY,
  MORNING_GREETING_SETTING_KEY,
  isAutomationPaused,
} from '../../../../lib/morningGreeting'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function readSetting(db, key) {
  const { results } = await db.prepare('SELECT value FROM site_settings WHERE key = ?1').bind(key).all()
  return results?.[0]?.value ?? null
}

async function writeSetting(db, key, value, updatedBy) {
  await db
    .prepare(
      `INSERT INTO site_settings (key, value, updated_at, updated_by)
       VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    )
    .bind(key, value, Date.now(), String(updatedBy || 'admin'))
    .run()
}

function formatLastRun(payload) {
  if (!payload) return null
  const at = Number(payload.at || 0)
  const label = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at || Date.now())
  return payload.ok ? `${label} 成功` : `${label} 失败${payload.error ? `（${payload.error}）` : ''}`
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const startedAt = Date.now()
  const db = getOptionalRequestContext()?.env?.DB || null
  let greetingState = null
  let greetingLastRun = null
  if (db) {
    try {
      greetingState = await readSetting(db, MORNING_GREETING_SETTING_KEY)
    } catch {
      greetingState = null
    }
    try {
      greetingLastRun = JSON.parse((await readSetting(db, MORNING_GREETING_LAST_RUN_KEY)) || 'null')
    } catch {
      greetingLastRun = null
    }
  }

  const registry = AUTOMATION_REGISTRY.map((item) => ({
    ...item,
    ...(item.id === MORNING_GREETING_ID
      ? {
          status: isAutomationPaused(greetingState) ? 'paused' : 'running',
          pausable: true,
          lastRun: formatLastRun(greetingLastRun) || item.lastRun,
        }
      : {}),
    registryText: registryEntryText(item),
    latestRun: OPS_RECENT_RUNS.find((run) => run.taskId === item.id) || null,
  }))
  const repositoryByTask = new Map(registry.map((item) => [item.id, item.repository]))
  let aShareRuns = []
  if (db) {
    try {
      const { results } = await db
        .prepare('SELECT * FROM a_share_run_log ORDER BY ran_at DESC LIMIT 6')
        .all()
      aShareRuns = (results || []).map((row) => ({
        id: `a-share-${row.id}-${row.ran_at}`,
        taskId: 'a-share-research-daily',
        taskName: `A 股公司观察${row.company_name ? `：${row.company_name}（${row.code}）` : ''}`,
        repository: 'tuaran-home-page',
        status: row.status === 'ok' ? 'success' : row.status === 'failed' ? 'failed' : 'skipped',
        reviewStatus: row.status === 'ok' && row.action === 'draft' ? 'pending_review' : 'not_required',
        startedAt: new Date(Number(row.ran_at) || Date.now()).toISOString(),
        durationMs: Number(row.duration_ms) || null,
        artifacts: row.draft_id ? [`草稿 ${row.draft_id}`] : [],
      }))
    } catch {
      aShareRuns = []
    }
  }
  const recentRuns = [
    ...(greetingLastRun
      ? [
          {
            id: `x-morning-greeting-${greetingLastRun.at || Date.now()}`,
            taskId: MORNING_GREETING_ID,
            taskName: 'X 每日早安问候',
            repository: 'tuaran-home-page',
            status: greetingLastRun.ok ? 'success' : 'failed',
            reviewStatus: 'not_required',
            startedAt: new Date(Number(greetingLastRun.at || Date.now())).toISOString(),
            durationMs: null,
            artifacts: greetingLastRun.postUrl ? [greetingLastRun.postUrl] : [greetingLastRun.error || 'X 发帖'],
          },
        ]
      : []),
    ...aShareRuns,
    ...OPS_RECENT_RUNS.map((run) => ({
      ...run,
      repository: run.repository || repositoryByTask.get(run.taskId) || null,
    })),
  ]
  const cloudAutomations = registry.filter((item) => item.scope === 'cloud')
  const localAutomations = registry.filter((item) => item.scope === 'local')
  const autoRunItems = registry.filter((item) => item.autoRun)
  const reviewRequiredItems = registry.filter((item) => item.reviewRequired)
  const pendingReviewRuns = recentRuns.filter((run) => run.reviewStatus === 'pending_review')
  const successRuns = recentRuns.filter((run) => run.status === 'success')

  return Response.json({
    status: 'reachable',
    label: '站内可访问',
    message: '当前请求已通过站内 admin owner 校验。云端与本地自动化已统一进入 Automation Registry。',
    checkedAt: Date.now(),
    latencyMs: Date.now() - startedAt,
    route: '/admin/ops',
    root: AGENT_OPS_ROOT,
    externalUrl: AGENT_OPS_EXTERNAL_URL,
    localUrl: AGENT_OPS_LOCAL_URL,
    registry,
    cloudAutomations,
    localAutomations,
    recentRuns,
    stats: {
      totalTasks: registry.length,
      cloudTasks: cloudAutomations.length,
      localTasks: localAutomations.length,
      autoRun: autoRunItems.length,
      reviewRequired: reviewRequiredItems.length,
      recentRuns: recentRuns.length,
      successRuns: successRuns.length,
      pendingReview: pendingReviewRuns.length,
      artifacts: recentRuns.reduce((sum, run) => sum + (run.artifacts || []).length, 0),
    },
  })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 })
  }

  const id = String(body?.id || '')
  const action = String(body?.action || '')
  if (id !== MORNING_GREETING_ID || !['pause', 'resume'].includes(action)) {
    return Response.json({ ok: false, error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  }

  const db = getOptionalRequestContext()?.env?.DB
  if (!db) {
    return Response.json({ ok: false, error: 'D1_UNAVAILABLE' }, { status: 503 })
  }

  const next = action === 'pause' ? 'paused' : 'running'
  try {
    await writeSetting(db, MORNING_GREETING_SETTING_KEY, next, guard.user?.name || 'admin')
  } catch {
    return Response.json({ ok: false, error: 'WRITE_FAILED' }, { status: 500 })
  }
  return Response.json({ ok: true, id, status: next })
}
