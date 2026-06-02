import { getD1 } from '../../../lib/d1'
import { getPrivateVaultUser } from '../../../lib/privateVaultAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '长期罗盘需要部署环境（Cloudflare D1）才能读取。' },
    { status: 503 }
  )
}

function serializeRow(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.record_kind,
    payload: JSON.parse(row.encrypted_payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getDb() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    const principal = await getPrivateVaultUser(req)
    if (principal.status === 401) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    if (principal.status === 403) return Response.json({ error: 'FORBIDDEN' }, { status: 403 })

    const db = await getDb()
    if (!db) return dbUnavailableResponse()

    const result = await db
      .prepare(
        `SELECT id, record_kind, encrypted_payload, created_at, updated_at
         FROM private_records
         WHERE user_id = ?1 AND deleted_at IS NULL
         ORDER BY updated_at DESC
         LIMIT 200`
      )
      .bind(String(principal.user.id))
      .all()

    return Response.json({
      user: {
        id: principal.user.id,
        name: principal.user.name,
        login: principal.user.login,
        image: principal.user.image,
      },
      items: (result?.results || []).map(serializeRow),
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

// 写路径已下线：长期罗盘改为只读，新增/编辑/删除统一通过本地 wrangler 直连 D1。
export async function POST() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}

export async function PATCH() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}

export async function DELETE() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}
