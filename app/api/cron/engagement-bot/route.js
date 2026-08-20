import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { runEngagementBot } from '../../../../lib/engagementBotRun'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-engagement-bot-secret'

function safeEqual(left, right) {
  const a = String(left || '')
  const b = String(right || '')
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return diff === 0
}

async function handle(request) {
  const env = getOptionalRequestContext()?.env || {}
  const configuredSecrets = [
    env.ENGAGEMENT_BOT_SECRET,
    env.WEEKLY_SUMMARY_SECRET,
    env.PUBLIC_OPINION_COLLECT_SECRET,
    process.env.ENGAGEMENT_BOT_SECRET,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  const suppliedSecret = request.headers.get(HEADER_SECRET) || ''

  if (!configuredSecrets.length) {
    return Response.json(
      {
        ok: false,
        error: 'ENGAGEMENT_BOT_SECRET_NOT_CONFIGURED',
        detail: '请先配置 ENGAGEMENT_BOT_SECRET（可回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET）。',
      },
      { status: 503 },
    )
  }
  if (!configuredSecrets.some((secret) => safeEqual(suppliedSecret, secret))) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })
  }

  try {
    const result = await runEngagementBot({
      db: env.DB,
      env,
      triggeredBy: 'cron',
      force: false,
    })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('[engagement-bot] failed:', error)
    return Response.json(
      { ok: false, error: String(error?.message || error).slice(0, 2000) },
      { status: 500 },
    )
  }
}

export const GET = handle
export const POST = handle
