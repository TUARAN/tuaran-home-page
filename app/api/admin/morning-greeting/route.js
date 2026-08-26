import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import {
  MORNING_GREETING_ID,
  MORNING_GREETING_SETTING_KEY,
  greetingLastRunKey,
  isAutomationPaused,
} from '../../../../lib/morningGreeting'
import {
  DAILY_GREETING_LLM_PROMPT_KEY,
  DAILY_GREETING_MODE_KEY,
  DAILY_GREETING_OLLAMA_PROVIDER_KEY,
  DEFAULT_DAILY_GREETING_LLM_INTENT,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
} from '../../../../lib/dailyGreetingLlm'
import { cultureStoryLastRunKey } from '../../../../lib/dailyCultureStory'
import {
  listMorningGreetingTemplates,
  upsertMorningGreetingTemplate,
} from '../../../../lib/morningGreetingTemplates'
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
    const [
      templatePage,
      state,
      modeRaw,
      intentRaw,
      ollamaProviderRaw,
      ollamaProviderRows,
      morningRaw,
      noonRaw,
      eveningRaw,
      cultureMorningRaw,
      cultureAfternoonRaw,
      cultureEveningRaw,
    ] = await Promise.all([
      listMorningGreetingTemplates(db),
      readSetting(db, MORNING_GREETING_SETTING_KEY),
      readSetting(db, DAILY_GREETING_MODE_KEY),
      readSetting(db, DAILY_GREETING_LLM_PROMPT_KEY),
      readSetting(db, DAILY_GREETING_OLLAMA_PROVIDER_KEY),
      db.prepare(
        `SELECT id, name, default_model
         FROM llm_providers
         WHERE provider_type = 'ollama' AND status = 'active'
         ORDER BY CASE WHEN default_model LIKE 'qwen3.5:%' THEN 0 ELSE 1 END, updated_at DESC`,
      ).all(),
      readSetting(db, greetingLastRunKey('morning')),
      readSetting(db, greetingLastRunKey('noon')),
      readSetting(db, greetingLastRunKey('evening')),
      readSetting(db, cultureStoryLastRunKey('culture_morning')),
      readSetting(db, cultureStoryLastRunKey('culture_afternoon')),
      readSetting(db, cultureStoryLastRunKey('culture_evening')),
    ])
    const lastRuns = {}
    for (const [key, raw] of [['morning', morningRaw], ['noon', noonRaw], ['evening', eveningRaw]]) {
      try {
        lastRuns[key] = JSON.parse(raw || 'null')
      } catch {
        lastRuns[key] = null
      }
    }
    const cultureRuns = {}
    for (const [key, raw] of [
      ['culture_morning', cultureMorningRaw],
      ['culture_afternoon', cultureAfternoonRaw],
      ['culture_evening', cultureEveningRaw],
    ]) {
      try {
        cultureRuns[key] = JSON.parse(raw || 'null')
      } catch {
        cultureRuns[key] = null
      }
    }
    const ollamaProviders = (ollamaProviderRows.results || []).map((row) => ({ id: row.id, name: row.name, model: row.default_model }))
    const ollamaProviderId = ollamaProviders.some((provider) => provider.id === ollamaProviderRaw)
      ? String(ollamaProviderRaw)
      : String(ollamaProviders[0]?.id || '')
    let xApiCost
    try {
      xApiCost = await getXApiCostSummary(db, { postsPerDay: 6 })
    } catch {
      // 数据库迁移尚未执行时仍展示官方单价与固定日程预算。
      xApiCost = {
        available: false,
        currency: 'USD',
        todayPosts: 0,
        todayMicroUsd: 0,
        monthPosts: 0,
        monthMicroUsd: 0,
        projected30DayPosts: 180,
        projected30DayMicroUsd: projectedXPostCost({ postsPerDay: 6, days: 30 }),
        trackedSince: null,
      }
    }
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      templates: templatePage.items,
      total: templatePage.total,
      paused: isAutomationPaused(state),
      generationMode: normalizeGreetingGenerationMode(modeRaw),
      llmIntent: normalizeGreetingLlmIntent(intentRaw, DEFAULT_DAILY_GREETING_LLM_INTENT),
      ollamaProviders,
      ollamaProviderId,
      lastRuns,
      cultureRuns,
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
      { status: 'error', message: '每日问候模板读取失败。', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', message: 'D1 不可用。' }, { status: 503 })

  const body = await req.json().catch(() => null)
  if (!body) return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  if (!Number(body.id)) return Response.json({ error: 'FIXED_TEMPLATE_SLOTS' }, { status: 400 })

  try {
    const result = await upsertMorningGreetingTemplate(db, {
      id: Number(body.id) || 0,
      text: String(body.text || ''),
    })
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.error === 'NOT_FOUND' ? 404 : 400 })
    }
    return Response.json({ ok: true, id: result.id }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: 'TEMPLATE_UPSERT_FAILED', detail: String(error?.message || error) },
      { status: 500 },
    )
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  return Response.json({ error: 'FIXED_TEMPLATE_SLOTS' }, { status: 405 })
}

export async function PATCH(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) return Response.json({ status: 'unavailable', message: 'D1 不可用。' }, { status: 503 })

  const body = await req.json().catch(() => null)
  const action = String(body?.action || '')
  if (action === 'save-generation') {
    const rawMode = String(body?.mode || '').trim().toLowerCase()
    const mode = normalizeGreetingGenerationMode(rawMode, '')
    const intent = String(body?.intent || '').replace(/\r\n?/g, '\n').trim()
    const ollamaProviderId = String(body?.ollamaProviderId || '').trim()
    if (!mode) return Response.json({ error: 'INVALID_GENERATION_MODE' }, { status: 400 })
    if (mode !== 'template' && !intent) return Response.json({ error: 'LLM_INTENT_REQUIRED' }, { status: 400 })
    if (mode === 'ollama' && !ollamaProviderId) return Response.json({ error: 'OLLAMA_PROVIDER_REQUIRED' }, { status: 400 })
    if (intent.length > 4000) return Response.json({ error: 'LLM_INTENT_TOO_LONG' }, { status: 400 })
    const writes = [writeSetting(db, DAILY_GREETING_MODE_KEY, mode, guard.user?.name || 'admin')]
    if (intent) writes.push(writeSetting(db, DAILY_GREETING_LLM_PROMPT_KEY, intent, guard.user?.name || 'admin'))
    if (mode === 'ollama') {
      const provider = await db.prepare(
        `SELECT id FROM llm_providers WHERE id = ? AND provider_type = 'ollama' AND status = 'active'`,
      ).bind(ollamaProviderId).first()
      if (!provider) return Response.json({ error: 'OLLAMA_PROVIDER_NOT_FOUND' }, { status: 400 })
      writes.push(writeSetting(db, DAILY_GREETING_OLLAMA_PROVIDER_KEY, ollamaProviderId, guard.user?.name || 'admin'))
    }
    await Promise.all(writes)
    return Response.json({ ok: true, mode, intent, ollamaProviderId })
  }
  if (action !== 'pause' && action !== 'resume') {
    return Response.json({ error: 'UNSUPPORTED_ACTION' }, { status: 400 })
  }

  const next = action === 'pause' ? 'paused' : 'running'
  await writeSetting(db, MORNING_GREETING_SETTING_KEY, next, guard.user?.name || 'admin')
  return Response.json({ ok: true, id: MORNING_GREETING_ID, status: next })
}
