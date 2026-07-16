import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const db = getD1()
    const result = await db
      .prepare(
        `SELECT c.client_id, oc.client_name, c.resource, c.scope, c.granted_at,
                MAX(a.expires_at) AS access_expires_at
         FROM oauth_consents c
         JOIN oauth_clients oc ON oc.client_id = c.client_id
         LEFT JOIN oauth_access_tokens a
           ON a.user_id = c.user_id AND a.client_id = c.client_id
          AND a.resource = c.resource AND a.revoked_at IS NULL
         WHERE c.user_id = ?1 AND c.revoked_at IS NULL
         GROUP BY c.client_id, oc.client_name, c.resource, c.scope, c.granted_at
         ORDER BY c.granted_at DESC`
      )
      .bind(String(user.id))
      .all()
    return Response.json({ grants: result?.results || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ grants: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function DELETE(req) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (!user?.id) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const clientId = String(new URL(req.url).searchParams.get('client_id') || '').trim()
  if (!clientId) return Response.json({ error: 'INVALID_CLIENT' }, { status: 400 })
  try {
    const db = getD1()
    const now = Date.now()
    const resourceRows = await db
      .prepare('SELECT resource FROM oauth_consents WHERE user_id = ?1 AND client_id = ?2 AND revoked_at IS NULL')
      .bind(String(user.id), clientId)
      .all()
    const resources = resourceRows?.results || []
    if (!resources.length) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
    await db.batch([
      db.prepare('UPDATE oauth_consents SET revoked_at = ?1 WHERE user_id = ?2 AND client_id = ?3').bind(now, String(user.id), clientId),
      db.prepare('UPDATE oauth_access_tokens SET revoked_at = ?1 WHERE user_id = ?2 AND client_id = ?3 AND revoked_at IS NULL').bind(now, String(user.id), clientId),
      db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE user_id = ?2 AND client_id = ?3 AND revoked_at IS NULL').bind(now, String(user.id), clientId),
      db.prepare(
        `INSERT INTO oauth_audit_events (id, event_type, user_id, client_id, resource, detail, created_at)
         VALUES (?1, 'consent_revoked', ?2, ?3, ?4, '', ?5)`
      ).bind(crypto.randomUUID(), String(user.id), clientId, resources[0].resource || null, now),
    ])
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'OAUTH_STORAGE_UNAVAILABLE' }, { status: 503 })
  }
}
