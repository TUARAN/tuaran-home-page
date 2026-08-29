import { getD1 } from '../../../lib/d1'
import { BOOKMARK_CATEGORIES, summarizeBookmarks } from '../../../lib/bookmarkNavigation.mjs'
import { getPrivateVaultUser } from '../../../lib/privateVaultAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const CATEGORY_IDS = new Set(BOOKMARK_CATEGORIES.map((category) => category.id))
const MAX_BOOKMARKS = 3000
const MAX_SOURCE_NAME = 160
// GitHub / Google 等站长登录方式可能对应不同 platform_id；授权已由 owner gate
// 完成，书签库使用稳定站点作用域，避免同一站长看到两份分叉数据。
const OWNER_BOOKMARK_SCOPE = 'site-owner'

class BookmarkImportError extends Error {}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

async function principalOrResponse(req) {
  const principal = await getPrivateVaultUser(req)
  if (principal.status === 401) return { response: json({ error: 'UNAUTHORIZED' }, 401) }
  if (principal.status === 403) return { response: json({ error: 'FORBIDDEN' }, 403) }
  return { principal }
}

function getDb() {
  try { return getD1() } catch { return null }
}

function parseJson(value, fallback) {
  try { return JSON.parse(value) } catch { return fallback }
}

function serializeItem(row) {
  return {
    id: row.bookmark_id,
    title: row.title,
    url: row.url,
    domain: row.domain,
    folderPath: parseJson(row.folder_path, []),
    addedAt: row.added_at,
    category: row.category,
    duplicateOf: row.duplicate_of,
    riskFlags: parseJson(row.risk_flags, []),
  }
}

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function validateEntries(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_BOOKMARKS) {
    throw new BookmarkImportError(`书签数量须在 1–${MAX_BOOKMARKS} 条之间。`)
  }
  const ids = new Set()
  const urlById = new Map()
  return input.map((raw, index) => {
    const id = text(raw?.id, 64)
    const title = text(raw?.title, 500)
    const url = text(raw?.url, 4000)
    if (!id || ids.has(id)) throw new BookmarkImportError(`第 ${index + 1} 条书签 ID 缺失或重复。`)
    ids.add(id)
    if (!title || !url) throw new BookmarkImportError(`第 ${index + 1} 条书签缺少标题或 URL。`)
    let parsed
    try { parsed = new URL(url) } catch { throw new BookmarkImportError(`第 ${index + 1} 条书签 URL 无效。`) }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new BookmarkImportError(`第 ${index + 1} 条书签协议不受支持。`)
    const category = text(raw?.category, 40)
    if (!CATEGORY_IDS.has(category)) throw new BookmarkImportError(`第 ${index + 1} 条书签分类无效。`)
    const folderPath = Array.isArray(raw?.folderPath)
      ? raw.folderPath.map((part) => text(part, 240)).filter(Boolean).slice(0, 32)
      : []
    const riskFlags = Array.isArray(raw?.riskFlags)
      ? [...new Set(raw.riskFlags.map((flag) => text(flag, 60)).filter(Boolean))].slice(0, 12)
      : []
    const duplicateOf = text(raw?.duplicateOf, 64) || null
    if (duplicateOf && (!ids.has(duplicateOf) || urlById.get(duplicateOf) !== url)) {
      throw new BookmarkImportError(`第 ${index + 1} 条书签的重复关系无效。`)
    }
    const entry = {
      id, title, url,
      domain: text(raw?.domain, 253),
      folderPath,
      addedAt: text(raw?.addedAt, 32) || null,
      category,
      duplicateOf,
      riskFlags,
    }
    urlById.set(id, url)
    return entry
  })
}

function sameOrigin(req) {
  const origin = req.headers.get('origin')
  return !origin || origin === new URL(req.url).origin
}

export async function GET(req) {
  const auth = await principalOrResponse(req)
  if (auth.response) return auth.response
  const db = getDb()
  if (!db) return json({ error: 'DB_UNAVAILABLE', message: '书签导航需要 Cloudflare D1。' }, 503)

  try {
    const userId = OWNER_BOOKMARK_SCOPE
    const active = await db.prepare(
      `SELECT import_id, source_name, source_sha256, source_folder_count, total_count,
              unique_url_count, duplicate_count, category_counts, risk_counts, activated_at
       FROM bookmark_nav_imports
       WHERE user_id = ?1 AND status = 'active'
       LIMIT 1`
    ).bind(userId).first()

    if (!active) return json({ import: null, items: [], categories: BOOKMARK_CATEGORIES })

    const result = await db.prepare(
      `SELECT bookmark_id, title, url, domain, folder_path, added_at, category, duplicate_of, risk_flags
       FROM bookmark_nav_items
       WHERE user_id = ?1 AND import_id = ?2
       ORDER BY position ASC`
    ).bind(userId, active.import_id).all()

    return json({
      import: {
        id: active.import_id,
        sourceName: active.source_name,
        sourceSha256: active.source_sha256,
        sourceFolderCount: active.source_folder_count,
        total: active.total_count,
        uniqueUrls: active.unique_url_count,
        duplicateEntries: active.duplicate_count,
        categoryCounts: parseJson(active.category_counts, {}),
        risks: parseJson(active.risk_counts, {}),
        activatedAt: active.activated_at,
      },
      items: (result?.results || []).map(serializeItem),
      categories: BOOKMARK_CATEGORIES,
    })
  } catch {
    return json({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
}

export async function POST(req) {
  const auth = await principalOrResponse(req)
  if (auth.response) return auth.response
  if (!sameOrigin(req)) return json({ error: 'INVALID_ORIGIN' }, 403)
  const db = getDb()
  if (!db) return json({ error: 'DB_UNAVAILABLE', message: '书签导航需要 Cloudflare D1。' }, 503)

  let body
  try { body = await req.json() } catch { return json({ error: 'INVALID_JSON' }, 400) }

  try {
    const entries = validateEntries(body?.entries)
    const summary = summarizeBookmarks(entries)
    const sourceName = text(body?.sourceName, MAX_SOURCE_NAME) || 'chrome-bookmarks.html'
    const sourceSha256 = text(body?.sourceSha256, 64).toLowerCase()
    if (!/^[a-f0-9]{64}$/.test(sourceSha256)) return json({ error: 'INVALID_CHECKSUM' }, 400)
    const sourceFolderCount = Math.max(0, Math.min(10000, Number.parseInt(body?.sourceFolderCount, 10) || 0))
    const userId = OWNER_BOOKMARK_SCOPE

    const current = await db.prepare(
      `SELECT import_id FROM bookmark_nav_imports
       WHERE user_id = ?1 AND status = 'active' AND source_sha256 = ?2 LIMIT 1`
    ).bind(userId, sourceSha256).first()
    if (current) return json({ ok: true, unchanged: true, importId: current.import_id, summary })

    const importId = crypto.randomUUID()
    const now = Date.now()
    await db.prepare(
      `INSERT INTO bookmark_nav_imports
       (import_id, user_id, source_name, source_sha256, source_folder_count, total_count,
        unique_url_count, duplicate_count, category_counts, risk_counts, status, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'pending', ?11)`
    ).bind(
      importId, userId, sourceName, sourceSha256, sourceFolderCount, summary.total,
      summary.uniqueUrls, summary.duplicateEntries, JSON.stringify(summary.categoryCounts),
      JSON.stringify(summary.risks), now
    ).run()

    for (let offset = 0; offset < entries.length; offset += 50) {
      const chunk = entries.slice(offset, offset + 50)
      await db.batch(chunk.map((entry, chunkIndex) => db.prepare(
        `INSERT INTO bookmark_nav_items
         (import_id, bookmark_id, user_id, position, title, url, domain, folder_path,
          added_at, category, duplicate_of, risk_flags)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      ).bind(
        importId, entry.id, userId, offset + chunkIndex, entry.title, entry.url, entry.domain,
        JSON.stringify(entry.folderPath), entry.addedAt, entry.category, entry.duplicateOf,
        JSON.stringify(entry.riskFlags)
      )))
    }

    await db.batch([
      db.prepare(`UPDATE bookmark_nav_imports SET status = 'archived' WHERE user_id = ?1 AND status = 'active'`).bind(userId),
      db.prepare(`UPDATE bookmark_nav_imports SET status = 'active', activated_at = ?2 WHERE import_id = ?1 AND status = 'pending'`).bind(importId, Date.now()),
    ])

    return json({ ok: true, importId, summary }, 201)
  } catch (error) {
    if (error instanceof BookmarkImportError) return json({ error: 'INVALID_IMPORT', message: error.message }, 400)
    return json({ error: 'INTERNAL_SERVER_ERROR', message: '导入未完成，原书签版本仍然有效。' }, 500)
  }
}
