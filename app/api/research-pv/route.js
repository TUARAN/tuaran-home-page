import { getD1 } from '../../../lib/d1'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CATEGORY_SET = new Set(['companies', 'topics'])
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/i
const MAX_KEYS = 100

function normalizeCategory(value) {
  const category = String(value || '').trim()
  return CATEGORY_SET.has(category) ? category : ''
}

function normalizeSlug(value) {
  const slug = String(value || '').trim().toLowerCase()
  return SLUG_RE.test(slug) ? slug : ''
}

function parseKey(key) {
  const [categoryRaw, slugRaw] = String(key || '').split('/')
  const category = normalizeCategory(categoryRaw)
  const slug = normalizeSlug(slugRaw)
  return category && slug ? { category, slug, key: `${category}/${slug}` } : null
}

function dbUnavailable() {
  return Response.json(
    { error: 'DB_UNAVAILABLE', message: '阅读量统计需要部署环境（Cloudflare D1）才能读写。' },
    { status: 503 },
  )
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const rawKeys = searchParams.get('keys') || ''
  const keys = rawKeys
    .split(',')
    .map(parseKey)
    .filter(Boolean)
    .slice(0, MAX_KEYS)

  if (!keys.length) {
    return Response.json({ counts: {} })
  }

  let db
  try {
    db = getD1()
  } catch {
    return dbUnavailable()
  }

  try {
    const statements = keys.map((item) =>
      db
        .prepare(
          `SELECT category, slug, pv
           FROM research_pv
           WHERE category = ?1 AND slug = ?2`,
        )
        .bind(item.category, item.slug),
    )
    const results = await db.batch(statements)
    const counts = {}
    keys.forEach((item, index) => {
      const row = results[index]?.results?.[0]
      counts[item.key] = Math.max(0, Number(row?.pv) || 0)
    })
    return Response.json({ counts })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const category = normalizeCategory(body?.category)
  const slug = normalizeSlug(body?.slug)
  if (!category || !slug) {
    return Response.json({ error: 'INVALID_RESEARCH_ENTRY' }, { status: 400 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return dbUnavailable()
  }

  try {
    const now = Date.now()
    const row = await db
      .prepare(
        `INSERT INTO research_pv (category, slug, pv, updated_at)
         VALUES (?1, ?2, 1, ?3)
         ON CONFLICT(category, slug)
         DO UPDATE SET pv = pv + 1, updated_at = excluded.updated_at
         RETURNING category, slug, pv`,
      )
      .bind(category, slug, now)
      .first()

    return Response.json({
      key: `${category}/${slug}`,
      pv: Math.max(0, Number(row?.pv) || 0),
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
