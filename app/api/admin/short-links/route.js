import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { validatePublicHttpUrl } from '../../../../lib/abuseControls'
import { getD1 } from '../../../../lib/d1'
import {
  createOrReuseShortLink,
  deleteShortLink,
  getShortLinkStats,
  listShortLinks,
  normalizeUrl,
  sanitizeText,
} from '../../../../lib/shortLinks'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function dbUnavailableResponse() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '短链管理需要 Cloudflare D1 绑定。' },
    { status: 503 }
  )
}

function getDb() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = getDb()
  if (!db) return dbUnavailableResponse()

  const { searchParams } = new URL(req.url)
  const items = await listShortLinks(db, {
    q: searchParams.get('q') || '',
    limit: Number(searchParams.get('limit')) || 200,
  })
  const stats = await getShortLinkStats(db)
  return Response.json({ items, stats })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body = null
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const urlResult = normalizeUrl(body?.url ?? body?.original)
  if (!urlResult.ok) return Response.json({ error: urlResult.error }, { status: 400 })

  const publicUrlResult = validatePublicHttpUrl(urlResult.url)
  if (!publicUrlResult.ok) return Response.json({ error: publicUrlResult.error }, { status: 400 })

  const db = getDb()
  if (!db) return dbUnavailableResponse()

  const result = await createOrReuseShortLink(db, req, {
    original: urlResult.url,
    title: sanitizeText(body?.title, 160),
    source: 'manual',
    userId: guard.user?.id || 'owner',
  })
  if (result.error) return Response.json({ error: result.error }, { status: 500 })
  return Response.json({ item: result.item, reused: result.reused }, { status: result.reused ? 200 : 201 })
}

export async function DELETE(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: 'INVALID_ID' }, { status: 400 })
  }

  const db = getDb()
  if (!db) return dbUnavailableResponse()

  await deleteShortLink(db, id)
  return Response.json({ ok: true, id })
}
