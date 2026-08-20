import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { getD1 } from '../../../../../lib/d1'
import { runEngagementBot } from '../../../../../lib/engagementBotRun'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function POST(request) {
  const auth = await getOwnerOrReject(request)
  if (!auth.ok) return auth.response
  const db = dbOrNull()
  if (!db) return Response.json({ error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  try {
    const result = await runEngagementBot({
      db,
      env: getOptionalRequestContext()?.env,
      triggeredBy: 'admin',
      force: body?.force !== false,
    })
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error?.code || error?.message || error).slice(0, 300) },
      { status: 500 }
    )
  }
}
