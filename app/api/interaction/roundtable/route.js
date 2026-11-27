import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getR2 } from '../../../../lib/db/r2'
import { handleRoundtableGet } from '../../../../lib/interaction/roundtable/http.js'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const env = getOptionalRequestContext()?.env || {}
    return await handleRoundtableGet(request, {
      media: getR2(),
      contentFeed: env.CONTENT_FEED || null,
    })
  } catch {
    return Response.json({ error: '名录暂时无法加载，请稍后重试' }, { status: 503 })
  }
}