import { getD1 } from '../../../../lib/db/d1'
import { authenticatePlugin, exchangePairing } from '../../../../lib/x/workbench/pairingStore'
import { ingestItems } from '../../../../lib/x/workbench/radarStore'
import { getProfile, saveProfile } from '../workbenchStore'
import { claimDue, reportSchedule } from '../workbenchQueue'
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
// 专用令牌入口，不使用 Cookie；仅开放工作台白名单动作，无通用代理权限。
export async function POST(request) {
  try {
    const data = await request.json().catch(() => ({}))
    const db = getD1()
    let result
    if (data.action === 'pair') result = await exchangePairing(db, data.code)
    else {
      const identity = await authenticatePlugin(db, request)
      if (!identity) return Response.json({ error: 'UNAUTHENTICATED' }, { status: 401, headers })
      const userId = identity.user_id
      if (data.action === 'ingest') result = await ingestItems(db, userId, data.items)
      else if (data.action === 'profile.get') result = await getProfile(db, userId, data.handle)
      else if (data.action === 'profile.put') result = await saveProfile(db, userId, data.handle, data.profile)
      else if (data.action === 'claim') result = await claimDue(db, userId, data.handle)
      else if (data.action === 'report') result = await reportSchedule(db, userId, data)
      else result = { ok: false, status: 400, error: 'UNKNOWN_ACTION' }
    }
    const { status, ...body } = result
    return Response.json(body, { status: Number.isInteger(status) ? status : 200, headers })
  } catch {
    return Response.json({ error: 'WORKBENCH_UNAVAILABLE' }, { status: 503, headers })
  }
}
