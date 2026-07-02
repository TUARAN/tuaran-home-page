import { getD1 } from './d1'
import { listAllContent } from './contentPipeline'

/**
 * D1 内容索引（content_index 表）读写封装。
 *
 * 两类来源：
 *   - source='sync'  ：构建期统一内容管线（lib/contentPipeline.js）的 D1 镜像，后台一键同步
 *   - source='manual'：后台手工登记的条目，无需重新构建即可出现在列表面（发布不依赖构建）
 *
 * Edge 运行时使用；无 DB binding 时读接口返回空数组，调用方自行回落构建期数据。
 */

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function rowToContentEntry(row) {
  if (!row) return null
  return {
    contentKey: row.content_key,
    type: row.content_type,
    category: row.category,
    slug: row.slug,
    title: row.title || '',
    summary: row.summary || '',
    tags: parseJson(row.tags_json, []),
    href: row.href || '',
    date: row.date || '',
    status: row.status || 'published',
    source: row.source || 'sync',
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

const VALID_STATUS = new Set(['published', 'draft', 'retired'])
const VALID_TYPES = new Set(['research', 'article', 'resource', 'feed'])

/** 校验并归一手工/同步条目；不合法返回 { error }。 */
export function normalizeContentEntryInput(input, { source = 'manual' } = {}) {
  const contentKey = String(input?.contentKey || '').trim()
  const type = String(input?.type || '').trim()
  const title = String(input?.title || '').trim()
  const href = String(input?.href || '').trim()
  if (!contentKey || contentKey.length > 180) return { error: 'INVALID_CONTENT_KEY' }
  if (!VALID_TYPES.has(type)) return { error: 'INVALID_TYPE' }
  if (!title || title.length > 300) return { error: 'INVALID_TITLE' }
  if (!href || href.length > 600) return { error: 'INVALID_HREF' }
  if (!href.startsWith('/') && !href.startsWith('https://') && !href.startsWith('http://')) {
    return { error: 'INVALID_HREF' }
  }
  const status = VALID_STATUS.has(input?.status) ? input.status : 'published'
  const tags = Array.isArray(input?.tags)
    ? input.tags.map((t) => String(t || '').trim()).filter(Boolean).slice(0, 20)
    : []
  return {
    entry: {
      contentKey,
      type,
      category: String(input?.category || type).trim() || type,
      slug: String(input?.slug || contentKey.split(':').pop() || '').trim(),
      title,
      summary: String(input?.summary || '').trim().slice(0, 2000),
      tags,
      href,
      date: String(input?.date || '').trim().slice(0, 10),
      status,
      source,
    },
  }
}

export async function listContentIndex({ status = null, source = null, limit = 500 } = {}) {
  const db = dbOrNull()
  if (!db) return []
  const where = []
  const binds = []
  if (status) {
    where.push('status = ?')
    binds.push(status)
  }
  if (source) {
    where.push('source = ?')
    binds.push(source)
  }
  const sql = `SELECT * FROM content_index ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY date DESC, updated_at DESC LIMIT ?`
  const res = await db.prepare(sql).bind(...binds, Math.min(Math.max(1, limit), 1000)).all()
  return (res?.results || []).map(rowToContentEntry)
}

const UPSERT_SQL = `INSERT INTO content_index
    (content_key, content_type, category, slug, title, summary, tags_json, href, date, status, source, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(content_key) DO UPDATE SET
    content_type = excluded.content_type,
    category = excluded.category,
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    tags_json = excluded.tags_json,
    href = excluded.href,
    date = excluded.date,
    status = excluded.status,
    source = excluded.source,
    updated_at = excluded.updated_at`

function bindUpsert(db, entry, now) {
  return db
    .prepare(UPSERT_SQL)
    .bind(
      entry.contentKey,
      entry.type,
      entry.category,
      entry.slug,
      entry.title,
      entry.summary,
      JSON.stringify(entry.tags || []),
      entry.href,
      entry.date,
      entry.status,
      entry.source,
      now,
      now
    )
}

export async function upsertContentEntry(db, entry, { now = Date.now() } = {}) {
  await bindUpsert(db, entry, now).run()
}

/**
 * 一键同步：把构建期统一内容管线镜像进 D1（source='sync'）。
 * 手工条目（source='manual'）不受影响；同步条目按 content_key 覆盖更新。
 */
export async function syncBuildContentToD1() {
  const db = dbOrNull()
  if (!db) return { ok: false, error: 'NO_DB' }
  const entries = listAllContent()
  const now = Date.now()
  const statements = entries.map((entry) =>
    bindUpsert(db, { ...entry, status: 'published', source: 'sync' }, now)
  )
  // D1 batch：一次事务写入全部镜像，避免上百次网络往返
  const CHUNK = 50
  for (let i = 0; i < statements.length; i += CHUNK) {
    await db.batch(statements.slice(i, i + CHUNK))
  }
  return { ok: true, count: entries.length }
}

export async function deleteContentEntry(contentKey) {
  const db = dbOrNull()
  if (!db) return { ok: false, error: 'NO_DB' }
  await db.prepare('DELETE FROM content_index WHERE content_key = ?').bind(String(contentKey || '')).run()
  return { ok: true }
}
