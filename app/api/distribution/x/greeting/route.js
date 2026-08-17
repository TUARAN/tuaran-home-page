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
  const text = buildDailyGreeting({ period, template: pickedTemplate })
  if (!greetingWithinLimit(text)) {
    return Response.json({ ok: false, error: 'TEXT_TOO_LONG' }, { status: 400 })
  }

  const result = await publishXPost(text, { credentials: getXCredentials(env) })
  if (!result.ok) {
    if (db) {
      await writeSetting(
        db,
        lastRunKey,
        JSON.stringify({ at: Date.now(), ok: false, period, error: result.error }),
        'automation',
      ).catch(() => {})
    }
    return Response.json(result, { status: result.status })
  }

  if (db) {
    const run = JSON.stringify({ at: Date.now(), ok: true, period, postId: result.post.id, postUrl: result.post.url })
    await Promise.all([
      writeSetting(db, lastRunKey, run, 'automation'),
      // 保留旧的“最新一次运行”键，供现有运维控制台继续展示。
      writeSetting(db, 'automation.x_morning_greeting.last_run', run, 'automation'),
    ]).catch(() => {})
  }
  return Response.json({ ok: true, period, post: result.post, text }, { status: 201 })
}
