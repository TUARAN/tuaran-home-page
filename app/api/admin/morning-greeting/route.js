import { X_POST_SLOTS } from '../../../../lib/xPostingSchedule'
import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  MORNING_GREETING_ID,
  MORNING_GREETING_SETTING_KEY,
  isAutomationPaused,
} from '../../../../lib/morningGreeting'
import {
  DAILY_GREETING_LLM_PROMPT_KEY,
  DAILY_GREETING_MODE_KEY,
  DEFAULT_DAILY_GREETING_LLM_INTENT,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
} from '../../../../lib/dailyGreetingLlm'
import {
  X_API_POST_CREATE_COST_MICRO_USD,
  X_API_POST_CREATE_WITH_URL_COST_MICRO_USD,
  X_API_PRICING_CHECKED_AT,
  X_API_PRICING_SOURCE_URL,
  getXApiCostSummary,
  projectedXPostCost,
} from '../../../../lib/xApiCost'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

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

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({ status: 'unavailable', message: '当前运行环境没有 D1 绑定。' }, { status: 503 })
  }

  try {
    const [state, modeRaw, intentRaw, runSettings] = await Promise.all([
      readSetting(db, MORNING_GREETING_SETTING_KEY),
      readSetting(db, DAILY_GREETING_MODE_KEY),
      readSetting(db, DAILY_GREETING_LLM_PROMPT_KEY),
      db.prepare(
        `SELECT key, value FROM site_settings
         WHERE key LIKE 'automation.x_joke.last_run.joke_%'
            OR key LIKE 'automation.x_community.last_run.community_%'
            OR key LIKE 'automation.x_morning_greeting.last_run.%'
            OR key LIKE 'automation.x_culture_story.last_run.culture_%'
            OR key LIKE 'automation.x_crypto.last_run.crypto_%'
            OR key LIKE 'automation.x_us_audience.last_run.us_%'
            OR key LIKE 'automation.x_controversy.last_run.controversy_%'`,
      ).all(),
    ])
    const jokeRuns = {}
    const communityRuns = {}
    const greetingRuns = {}
    const cultureRuns = {}
    const cryptoRuns = {}
    const usRuns = {}
    const controversyRuns = {}
    const runGroups = [
      { prefix: 'automation.x_joke.last_run.', target: jokeRuns },
      { prefix: 'automation.x_community.last_run.', target: communityRuns },
      { prefix: 'automation.x_morning_greeting.last_run.', target: greetingRuns },
      { prefix: 'automation.x_culture_story.last_run.', target: cultureRuns },
      { prefix: 'automation.x_crypto.last_run.', target: cryptoRuns },
      { prefix: 'automation.x_us_audience.last_run.', target: usRuns },
      { prefix: 'automation.x_controversy.last_run.', target: controversyRuns },
    ]
    for (const row of runSettings?.results || []) {
      const group = runGroups.find((item) => String(row.key || '').startsWith(item.prefix))
      const slot = group ? String(row.key || '').slice(group.prefix.length) : ''
      if (!group || !slot) continue
      try {
        group.target[slot] = JSON.parse(row.value || 'null')
      } catch {
        group.target[slot] = null
      }
    }
    let xApiCost
    try {
      xApiCost = await getXApiCostSummary(db, { postsPerDay: X_POST_SLOTS.length })
    } catch {
      // 数据库迁移尚未执行时仍展示官方单价与固定日程预算。
      xApiCost = {
        available: false,
        currency: 'USD',
        todayPosts: 0,
        todayMicroUsd: 0,
        monthPosts: 0,
        monthMicroUsd: 0,
        projected30DayPosts: X_POST_SLOTS.length * 30,
        projected30DayMicroUsd: projectedXPostCost({ postsPerDay: X_POST_SLOTS.length, days: 30 }),
        trackedSince: null,
      }
    }
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      paused: isAutomationPaused(state),
      generationMode: normalizeGreetingGenerationMode(modeRaw),
      llmIntent: normalizeGreetingLlmIntent(intentRaw, DEFAULT_DAILY_GREETING_LLM_INTENT),
      jokeRuns,
      communityRuns,
      greetingRuns,
      cultureRuns,
      cryptoRuns,
      usRuns,
      controversyRuns,
      xApiCost: {
        ...xApiCost,
        postCreateMicroUsd: X_API_POST_CREATE_COST_MICRO_USD,
        postCreateWithUrlMicroUsd: X_API_POST_CREATE_WITH_URL_COST_MICRO_USD,
        pricingCheckedAt: X_API_PRICING_CHECKED_AT,
        pricingSourceUrl: X_API_PRICING_SOURCE_URL,
      },
    })
  } catch (error) {
    return Response.json(
      { status: 'error', message: 'X 发布配置读取失败。', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', message: 'D1 不可用。' }, { status: 503 })

  const body = await req.json().catch(() => null)
  const action = String(body?.action || '')
  if (action === 'save-generation') {
    const intent = String(body?.intent || '').replace(/\r\n?/g, '\n').trim()
    if (!intent) return Response.json({ error: 'LLM_INTENT_REQUIRED' }, { status: 400 })
    if (intent.length > 4000) return Response.json({ error: 'LLM_INTENT_TOO_LONG' }, { status: 400 })
    await writeSetting(db, DAILY_GREETING_LLM_PROMPT_KEY, intent, guard.user?.name || 'admin')
    return Response.json({ ok: true, intent })
  }
  if (action !== 'pause' && action !== 'resume') {
    return Response.json({ error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  }

  const next = action === 'pause' ? 'paused' : 'running'
  await writeSetting(db, MORNING_GREETING_SETTING_KEY, next, guard.user?.name || 'admin')
  return Response.json({ ok: true, id: MORNING_GREETING_ID, status: next })
}
