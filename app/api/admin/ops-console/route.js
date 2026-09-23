import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  AGENT_OPS_EXTERNAL_URL,
  AGENT_OPS_LOCAL_URL,
  AGENT_OPS_ROOT,
  AUTOMATION_REGISTRY,
  OPS_RECENT_RUNS,
  automationScheduleStatus,
  registryEntryText,
} from '../../../../lib/adminOpsRegistry'
import {
  lastRunSettingKey,
  pickLatestAlertByWorkflow,
  resolveRegistryLastRun,
  workflowIdFromEntry,
} from '../../../../lib/automationLastRun'
import { githubResearchToken } from '../../../../lib/researchGitHubQueue'
import {
  AUTOMATION_GITHUB_WORKFLOWS,
  fetchGitHubWorkflowRuns,
  resolveAutomationStats,
  runsFromDailyBriefs,
  runsFromRecentLogs,
  runsFromStatusRows,
} from '../../../../lib/automationRunStats'
import { FRONTEND_WEEKLY_KEYS, readR2Json } from '../../../../lib/frontendWeeklyData'
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

async function readRows(db, sql) {
  if (!db) return []
  try {
    const { results } = await db.prepare(sql).all()
    return results || []
  } catch {
    return []
  }
}

async function readFrontendWeekly(env) {
  const bucket = env?.CONTENT_FEED
  if (bucket) {
    try {
      const [daily, live] = await Promise.all([
        readR2Json(bucket, FRONTEND_WEEKLY_KEYS.dailyIndex, { latest: '', list: [] }),
        readR2Json(bucket, FRONTEND_WEEKLY_KEYS.live, { updatedAt: null, items: [] }),
      ])
      return { daily, live }
    } catch {
      // 本地预览没有 R2 时改读线上周看数据。
    }
  }
  try {
    const response = await fetch('https://2aran.com/api/frontend-weekly', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const startedAt = Date.now()
  const db = getOptionalRequestContext()?.env?.DB || null
  let greetingState = null
  let greetingLastRun = null
  let automationLastRuns = {}
  let alertsByWorkflow = {}
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
    try {
      const workflows = [...new Set(AUTOMATION_REGISTRY.map((item) => workflowIdFromEntry(item.entry)).filter(Boolean))]
      for (const workflow of workflows) {
        const raw = await readSetting(db, lastRunSettingKey(workflow))
        if (!raw) continue
        try {
          automationLastRuns[workflow] = JSON.parse(raw)
        } catch {
          automationLastRuns[workflow] = null
        }
      }
    } catch {
      automationLastRuns = {}
    }
    try {
      const { results } = await db
        .prepare(
          `SELECT article_key, message_excerpt, created_at
           FROM comment_notifications
           WHERE type = 'automation_monitor'
           ORDER BY created_at DESC
           LIMIT 80`,
        )
        .all()
      alertsByWorkflow = pickLatestAlertByWorkflow(results)
    } catch {
      alertsByWorkflow = {}
    }
  }

  const env = getOptionalRequestContext()?.env || {}
  const [githubRunsById, frontendWeekly, engagementRows, aShareStatRows, cryptoStatRows] = await Promise.all([
    fetchGitHubWorkflowRuns(AUTOMATION_GITHUB_WORKFLOWS, { token: githubResearchToken(env) }),
    readFrontendWeekly(env),
    readRows(db, 'SELECT status, started_at, detail FROM engagement_bot_runs ORDER BY started_at DESC LIMIT 20'),
    readRows(db, 'SELECT status, ran_at, error FROM a_share_run_log ORDER BY ran_at DESC LIMIT 20'),
    readRows(db, 'SELECT status, ran_at, error FROM crypto_run_log ORDER BY ran_at DESC LIMIT 20'),
  ])
  const logRunsById = {
    'engagement-bot': runsFromStatusRows(engagementRows, { atKey: 'started_at', errorKey: 'detail' }),
    'a-share-research-daily': runsFromStatusRows(aShareStatRows),
    'crypto-research-daily': runsFromStatusRows(cryptoStatRows),
  }
  const recordedRunsById = {}
  for (const run of OPS_RECENT_RUNS) {
    if (!recordedRunsById[run.taskId]) recordedRunsById[run.taskId] = []
    recordedRunsById[run.taskId].push(...runsFromRecentLogs([run]))
  }
  const liveUpdatedAt = Date.parse(frontendWeekly?.live?.updatedAt || '')
  if (liveUpdatedAt) {
    recordedRunsById['frontendnext-hourly-ingest'] = [{ at: liveUpdatedAt, conclusion: 'success' }]
  }
  const dailyRuns = runsFromDailyBriefs(frontendWeekly?.daily?.list)
  if (dailyRuns.length) recordedRunsById['frontendnext-daily-brief'] = dailyRuns

  const registry = AUTOMATION_REGISTRY.map((item) => {
    const seededLastRun = resolveRegistryLastRun(item, { lastRuns: automationLastRuns, alertsByWorkflow }) || item.lastRun
    const stats = resolveAutomationStats(
      { ...item, lastRun: seededLastRun },
      {
        logRuns: logRunsById[item.id] || [],
        githubRuns: githubRunsById[item.id] || [],
        recordedRuns: recordedRunsById[item.id] || [],
      },
    )
    const resolved = {
      ...item,
      status: automationScheduleStatus(item),
      lastRun: stats.lastRun,
      successRate: stats.successRate,
      ...(item.id === MORNING_GREETING_ID
        ? {
            status: isAutomationPaused(greetingState) ? 'paused' : 'active',
            pausable: true,
          }
        : {}),
      latestRun: OPS_RECENT_RUNS.find((run) => run.taskId === item.id) || null,
    }
    return { ...resolved, registryText: registryEntryText(resolved) }
  })
  const repositoryByTask = new Map(registry.map((item) => [item.id, item.repository]))
  let aShareRuns = []
  let cryptoRuns = []
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
  if (db) {
    try {
      const { results } = await db.prepare('SELECT * FROM crypto_run_log ORDER BY ran_at DESC LIMIT 6').all()
      cryptoRuns = (results || []).map((row) => ({
        id: `crypto-${row.id}-${row.ran_at}`,
        taskId: 'crypto-research-daily',
        taskName: `加密资产观察${row.coin_name ? `：${row.coin_name}（${row.symbol}）` : ''}`,
        repository: 'tuaran-home-page',
        status: row.status === 'ok' ? 'success' : row.status === 'failed' ? 'failed' : 'skipped',
        reviewStatus: row.status === 'ok' && row.action === 'draft' ? 'pending_review' : 'not_required',
        startedAt: new Date(Number(row.ran_at) || Date.now()).toISOString(),
        durationMs: Number(row.duration_ms) || null,
        artifacts: row.draft_id ? [`草稿 ${row.draft_id}`] : [],
      }))
    } catch {
      cryptoRuns = []
    }
  }
  const recentRuns = [
    ...(greetingLastRun
      ? [
          {
            id: `x-morning-greeting-${greetingLastRun.at || Date.now()}`,
            taskId: MORNING_GREETING_ID,
            taskName: 'X 每日问候',
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
    ...cryptoRuns,
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
