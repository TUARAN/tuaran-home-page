import {
  cookieNames,
  getSecrets,
  parseCookies,
  verifySession,
} from '../../../../lib/edgeSession'
import { getD1 } from '../../../../lib/d1'
import { getD1AdminSnapshot } from '../../../../lib/dbAdmin'
import { isOwnerUser } from '../../../../lib/ownerAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function getOwnerOrReject(req) {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) return { ok: false, response: Response.json({ error: 'MISSING_AUTH_CONFIG' }, { status: 500 }) }
  const cookies = parseCookies(req)
  const token = cookies[cookieNames.session]
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null
  if (!user) return { ok: false, response: Response.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 }) }
  if (!isOwnerUser(user)) return { ok: false, response: Response.json({ error: 'NOT_OWNER' }, { status: 403 }) }
  return { ok: true, user }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db = null
  try {
    db = getD1()
  } catch (error) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      error: 'DB_UNAVAILABLE',
      message: '当前运行环境没有 Cloudflare D1 绑定 DB。本地开发需要通过 Pages/Workers 环境或 wrangler 绑定后才能读取。',
      detail: String(error?.message || error),
    })
  }

  try {
    return Response.json(await getD1AdminSnapshot(db))
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'DB_SNAPSHOT_FAILED',
        message: '数据库状态快照读取失败。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}
