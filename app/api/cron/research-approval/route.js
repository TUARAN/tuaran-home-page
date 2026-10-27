import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { safeEqual } from '../../../../lib/auth/ownerAuth'
import { runResearchAutoPublication } from '../../../../lib/research/researchAutoPublication'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const env = getOptionalRequestContext()?.env || {}
  const secrets = [env.RESEARCH_APPROVAL_SECRET, env.A_SHARE_COLLECT_SECRET, env.PUBLIC_OPINION_COLLECT_SECRET, process.env.RESEARCH_APPROVAL_SECRET]
    .map((value) => String(value || '').trim()).filter(Boolean)
  if (!secrets.length) return Response.json({ ok: false, error: 'RESEARCH_APPROVAL_SECRET_NOT_CONFIGURED' }, { status: 503 })
  const supplied = request.headers.get('x-research-approval-secret') || ''
  if (!supplied || !secrets.some((secret) => safeEqual(supplied, secret))) {
    return Response.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  if (!env.DB) return Response.json({ ok: false, error: 'D1 binding DB is missing' }, { status: 500 })
  try {
    const result = await runResearchAutoPublication(env.DB, env)
    return Response.json(result, { status: result.ok ? 200 : 500 })
  } catch (error) {
    console.error('[research-approval] failed:', error)
    return Response.json({ ok: false, error: String(error?.message || error).slice(0, 500) }, { status: 500 })
  }
}
