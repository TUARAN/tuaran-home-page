import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import {
  recordPublicOpinionCollectError,
  runPublicOpinionCollect,
} from '../../../../lib/publicOpinion/collector.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-public-opinion-secret'

async function handle(request) {
  const env = getOptionalRequestContext()?.env || {}
  const requiredSecret = env.PUBLIC_OPINION_COLLECT_SECRET
  const suppliedSecret = request.headers.get(HEADER_SECRET) || ''

  if (!requiredSecret || suppliedSecret !== requiredSecret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!env.DB) {
    return Response.json({ error: 'D1 binding DB is missing' }, { status: 500 })
  }

  const log = (message) => console.log(`[public-opinion-collect] ${message}`)
  try {
    const stats = await runPublicOpinionCollect({ db: env.DB, log })
    return Response.json({ ok: true, ...stats })
  } catch (error) {
    log(`failed: ${error.message}`)
    await recordPublicOpinionCollectError(env.DB, error.message)
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
