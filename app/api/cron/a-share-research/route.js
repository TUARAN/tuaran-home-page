import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { runAShareDaily } from '../../../../lib/aShareResearch'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-a-share-secret'

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
  const requiredSecret = String(
    env.A_SHARE_COLLECT_SECRET
      || env.WEEKLY_SUMMARY_SECRET
      || env.PUBLIC_OPINION_COLLECT_SECRET
      || process.env.A_SHARE_COLLECT_SECRET
      || '',
  ).trim()
  const suppliedSecret = request.headers.get(HEADER_SECRET) || ''

  if (!requiredSecret) {
    return Response.json(
      {
        ok: false,
        error: 'A_SHARE_COLLECT_SECRET_NOT_CONFIGURED',
        detail: '请先在 Cloudflare Pages 环境变量配置 A_SHARE_COLLECT_SECRET（与 GitHub 仓库 Secret 同值）。',
      },
      { status: 503 },
    )
  }
  if (!safeEqual(suppliedSecret, requiredSecret)) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })
  }

  const params = new URL(request.url).searchParams
  const forceSync = params.get('force') === '1' || params.get('force') === 'true'
  try {
    const result = await runAShareDaily({ db: env.DB, env, forceSync })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    console.error('[a-share-research] failed:', error)
    return Response.json({ ok: false, error: String(error?.message || error).slice(0, 2000) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
