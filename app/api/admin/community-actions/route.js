import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import {
  COMMUNITY_ACTION_SECRET_KEY,
  createCommunityActionSecret,
  presentCommunityActionCenter,
  readCommunityActionCenter,
} from '../../../../lib/community/communityActions'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function isMissingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

async function readSetting(db, key) {
  const row = await db.prepare('SELECT value FROM site_settings WHERE key = ?').bind(key).first()
  return String(row?.value || '')
}

async function writeSetting(db, key, value, actor) {
  await db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       updated_by = excluded.updated_by`,
  ).bind(key, value, Date.now(), actor).run()
}

async function ensureSecret(db, actor) {
  const existing = await readSetting(db, COMMUNITY_ACTION_SECRET_KEY)
  if (existing) return existing
  const secret = createCommunityActionSecret()
  await writeSetting(db, COMMUNITY_ACTION_SECRET_KEY, secret, actor)
  return secret
}

export async function GET(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  try {
    const secret = await ensureSecret(db, auth.user?.login || 'owner')
    const center = await readCommunityActionCenter(db)
    return Response.json({ ok: true, secret, migrationRequired: '', ...center })
  } catch (error) {
    if (!isMissingTable(error)) throw error
    let secret = ''
    try {
      secret = await ensureSecret(db, auth.user?.login || 'owner')
    } catch (secretError) {
      if (!isMissingTable(secretError)) throw secretError
    }
    return Response.json({
      ok: true,
      secret,
      migrationRequired: '请先应用数据库迁移 0109_community_actions.sql。',
      ...presentCommunityActionCenter(),
    })
  }
}

export async function POST(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  let body = null
  try {
    body = await req.json()
  } catch {
    body = null
  }
  if (body?.action !== 'regenerate-secret') {
    return Response.json({ ok: false, error: 'UNKNOWN_ACTION' }, { status: 400 })
  }
  const secret = createCommunityActionSecret()
  await writeSetting(db, COMMUNITY_ACTION_SECRET_KEY, secret, auth.user?.login || 'owner')
  return Response.json({ ok: true, secret })
}
