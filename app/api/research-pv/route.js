import { getD1 } from '../../../lib/d1'
import { RESEARCH_CATEGORIES } from '../../../lib/research/categories'
import { RESEARCH_ENTRY_KEY_SET } from '../../../lib/research/catalog'
import { CONTENT_PV_CATEGORIES, CONTENT_PV_KEY_SET } from '../../../lib/contentRegistry'
import { getUserFromRequest } from '../../../lib/edgeSession'
import { GUEST_USER_PREFIX, getOrIssueGuest, guestDisplayName } from '../../../lib/guestSession'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// 调研三类 + 自建统计的合成类型（资料 resource / 灵感 feed）
const CATEGORY_SET = new Set([...RESEARCH_CATEGORIES, ...CONTENT_PV_CATEGORIES])
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/i

/** 这个 key 是否在可统计白名单（调研条目或登记过的内容页） */
function isTrackableKey(key) {
  return RESEARCH_ENTRY_KEY_SET.has(key) || CONTENT_PV_KEY_SET.has(key)
}
const MAX_KEYS = 100
const HIT_WINDOW_MS = 60 * 60 * 1000
// 90 天分析需要完整事件；多留 30 天缓冲，避免边界日清理造成缺口。
const HIT_RETENTION_MS = 120 * 24 * 60 * 60 * 1000
const MAX_ATTR_LENGTH = 120

function cleanAttribution(value, max = MAX_ATTR_LENGTH) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max)
}

function referrerHost(value) {
  try {
    return new URL(cleanAttribution(value, 500)).hostname.toLowerCase().replace(/^www\./, '').slice(0, 160)
  } catch {
    return ''
  }
}

function sourceAttribution(req, body) {
  const source = cleanAttribution(body?.utmSource).toLowerCase()
  const medium = cleanAttribution(body?.utmMedium).toLowerCase()
  const campaign = cleanAttribution(body?.utmCampaign)
  const host = referrerHost(body?.referrer)
  const ownHost = (req.headers.get('host') || '').split(':')[0].toLowerCase().replace(/^www\./, '')

  if (source) return { source, medium: medium || 'campaign', campaign, referrerHost: host }
  if (!host) return { source: 'direct', medium: 'none', campaign: '', referrerHost: '' }
  if (host === ownHost || host.endsWith(`.${ownHost}`)) {
    return { source: 'internal', medium: 'navigation', campaign: '', referrerHost: host }
  }

  const search = [
    ['google.', 'google'], ['bing.com', 'bing'], ['baidu.com', 'baidu'],
    ['sogou.com', 'sogou'], ['so.com', '360'], ['duckduckgo.com', 'duckduckgo'],
  ].find(([needle]) => host.includes(needle))
  if (search) return { source: search[1], medium: 'organic', campaign: '', referrerHost: host }

  const social = [
    ['x.com', 'x'], ['twitter.com', 'x'], ['t.co', 'x'], ['weibo.com', 'weibo'],
    ['zhihu.com', 'zhihu'], ['wechat.com', 'wechat'], ['weixin.qq.com', 'wechat'],
    ['facebook.com', 'facebook'], ['linkedin.com', 'linkedin'], ['reddit.com', 'reddit'],
  ].find(([needle]) => host === needle || host.endsWith(`.${needle}`))
  if (social) return { source: social[1], medium: 'social', campaign: '', referrerHost: host }

  return { source: host, medium: 'referral', campaign: '', referrerHost: host }
}

async function visitorIdentity(req) {
  const user = await getUserFromRequest(req).catch(() => null)
  if (user?.id) {
    const userId = cleanAttribution(user.id, 180)
    return {
      userId,
      userProvider: cleanAttribution(user.provider || userId.split(':')[0] || 'account', 40),
      userName: cleanAttribution(user.name || user.login || '已登录用户', 100),
      visitorType: 'user',
      setCookie: null,
    }
  }

  const guest = await getOrIssueGuest(req).catch(() => null)
  if (guest?.gid) {
    return {
      userId: `${GUEST_USER_PREFIX}${guest.gid}`,
      userProvider: 'guest',
      userName: guestDisplayName(guest.gid),
      visitorType: 'guest',
      setCookie: guest.setCookie,
    }
  }
  return { userId: '', userProvider: '', userName: '匿名访客', visitorType: 'anonymous', setCookie: null }
}

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
    .filter((item) => isTrackableKey(item.key))
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
  if (!isTrackableKey(entryKey)) {
    return Response.json({ error: 'CONTENT_ENTRY_NOT_FOUND' }, { status: 404 })
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
    const identity = await visitorIdentity(req)
    const attribution = sourceAttribution(req, body)
    const hitKey = `${entryKey}:${visitorHash}:${bucket}`
    const hit = await db
      .prepare(
        `INSERT OR IGNORE INTO research_pv_hits
           (hit_key, category, slug, visitor_hash, bucket, created_at,
            user_id, user_provider, user_name, visitor_type, source, medium, campaign, referrer_host)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
      )
      .bind(
        hitKey, category, slug, visitorHash, bucket, now,
        identity.userId, identity.userProvider, identity.userName, identity.visitorType,
        attribution.source, attribution.medium, attribution.campaign, attribution.referrerHost,
      )
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
      const response = Response.json({
        key: entryKey,
        pv: Math.max(0, Number(current?.pv) || 0),
        counted: false,
      })
      if (identity.setCookie) response.headers.append('Set-Cookie', identity.setCookie)
      return response
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

    const response = Response.json({
      key: entryKey,
      pv: Math.max(0, Number(row?.pv) || 0),
      counted: true,
    })
    if (identity.setCookie) response.headers.append('Set-Cookie', identity.setCookie)
    return response
  } catch {
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
  }
}
