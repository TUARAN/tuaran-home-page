import { getSecrets } from './edgeSession'

export const SHORT_CODE_LENGTH = 7
const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const INSERT_RETRY = 4
const DEFAULT_USER_ID = 'site-share'
const CODE_RE = /^[A-Za-z0-9]{4,16}$/

export function isValidShortCode(code) {
  return CODE_RE.test(String(code || ''))
}

function genCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(SHORT_CODE_LENGTH))
  let s = ''
  for (let i = 0; i < SHORT_CODE_LENGTH; i += 1) {
    s += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return s
}

function normalizeHost(host) {
  return String(host || '').trim().toLowerCase().replace(/^www\./, '')
}

function getAllowedHosts(req) {
  const hosts = new Set()
  const reqHost = new URL(req.url).host
  if (reqHost) hosts.add(normalizeHost(reqHost))

  const { appUrl } = getSecrets()
  if (appUrl) {
    try {
      hosts.add(normalizeHost(new URL(appUrl).host))
    } catch {}
  }
  hosts.add('2aran.com')
  return hosts
}

export function getShortBase(req) {
  const { appUrl } = getSecrets()
  const base = appUrl || new URL(req.url).origin
  return base.replace(/\/+$/, '')
}

export function normalizeUrl(raw) {
  if (typeof raw !== 'string') return { ok: false, error: 'INVALID_URL' }
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > 2000) return { ok: false, error: 'INVALID_URL' }

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'INVALID_URL_PROTOCOL' }
    }
    if (url.username || url.password) {
      return { ok: false, error: 'URL_CREDENTIALS_NOT_ALLOWED' }
    }
    return { ok: true, url: url.toString(), parsed: url }
  } catch {
    return { ok: false, error: 'INVALID_URL' }
  }
}

export function isSameSiteUrl(req, parsedUrl) {
  if (!parsedUrl?.host) return false
  return getAllowedHosts(req).has(normalizeHost(parsedUrl.host))
}

export function sanitizeText(value, maxLength = 160) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

export async function getShortLinkByOriginal(db, original) {
  return db
    .prepare(
      `SELECT id, user_id, original, short, code, title, source, created_at, updated_at, click_count, last_clicked_at
       FROM short_links
       WHERE original = ?1
       ORDER BY created_at ASC
       LIMIT 1`
    )
    .bind(original)
    .first()
}

export async function createOrReuseShortLink(db, req, {
  original,
  title = '',
  source = 'share',
  userId = DEFAULT_USER_ID,
}) {
  const existing = await getShortLinkByOriginal(db, original)
  if (existing?.id) return { item: existing, reused: true }

  const now = Date.now()
  const shortBase = getShortBase(req)
  const cleanTitle = sanitizeText(title, 160)
  const cleanSource = sanitizeText(source, 32) || 'share'

  let inserted = null
  for (let attempt = 0; attempt < INSERT_RETRY && !inserted; attempt += 1) {
    const code = genCode()
    const shortUrl = `${shortBase}/s/${code}`
    try {
      inserted = await db
        .prepare(
          `INSERT INTO short_links (user_id, original, short, code, title, source, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
           RETURNING id, user_id, original, short, code, title, source, created_at, updated_at, click_count, last_clicked_at`
        )
        .bind(String(userId || DEFAULT_USER_ID), original, shortUrl, code, cleanTitle, cleanSource, now, now)
        .first()
    } catch (e) {
      const msg = String(e?.message || '')
      if (!msg.includes('UNIQUE')) throw e
    }
  }

  if (!inserted) return { error: 'CODE_COLLISION' }
  return { item: inserted, reused: false }
}

export async function listShortLinks(db, { q = '', limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200)
  const query = sanitizeText(q, 200)
  const like = `%${query}%`
  const sql = query
    ? `SELECT id, user_id, original, short, code, title, source, created_at, updated_at, click_count, last_clicked_at
       FROM short_links
       WHERE original LIKE ?1 OR short LIKE ?1 OR code LIKE ?1 OR title LIKE ?1 OR source LIKE ?1
       ORDER BY created_at DESC
       LIMIT ?2`
    : `SELECT id, user_id, original, short, code, title, source, created_at, updated_at, click_count, last_clicked_at
       FROM short_links
       ORDER BY created_at DESC
       LIMIT ?1`

  const stmt = db.prepare(sql)
  const result = query ? await stmt.bind(like, safeLimit).all() : await stmt.bind(safeLimit).all()
  return result?.results || []
}

export async function getShortLinkStats(db) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(click_count), 0) AS clicks,
              MAX(created_at) AS latest_created_at,
              MAX(last_clicked_at) AS latest_clicked_at
       FROM short_links`
    )
    .first()
  return {
    total: Number(row?.total) || 0,
    clicks: Number(row?.clicks) || 0,
    latestCreatedAt: row?.latest_created_at || null,
    latestClickedAt: row?.latest_clicked_at || null,
  }
}

export async function deleteShortLink(db, id) {
  await db.prepare('DELETE FROM short_links WHERE id = ?1').bind(id).run()
}

export async function resolveShortLink(db, code) {
  if (!isValidShortCode(code)) return null
  return db
    .prepare('SELECT id, original FROM short_links WHERE code = ?1 LIMIT 1')
    .bind(code)
    .first()
}

export async function bumpShortLinkClick(db, id) {
  await db
    .prepare(
      `UPDATE short_links
       SET click_count = COALESCE(click_count, 0) + 1,
           last_clicked_at = ?2
       WHERE id = ?1`
    )
    .bind(id, Date.now())
    .run()
}
