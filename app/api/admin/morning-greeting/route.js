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
  DEFAULT_DAILY_GREETING_LLM_INTENT,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
} from '../../../../lib/dailyGreetingLlm'
import { cultureStoryLastRunKey } from '../../../../lib/dailyCultureStory'
import { xCommunityLastRunKey } from '../../../../lib/xCommunityPosts'
import { xUsAudienceLastRunKey } from '../../../../lib/xUsAudiencePosts'
import { xCryptoLastRunKey } from '../../../../lib/xCryptoPosts'
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
      state,
      modeRaw,
      intentRaw,
      morningRaw,
      noonRaw,
      eveningRaw,
      cultureMorningRaw,
      cultureAfternoonRaw,
      cultureEveningRaw,
      communityFriendsRaw,
      communityLearningRaw,
      communityGrowthRaw,
      usMorningRaw,
      usMiddayRaw,
      usEveningRaw,
      cryptoKnowledgeRaw,
      cryptoMarketRaw,
      cryptoPeopleRaw,
    ] = await Promise.all([
      readSetting(db, MORNING_GREETING_SETTING_KEY),
      readSetting(db, DAILY_GREETING_MODE_KEY),
      readSetting(db, DAILY_GREETING_LLM_PROMPT_KEY),
      readSetting(db, greetingLastRunKey('morning')),
      readSetting(db, greetingLastRunKey('noon')),
      readSetting(db, greetingLastRunKey('evening')),
      readSetting(db, cultureStoryLastRunKey('culture_morning')),
      readSetting(db, cultureStoryLastRunKey('culture_afternoon')),
      readSetting(db, cultureStoryLastRunKey('culture_evening')),
      readSetting(db, xCommunityLastRunKey('community_friends')),
      readSetting(db, xCommunityLastRunKey('community_learning')),
      readSetting(db, xCommunityLastRunKey('community_growth')),
      readSetting(db, xUsAudienceLastRunKey('us_morning')),
      readSetting(db, xUsAudienceLastRunKey('us_midday')),
      readSetting(db, xUsAudienceLastRunKey('us_evening')),
      readSetting(db, xCryptoLastRunKey('crypto_knowledge')),
      readSetting(db, xCryptoLastRunKey('crypto_market')),
      readSetting(db, xCryptoLastRunKey('crypto_people')),
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
    const communityRuns = {}
    for (const [key, raw] of [
      ['community_friends', communityFriendsRaw],
      ['community_learning', communityLearningRaw],
      ['community_growth', communityGrowthRaw],
    ]) {
      try {
        communityRuns[key] = JSON.parse(raw || 'null')
      } catch {
        communityRuns[key] = null
      }
    }
    const usRuns = {}
    for (const [key, raw] of [
      ['us_morning', usMorningRaw],
      ['us_midday', usMiddayRaw],
      ['us_evening', usEveningRaw],
    ]) {
      try {
        usRuns[key] = JSON.parse(raw || 'null')
      } catch {
        usRuns[key] = null
      }
    }
    const cryptoRuns = {}
    for (const [key, raw] of [
      ['crypto_knowledge', cryptoKnowledgeRaw],
      ['crypto_market', cryptoMarketRaw],
      ['crypto_people', cryptoPeopleRaw],
    ]) {
      try {
        cryptoRuns[key] = JSON.parse(raw || 'null')
      } catch {
        cryptoRuns[key] = null
      }
    }
    let xApiCost
    try {
      xApiCost = await getXApiCostSummary(db, { postsPerDay: 10 })
    } catch {
      // 数据库迁移尚未执行时仍展示官方单价与固定日程预算。
      xApiCost = {
        available: false,
        currency: 'USD',
        todayPosts: 0,
        todayMicroUsd: 0,
        monthPosts: 0,
        monthMicroUsd: 0,
        projected30DayPosts: 300,
        projected30DayMicroUsd: projectedXPostCost({ postsPerDay: 10, days: 30 }),
        trackedSince: null,
      }
    }
    return Response.json({
      status: 'ok',
      generatedAt: Date.now(),
      paused: isAutomationPaused(state),
      generationMode: normalizeGreetingGenerationMode(modeRaw),
      llmIntent: normalizeGreetingLlmIntent(intentRaw, DEFAULT_DAILY_GREETING_LLM_INTENT),
      lastRuns,
      cultureRuns,
      communityRuns,
      usRuns,
      cryptoRuns,
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
