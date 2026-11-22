// 草稿与排期。云端只排队与记录，不执行任何写 X 的动作：
// 插件领取到期条目，在用户自己的 X 页面内执行，再回报结果。
import { weightedTextLength } from '../xDistribution.js'
import { accountKey } from './workbenchCore.js'

export const QUEUE_LIMITS = Object.freeze({ queued: 50, draftsPerAccount: 100, text: 280, minLeadMs: 60_000, claimTtlMs: 15 * 60_000 })

async function ownsAccount(db, userId, handle) {
  return Boolean(await db.prepare(
    "SELECT 1 AS ok FROM x_accounts WHERE user_id = ?1 AND handle = ?2 AND status = 'active'"
  ).bind(userId, handle).first())
}

function cleanText(value) {
  return String(value || '').replace(/\r\n?/g, '\n').trim()
}

async function gate(db, userId, rawHandle) {
  const handle = accountKey(rawHandle)
  if (!handle) return { error: { ok: false, status: 400, error: 'INVALID_HANDLE' } }
  if (!(await ownsAccount(db, userId, handle))) return { error: { ok: false, status: 404, error: 'ACCOUNT_NOT_BOUND' } }
  return { handle }
}

export async function listDrafts(db, userId, rawHandle) {
  const g = await gate(db, userId, rawHandle)
  if (g.error) return g.error
  const { results } = await db.prepare(
    'SELECT id, text, source_url, updated_at FROM x_drafts WHERE user_id = ?1 AND handle = ?2 ORDER BY updated_at DESC LIMIT 100'
  ).bind(userId, g.handle).all()
  return { ok: true, handle: g.handle, drafts: results || [] }
}

export async function saveDraft(db, userId, body, now = Date.now()) {
  const g = await gate(db, userId, body?.handle)
  if (g.error) return g.error
  const text = cleanText(body?.text)
  if (!text) return { ok: false, status: 400, error: 'TEXT_REQUIRED' }
  if (text.length > 5000) return { ok: false, status: 400, error: 'TEXT_TOO_LONG' }
  const sourceUrl = /^https:\/\/(x|twitter)\.com\//i.test(String(body?.sourceUrl || '')) ? String(body.sourceUrl).slice(0, 300) : ''
  if (body?.id) {
    const res = await db.prepare(
      'UPDATE x_drafts SET text = ?4, source_url = ?5, updated_at = ?6 WHERE id = ?1 AND user_id = ?2 AND handle = ?3'
    ).bind(String(body.id), userId, g.handle, text, sourceUrl, now).run()
    if (!res.meta?.changes) return { ok: false, status: 404, error: 'DRAFT_NOT_FOUND' }
    return { ok: true, id: String(body.id) }
  }
  const count = await db.prepare('SELECT COUNT(*) AS n FROM x_drafts WHERE user_id = ?1 AND handle = ?2').bind(userId, g.handle).first()
  if ((count?.n || 0) >= QUEUE_LIMITS.draftsPerAccount) return { ok: false, status: 403, error: 'DRAFT_LIMIT' }
  const id = crypto.randomUUID()
  await db.prepare(
    'INSERT INTO x_drafts (id, user_id, handle, text, source_url, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)'
  ).bind(id, userId, g.handle, text, sourceUrl, now).run()
  return { ok: true, id }
}

export async function deleteDraft(db, userId, id) {
  await db.prepare('DELETE FROM x_drafts WHERE id = ?1 AND user_id = ?2').bind(String(id || ''), userId).run()
  return { ok: true }
}

export async function listSchedules(db, userId, rawHandle) {
  const g = await gate(db, userId, rawHandle)
  if (g.error) return g.error
  const { results } = await db.prepare(
    `SELECT id, text, run_at, status, result FROM x_schedules
     WHERE user_id = ?1 AND handle = ?2 AND status IN ('queued', 'claimed') ORDER BY run_at LIMIT 100`
  ).bind(userId, g.handle).all()
  return { ok: true, handle: g.handle, schedules: results || [] }
}

export async function addSchedule(db, userId, body, now = Date.now()) {
  const g = await gate(db, userId, body?.handle)
  if (g.error) return g.error
  const text = cleanText(body?.text)
  if (!text) return { ok: false, status: 400, error: 'TEXT_REQUIRED' }
  if (weightedTextLength(text) > QUEUE_LIMITS.text) return { ok: false, status: 400, error: 'TEXT_TOO_LONG' }
  const runAt = Number(body?.runAt)
  if (!Number.isFinite(runAt) || runAt < now + QUEUE_LIMITS.minLeadMs) return { ok: false, status: 400, error: 'RUN_AT_TOO_SOON' }
  const queued = await db.prepare(
    "SELECT COUNT(*) AS n FROM x_schedules WHERE user_id = ?1 AND status IN ('queued', 'claimed')"
  ).bind(userId).first()
  if ((queued?.n || 0) >= QUEUE_LIMITS.queued) return { ok: false, status: 403, error: 'QUEUE_FULL' }
  const id = crypto.randomUUID()
  await db.prepare(
    `INSERT INTO x_schedules (id, user_id, handle, text, run_at, status, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, 'queued', ?6, ?6)`
  ).bind(id, userId, g.handle, text, Math.floor(runAt), now).run()
  return { ok: true, id }
}

export async function cancelSchedule(db, userId, id, now = Date.now()) {
  const res = await db.prepare(
    "UPDATE x_schedules SET status = 'cancelled', updated_at = ?3 WHERE id = ?1 AND user_id = ?2 AND status = 'queued'"
  ).bind(String(id || ''), userId, now).run()
  if (!res.meta?.changes) return { ok: false, status: 404, error: 'SCHEDULE_NOT_CANCELLABLE' }
  return { ok: true }
}

// 插件领取：先回收超时未回报的 claimed，再按 run_at 取一条到期的 queued 并原子置为 claimed。
export async function claimDue(db, userId, rawHandle, now = Date.now()) {
  const g = await gate(db, userId, rawHandle)
  if (g.error) return g.error
  await db.prepare(
    "UPDATE x_schedules SET status = 'queued', claimed_at = NULL, updated_at = ?3 WHERE user_id = ?1 AND handle = ?2 AND status = 'claimed' AND claimed_at < ?4"
  ).bind(userId, g.handle, now, now - QUEUE_LIMITS.claimTtlMs).run()
  const row = await db.prepare(
    "SELECT id FROM x_schedules WHERE user_id = ?1 AND handle = ?2 AND status = 'queued' AND run_at <= ?3 ORDER BY run_at LIMIT 1"
  ).bind(userId, g.handle, now).first()
  if (!row) return { ok: true, schedule: null }
  const res = await db.prepare(
    "UPDATE x_schedules SET status = 'claimed', claimed_at = ?2, updated_at = ?2 WHERE id = ?1 AND status = 'queued'"
  ).bind(row.id, now).run()
  if (!res.meta?.changes) return { ok: true, schedule: null }
  const schedule = await db.prepare('SELECT id, text, run_at FROM x_schedules WHERE id = ?1').bind(row.id).first()
  return { ok: true, schedule }
}

export async function reportSchedule(db, userId, body, now = Date.now()) {
  const status = body?.ok === true ? 'done' : 'failed'
  const res = await db.prepare(
    "UPDATE x_schedules SET status = ?3, result = ?4, updated_at = ?5 WHERE id = ?1 AND user_id = ?2 AND status = 'claimed'"
  ).bind(String(body?.id || ''), userId, status, String(body?.result || '').slice(0, 300), now).run()
  if (!res.meta?.changes) return { ok: false, status: 404, error: 'SCHEDULE_NOT_CLAIMED' }
  return { ok: true, status }
}
