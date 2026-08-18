import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  MORNING_GREETING_SETTING_KEY,
  buildDailyGreeting,
  greetingLastRunKey,
  greetingPeriodForDate,
  greetingWithinLimit,
  isAutomationPaused,
  normalizeGreetingPeriod,
  pickDailyGreetingTemplate,
  shanghaiDateKey,
} from '../../../../../lib/morningGreeting'
import { listEnabledMorningGreetingTexts } from '../../../../../lib/morningGreetingTemplates'
import {
  DAILY_GREETING_LLM_PROMPT_KEY,
  DAILY_GREETING_MODE_KEY,
  buildGreetingLlmMessages,
  normalizeGeneratedGreeting,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
} from '../../../../../lib/dailyGreetingLlm'
import { callDeepSeek } from '../../../../../lib/deepseek'
import { getXCredentials, publishXPost } from '../../../../../lib/xDistribution'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SECRET_HEADER = 'x-morning-greeting-secret'

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
    .bind(key, value, Date.now(), String(updatedBy || 'automation'))
    .run()
}

export async function POST(req) {
  const env = getOptionalRequestContext()?.env || {}
  const expectedSecret = String(env.MORNING_GREETING_SECRET || process.env.MORNING_GREETING_SECRET || '').trim()
  if (!expectedSecret) {
    return Response.json(
      {
        ok: false,
        error: 'MORNING_GREETING_SECRET_NOT_CONFIGURED',
        detail: '请先在 Cloudflare Pages 环境变量配置 MORNING_GREETING_SECRET（与 GitHub 仓库 Secret 同值）。',
      },
      { status: 503 },
    )
  }
  if (req.headers.get(SECRET_HEADER) !== expectedSecret) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const requestedPeriod = new URL(req.url).searchParams.get('period')
  const period = requestedPeriod
    ? normalizeGreetingPeriod(requestedPeriod, '')
    : greetingPeriodForDate()
  if (!period) {
    return Response.json({ ok: false, error: 'INVALID_PERIOD', detail: 'period 仅支持 morning、noon、evening。' }, { status: 400 })
  }
  const lastRunKey = greetingLastRunKey(period)

  const db = env.DB || null
  if (db) {
    try {
      const state = await readSetting(db, MORNING_GREETING_SETTING_KEY)
      if (isAutomationPaused(state)) {
        return Response.json(
          { ok: false, error: 'PAUSED', detail: '后台已暂停该自动化，本次不发布。' },
          { status: 423 },
        )
      }
    } catch {
      // D1 不可用时按“运行中”放行，发布失败由 X 凭据环节兜底。
    }
    try {
      // 同一自然日的同一时段只成功发布一次；三个时段分别记录，互不阻断。
      const lastRunRaw = await readSetting(db, lastRunKey)
      if (lastRunRaw) {
        const lastRun = JSON.parse(lastRunRaw)
        if (lastRun?.ok && shanghaiDateKey(lastRun.at) === shanghaiDateKey()) {
          return Response.json(
            {
              ok: true,
              skipped: true,
              reason: 'already_posted_today',
              period,
              postId: lastRun.postId || '',
              postUrl: lastRun.postUrl || '',
            },
            { status: 200 },
          )
        }
      }
    } catch {
      // 上次记录缺失或无法解析时按“未发布”处理，允许重试。
    }
  }

  let generationMode = 'llm'
  let llmIntent = ''
  if (db) {
    try {
      const [modeRaw, intentRaw] = await Promise.all([
        readSetting(db, DAILY_GREETING_MODE_KEY),
        readSetting(db, DAILY_GREETING_LLM_PROMPT_KEY),
      ])
      generationMode = normalizeGreetingGenerationMode(modeRaw)
      llmIntent = normalizeGreetingLlmIntent(intentRaw)
    } catch {
      // 配置缺失或暂时无法读取时沿用产品默认值：LLM 意图模式。
      generationMode = 'llm'
    }
  }

  let text = ''
  let generation = null
  if (generationMode === 'llm') {
    try {
      generation = await callDeepSeek({
        env,
        messages: buildGreetingLlmMessages({ intent: llmIntent, period }),
        temperature: 0.85,
        maxTokens: 256,
        timeoutMs: 45_000,
        taskDefaultModel: 'deepseek-v4-flash',
        disableThinking: true,
        task: {
          source: 'x-daily-greeting',
          taskType: 'direct-post-copy',
          title: `X 每日问候：${period}`,
          actorId: 'cron:x-daily-greeting',
          actorName: '线上定时自动化',
          inputSummary: `时段：${period}；意图：${llmIntent.slice(0, 500)}`,
          metadata: { period, directPublish: true },
        },
      })
      text = normalizeGeneratedGreeting(generation.content)
      if (!text) throw Object.assign(new Error('模型没有生成可发布文案'), { code: 'EMPTY_GENERATED_GREETING' })
    } catch (error) {
      const errorCode = String(error?.code || 'LLM_GENERATION_FAILED')
      if (db) {
        await writeSetting(
          db,
          lastRunKey,
          JSON.stringify({ at: Date.now(), ok: false, period, mode: generationMode, stage: 'generation', error: errorCode }),
          'automation',
        ).catch(() => {})
      }
      const status = errorCode === 'MISSING_DEEPSEEK_API_KEY' ? 503 : 502
      return Response.json(
        { ok: false, error: errorCode, detail: error?.message || 'DeepSeek 文案生成失败。', period, mode: generationMode },
        { status },
      )
    }
  } else {
    // 模板以后台 morning_greeting_templates 为准，按“日期 + 时段”稳定随机选一条；
    // 表不可用或为空时回退代码默认池。
    let pickedTemplate = null
    if (db) {
      try {
        pickedTemplate = pickDailyGreetingTemplate(await listEnabledMorningGreetingTexts(db, period), { period })
      } catch {
        pickedTemplate = null
      }
    }
    text = buildDailyGreeting({ period, template: pickedTemplate })
  }
  if (!greetingWithinLimit(text)) {
    if (db) {
      await writeSetting(
        db,
        lastRunKey,
        JSON.stringify({ at: Date.now(), ok: false, period, mode: generationMode, stage: 'validation', error: 'TEXT_TOO_LONG' }),
        'automation',
      ).catch(() => {})
    }
    return Response.json({ ok: false, error: 'TEXT_TOO_LONG', period, mode: generationMode }, { status: 400 })
  }

  const result = await publishXPost(text, { credentials: getXCredentials(env) })
  if (!result.ok) {
    if (db) {
      await writeSetting(
        db,
        lastRunKey,
        JSON.stringify({ at: Date.now(), ok: false, period, mode: generationMode, stage: 'publish', error: result.error }),
        'automation',
      ).catch(() => {})
    }
    return Response.json(result, { status: result.status })
  }

  if (db) {
    const run = JSON.stringify({
      at: Date.now(),
      ok: true,
      period,
      mode: generationMode,
      postId: result.post.id,
      postUrl: result.post.url,
      model: generation?.model || '',
      deepseekTaskId: generation?.taskId || '',
    })
    await Promise.all([
      writeSetting(db, lastRunKey, run, 'automation'),
      // 保留旧的“最新一次运行”键，供现有运维控制台继续展示。
      writeSetting(db, 'automation.x_morning_greeting.last_run', run, 'automation'),
    ]).catch(() => {})
  }
  return Response.json({
    ok: true,
    period,
    mode: generationMode,
    model: generation?.model || '',
    post: result.post,
    text,
  }, { status: 201 })
}
