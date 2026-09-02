import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { publicSiteStatus } from '../../../lib/siteStatusCore'
import { getSiteStatusBucket, readSiteStatus } from '../../../lib/siteStatusStore'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const env = getOptionalRequestContext()?.env || {}
  const bucket = getSiteStatusBucket(env)
  let status = null

  try {
    status = await readSiteStatus(bucket)
  } catch {
    // 公告存储异常不能阻断公开页面；健康端点会单独报告存储 binding 状态。
    status = null
  }

  return Response.json(publicSiteStatus(status), {
    headers: {
      'cache-control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=120',
    },
  })
}
