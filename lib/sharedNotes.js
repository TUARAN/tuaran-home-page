import { getD1 } from './d1'
import { isValidEnvelope } from './longCompass/crypto'

/**
 * 端到端加密分享笔记的 D1 数据层。
 *
 * 设计原则：
 *  - 服务器永远只见到密文信封 envelope（JSON 字符串），不见明文，也不见密码
 *  - slug 是随机字符串，作为公开 URL id；不可枚举
 *  - 站长可改/删 envelope（重新加密上传）；任何人凭 slug 都能 GET 拿到密文，
 *    但没密码就解不开
 *
 * 注意：本文件本身不做权限校验，调用方（API route）负责 owner gate。
 */

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

const SLUG_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789' // 去掉易混淆字符 l/o/0/1
const SLUG_LENGTH = 10

export function generateSlug() {
  const bytes = crypto.getRandomValues(new Uint8Array(SLUG_LENGTH))
  let out = ''
  for (let i = 0; i < SLUG_LENGTH; i += 1) {
    out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length]
  }
  return out
}

export function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]{6,32}$/.test(slug)
}

/** 列出所有分享（管理面板用，含元数据但不含明文）。 */
export async function listSharedNotes() {
  const db = dbOrNull()
  if (!db) return []
  try {
    const result = await db
      .prepare(
        `SELECT slug, title, created_at, updated_at, expires_at, view_count, last_viewed_at, created_by
         FROM shared_notes
         ORDER BY created_at DESC
         LIMIT 200`
      )
      .all()
    return result?.results || []
  } catch {
    return []
  }
}

/** 公共获取：拿到 envelope，但不暴露元数据外的东西。 */
export async function getSharedNote(slug) {
  if (!isValidSlug(slug)) return null
  const db = dbOrNull()
  if (!db) return null
  try {
    const row = await db
      .prepare(
        'SELECT slug, title, envelope, created_at, updated_at, expires_at, view_count FROM shared_notes WHERE slug = ?1'
      )
      .bind(slug)
      .first()
    if (!row) return null
    if (row.expires_at && Date.now() > row.expires_at) return { expired: true }
    return row
  } catch {
    return null
  }
}

/** 异步把浏览计数 +1，失败不抛错（防分析压力，可后续替成 KV）。 */
export async function bumpViewCount(slug) {
  if (!isValidSlug(slug)) return
  const db = dbOrNull()
  if (!db) return
  try {
    await db
      .prepare(
        'UPDATE shared_notes SET view_count = view_count + 1, last_viewed_at = ?2 WHERE slug = ?1'
      )
      .bind(slug, Date.now())
      .run()
  } catch {
    /* ignore */
  }
}

export async function createSharedNote({ envelope, title, expiresInDays, createdBy }) {
  if (!isValidEnvelope(envelope)) return { ok: false, status: 400, error: 'INVALID_ENVELOPE' }
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }

  const now = Date.now()
  const expiresAt =
    Number.isInteger(expiresInDays) && expiresInDays > 0
      ? now + expiresInDays * 24 * 60 * 60 * 1000
      : null
  const slug = generateSlug()
  const titleStr = String(title || '').slice(0, 200)

  try {
    await db
      .prepare(
        `INSERT INTO shared_notes (slug, title, envelope, created_at, updated_at, expires_at, created_by)
         VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6)`
      )
      .bind(slug, titleStr, JSON.stringify(envelope), now, expiresAt, createdBy || null)
      .run()
    return { ok: true, slug, title: titleStr, created_at: now, expires_at: expiresAt }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

export async function updateSharedNote({ slug, envelope, title, expiresInDays }) {
  if (!isValidSlug(slug)) return { ok: false, status: 400, error: 'INVALID_SLUG' }
  if (!isValidEnvelope(envelope)) return { ok: false, status: 400, error: 'INVALID_ENVELOPE' }
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }
  const now = Date.now()
  const expiresAt =
    expiresInDays === null
      ? null
      : Number.isInteger(expiresInDays) && expiresInDays > 0
      ? now + expiresInDays * 24 * 60 * 60 * 1000
      : undefined
  try {
    if (expiresAt === undefined) {
      await db
        .prepare(
          'UPDATE shared_notes SET envelope = ?2, title = ?3, updated_at = ?4 WHERE slug = ?1'
        )
        .bind(slug, JSON.stringify(envelope), String(title || '').slice(0, 200), now)
        .run()
    } else {
      await db
        .prepare(
          'UPDATE shared_notes SET envelope = ?2, title = ?3, updated_at = ?4, expires_at = ?5 WHERE slug = ?1'
        )
        .bind(slug, JSON.stringify(envelope), String(title || '').slice(0, 200), now, expiresAt)
        .run()
    }
    return { ok: true, slug, updated_at: now }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_WRITE_FAILED', detail: String(error?.message || error) }
  }
}

export async function deleteSharedNote(slug) {
  if (!isValidSlug(slug)) return { ok: false, status: 400, error: 'INVALID_SLUG' }
  const db = dbOrNull()
  if (!db) return { ok: false, status: 503, error: 'DB_UNAVAILABLE' }
  try {
    await db.prepare('DELETE FROM shared_notes WHERE slug = ?1').bind(slug).run()
    return { ok: true, slug }
  } catch (error) {
    return { ok: false, status: 500, error: 'DB_DELETE_FAILED', detail: String(error?.message || error) }
  }
}
