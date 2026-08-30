import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { runCryptoDaily } from '../../../../lib/cryptoResearch'

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
  const secrets = [env.CRYPTO_RESEARCH_SECRET, env.A_SHARE_COLLECT_SECRET, env.PUBLIC_OPINION_COLLECT_SECRET, process.env.CRYPTO_RESEARCH_SECRET].map((value) => String(value || '').trim()).filter(Boolean)
  if (!secrets.length) return Response.json({ ok: false, error: 'CRYPTO_RESEARCH_SECRET_NOT_CONFIGURED' }, { status: 503 })
  if (!secrets.some((secret) => safeEqual(request.headers.get('x-crypto-research-secret') || '', secret))) return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  if (!env.DB) return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })
  try {
    const params = new URL(request.url).searchParams
    const result = await runCryptoDaily({ db: env.DB, env, forceSync: ['1', 'true'].includes(params.get('force')) })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('[crypto-research] failed:', error)
    const status = error?.status === 429 ? 429 : 500
    const retryAfterMs = status === 429 ? Math.max(1000, Number(error?.retryAfterMs) || 60_000) : undefined
    const headers = retryAfterMs ? { 'retry-after': String(Math.ceil(retryAfterMs / 1000)) } : undefined
    return Response.json(
      { ok: false, error: String(error?.message || error).slice(0, 2000), ...(retryAfterMs ? { retryAfterMs } : {}) },
      { status, headers },
    )
  }
}

export const GET = handle
export const POST = handle
