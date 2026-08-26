import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { runQuoteAutomation } from '../../../../lib/quoteAutomation'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function safeEqual(left, right) {
  const a = String(left || '')
  const b = String(right || '')
  if (a.length !== b.length) return false
  let diff = 0
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index)
  return diff === 0
}

async function handle(request) {
  const env = getOptionalRequestContext()?.env || {}
  const configuredSecrets = [
    env.QUOTE_GENERATION_SECRET,
    env.WEEKLY_SUMMARY_SECRET,
    env.PUBLIC_OPINION_COLLECT_SECRET,
    process.env.QUOTE_GENERATION_SECRET,
  ].map((value) => String(value || '').trim()).filter(Boolean)
  const suppliedSecret = request.headers.get('x-quote-generation-secret') || ''

  if (!configuredSecrets.length) {
    return Response.json({
      ok: false,
      error: 'QUOTE_GENERATION_SECRET_NOT_CONFIGURED',
      detail: '请配置 QUOTE_GENERATION_SECRET（可回退 WEEKLY_SUMMARY_SECRET / PUBLIC_OPINION_COLLECT_SECRET）。',
    }, { status: 503 })
  }
  if (!configuredSecrets.some((secret) => safeEqual(secret, suppliedSecret))) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.DB) return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })

  const params = new URL(request.url).searchParams
  try {
    const result = await runQuoteAutomation({
      db: env.DB,
      env,
      force: params.get('force') === '1' || params.get('force') === 'true',
    })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('[quote-generation] failed:', error)
    return Response.json({ ok: false, error: String(error?.message || error).slice(0, 2000) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
