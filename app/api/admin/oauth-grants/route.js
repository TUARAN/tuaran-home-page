import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { MCP_ARTICLES_SCOPE, mcpArticlesResource, oauthBaseUrl } from '../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function activeGrants(db) {
  const result = await db
    .prepare(
      `SELECT c.user_id, c.client_id, oc.client_name, c.resource, c.scope, c.granted_at,
              MAX(a.expires_at) AS access_expires_at
       FROM oauth_consents c
       JOIN oauth_clients oc ON oc.client_id = c.client_id
       LEFT JOIN oauth_access_tokens a
         ON a.user_id = c.user_id AND a.client_id = c.client_id
        AND a.resource = c.resource AND a.revoked_at IS NULL
       WHERE c.revoked_at IS NULL
       GROUP BY c.user_id, c.client_id, oc.client_name, c.resource, c.scope, c.granted_at
       ORDER BY c.granted_at DESC`
    )
    .all()
  return result?.results || []
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  try {
    const db = getD1()
    const [grants, clientsResult] = await Promise.all([
      activeGrants(db),
      db.prepare('SELECT client_id, client_name, created_at FROM oauth_clients ORDER BY client_name, created_at DESC').all(),
    ])
    return Response.json(
      { status: 'ok', grants, clients: clientsResult?.results || [] },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    return Response.json(
      { status: 'error', error: 'OAUTH_GRANTS_READ_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }
  const userId = clean(body?.userId)
  const clientId = clean(body?.clientId)
  if (!userId || !clientId) return Response.json({ error: 'INVALID_GRANT' }, { status: 400 })

  try {
    const db = getD1()
    const [user, client] = await Promise.all([
      db.prepare('SELECT platform_id, id FROM site_users WHERE platform_id = ?1 OR id = ?1 LIMIT 1').bind(userId).first(),
      db.prepare('SELECT client_id FROM oauth_clients WHERE client_id = ?1 LIMIT 1').bind(clientId).first(),
    ])
    if (!user) return Response.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    if (!client) return Response.json({ error: 'CLIENT_NOT_FOUND' }, { status: 404 })

    const canonicalUserId = String(user.platform_id || user.id)
    const resource = mcpArticlesResource(oauthBaseUrl(req))
    const now = Date.now()
    await db.batch([
      db.prepare(
        `INSERT INTO oauth_consents (user_id, client_id, resource, scope, granted_at, revoked_at)
         VALUES (?1, ?2, ?3, ?4, ?5, NULL)
         ON CONFLICT(user_id, client_id, resource) DO UPDATE SET
           scope = excluded.scope, granted_at = excluded.granted_at, revoked_at = NULL`
      ).bind(canonicalUserId, clientId, resource, MCP_ARTICLES_SCOPE, now),
      db.prepare(
        `INSERT INTO oauth_audit_events (id, event_type, user_id, client_id, resource, detail, created_at)
         VALUES (?1, 'authorization_granted_by_admin', ?2, ?3, ?4, ?5, ?6)`
      ).bind(crypto.randomUUID(), canonicalUserId, clientId, resource, MCP_ARTICLES_SCOPE, now),
    ])
    return Response.json({ ok: true, grants: await activeGrants(db) })
  } catch (error) {
    return Response.json(
      { error: 'OAUTH_GRANT_WRITE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const url = new URL(req.url)
  const userId = clean(url.searchParams.get('user_id'))
  const clientId = clean(url.searchParams.get('client_id'))
  if (!userId || !clientId) return Response.json({ error: 'INVALID_GRANT' }, { status: 400 })

  try {
    const db = getD1()
    const existing = await db
      .prepare('SELECT resource FROM oauth_consents WHERE user_id = ?1 AND client_id = ?2 AND revoked_at IS NULL LIMIT 1')
      .bind(userId, clientId)
      .first()
    if (!existing) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

    const now = Date.now()
    await db.batch([
      db.prepare('UPDATE oauth_consents SET revoked_at = ?1 WHERE user_id = ?2 AND client_id = ?3 AND revoked_at IS NULL').bind(now, userId, clientId),
      db.prepare('UPDATE oauth_access_tokens SET revoked_at = ?1 WHERE user_id = ?2 AND client_id = ?3 AND revoked_at IS NULL').bind(now, userId, clientId),
      db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE user_id = ?2 AND client_id = ?3 AND revoked_at IS NULL').bind(now, userId, clientId),
      db.prepare(
        `INSERT INTO oauth_audit_events (id, event_type, user_id, client_id, resource, detail, created_at)
         VALUES (?1, 'consent_revoked_by_admin', ?2, ?3, ?4, '', ?5)`
      ).bind(crypto.randomUUID(), userId, clientId, existing.resource || null, now),
    ])
    return Response.json({ ok: true, grants: await activeGrants(db) })
  } catch (error) {
    return Response.json(
      { error: 'OAUTH_GRANT_DELETE_FAILED', detail: String(error?.message || error) },
      { status: 500 }
    )
  }
}
