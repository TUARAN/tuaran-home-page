import { getD1 } from '../../../lib/d1'
import { RESEARCH_ENTRY_KEY_SET } from '../../../lib/research/catalog'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CATEGORY_SET = new Set(['companies', 'topics'])
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/i
const MAX_KEYS = 100
const HIT_WINDOW_MS = 60 * 60 * 1000
const HIT_RETENTION_MS = 8 * 24 * 60 * 60 * 1000

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

function getClientIp(req) {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : ''
}

async function sha256(input) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function getVisitorHash(req) {
  const ip = getClientIp(req)
  const ua = req.headers.get('user-agent') || ''
  const acceptLanguage = req.headers.get('accept-language') || ''
  return sha256([ip, ua.slice(0, 160), acceptLanguage.slice(0, 80)].join('|'))
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
    .filter((item) => RESEARCH_ENTRY_KEY_SET.has(item.key))
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
  const entryKey = `${category}/${slug}`
  if (!RESEARCH_ENTRY_KEY_SET.has(entryKey)) {
    return Response.json({ error: 'RESEARCH_ENTRY_NOT_FOUND' }, { status: 404 })
  }

  let db
  try {
    db = getD1()
  } catch {
    return dbUnavailable()
  }

  try {
    const now = Date.now()
    const bucket = Math.floor(now / HIT_WINDOW_MS)
    const visitorHash = await getVisitorHash(req)
    const hitKey = `${entryKey}:${visitorHash}:${bucket}`
    const hit = await db
      .prepare(
        `INSERT OR IGNORE INTO research_pv_hits (hit_key, category, slug, visitor_hash, bucket, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(hitKey, category, slug, visitorHash, bucket, now)
      .run()

    if ((hit?.meta?.changes || 0) === 0) {
      const current = await db
        .prepare(
          `SELECT pv
           FROM research_pv
           WHERE category = ?1 AND slug = ?2`,
        )
        .bind(category, slug)
        .first()
      return Response.json({
        key: entryKey,
        pv: Math.max(0, Number(current?.pv) || 0),
        counted: false,
      })
    }

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

    await db
      .prepare(
        `DELETE FROM research_pv_hits
         WHERE created_at < ?1`,
      )
      .bind(now - HIT_RETENTION_MS)
      .run()

    return Response.json({
      key: entryKey,
      pv: Math.max(0, Number(row?.pv) || 0),
      counted: true,
    })
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
