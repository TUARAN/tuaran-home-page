import { getD1 } from '../../../../lib/d1'
import { getSecrets, getUserFromRequest } from '../../../../lib/edgeSession'
import { getOrIssueGuest } from '../../../../lib/guestSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function json(data, status = 200, setCookie = null) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'Vary': 'Cookie',
    'X-Content-Type-Options': 'nosniff',
  })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return new Response(JSON.stringify(data), { status, headers })
}

// This endpoint returns only the caller's verified identity. It does not accept
// a user ID, expose the signing key, or enable cross-origin browser reads.
export async function GET(req) {
  try {
    if (!getSecrets().sessionSecret) return json({ error: 'AUTH_UNAVAILABLE' }, 503)
    const db = getD1()
    if (!db) return json({ error: 'AUTH_UNAVAILABLE' }, 503)
    const user = await getUserFromRequest(req)
    if (user?.id) {
      const row = await db.prepare('SELECT role FROM site_users WHERE platform_id = ?1 OR id = ?1 LIMIT 1')
        .bind(String(user.id)).first()
      if (row?.role === 'blocked') return json({ error: 'USER_BLOCKED' }, 403)
      return json({ version: 1, userId: String(user.id), isGuest: false, name: String(user.name || user.login || '已登录用户') })
    }
    const guest = await getOrIssueGuest(req)
    if (!guest?.gid) return json({ error: 'AUTH_UNAVAILABLE' }, 503)
    return json({ version: 1, userId: `guest:${guest.gid}`, isGuest: true, name: '游客' }, 200, guest.setCookie)
  } catch {
    return json({ error: 'AUTH_UNAVAILABLE' }, 503)
  }
}
