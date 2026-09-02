import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { checkSiteHealth } from '../../../lib/siteHealth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const env = getOptionalRequestContext()?.env || {}
  const health = await checkSiteHealth(env)
  return Response.json(health, {
    status: health.healthy ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  })
}
