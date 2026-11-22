// 工作台的 D1 读写。每个函数都以 userId 开头并写进 WHERE，保证租户隔离。
import { PERSONA_LIMITS, QUOTA_KINDS, accountKey, periodKey, planFor, validateMemory, validatePersona } from './workbenchCore.js'

export async function listAccounts(db, userId) {
  const { results } = await db.prepare(
    "SELECT handle, created_at FROM x_accounts WHERE user_id = ?1 AND status = 'active' ORDER BY created_at"
  ).bind(userId).all()
  return results || []
}

export async function bindAccount(db, userId, rawHandle, now = Date.now()) {
  const handle = accountKey(rawHandle)
  if (!handle) return { ok: false, status: 400, error: 'INVALID_HANDLE' }
  const existing = await db.prepare(
    'SELECT status FROM x_accounts WHERE user_id = ?1 AND handle = ?2'
  ).bind(userId, handle).first()
  if (existing?.status === 'active') return { ok: true, handle, existed: true }
  const active = await listAccounts(db, userId)
  if (active.length >= planFor(userId).accounts) return { ok: false, status: 403, error: 'ACCOUNT_LIMIT' }
  await db.prepare(
    `INSERT INTO x_accounts (id, user_id, handle, status, created_at, updated_at)
     VALUES (?1, ?2, ?3, 'active', ?4, ?4)
     ON CONFLICT(user_id, handle) DO UPDATE SET status = 'active', updated_at = ?4`
  ).bind(crypto.randomUUID(), userId, handle, now).run()
  return { ok: true, handle, existed: false }
}

// 解绑同时删除该账号的人格与记忆（隐私：用户可删除自己的数据）。
export async function unbindAccount(db, userId, rawHandle, now = Date.now()) {
  const handle = accountKey(rawHandle)
  if (!handle) return { ok: false, status: 400, error: 'INVALID_HANDLE' }
  await db.batch([
    db.prepare("UPDATE x_accounts SET status = 'revoked', updated_at = ?3 WHERE user_id = ?1 AND handle = ?2").bind(userId, handle, now),
    db.prepare('DELETE FROM x_agent_profiles WHERE user_id = ?1 AND handle = ?2').bind(userId, handle),
  ])
  return { ok: true, handle }
}

async function ownsAccount(db, userId, handle) {
  const row = await db.prepare(
    "SELECT 1 AS ok FROM x_accounts WHERE user_id = ?1 AND handle = ?2 AND status = 'active'"
  ).bind(userId, handle).first()
  return Boolean(row)
}

export async function getProfile(db, userId, rawHandle) {
  const handle = accountKey(rawHandle)
  if (!handle) return { ok: false, status: 400, error: 'INVALID_HANDLE' }
  if (!(await ownsAccount(db, userId, handle))) return { ok: false, status: 404, error: 'ACCOUNT_NOT_BOUND' }
  const row = await db.prepare(
    'SELECT persona_json, memory_json, updated_at FROM x_agent_profiles WHERE user_id = ?1 AND handle = ?2'
  ).bind(userId, handle).first()
  const parse = (text, fallback) => { try { return JSON.parse(text) } catch { return fallback } }
  return {
    ok: true,
    handle,
    persona: parse(row?.persona_json, {}),
    memory: parse(row?.memory_json, []),
    updatedAt: row?.updated_at || 0,
  }
}

export async function saveProfile(db, userId, rawHandle, body, now = Date.now()) {
  const handle = accountKey(rawHandle)
  if (!handle) return { ok: false, status: 400, error: 'INVALID_HANDLE' }
  if (!(await ownsAccount(db, userId, handle))) return { ok: false, status: 404, error: 'ACCOUNT_NOT_BOUND' }
  const persona = validatePersona(body?.persona)
  if (!persona.ok) return { ...persona, status: 422 }
  const memory = validateMemory(body?.memory)
  if (!memory.ok) return { ...memory, status: 422 }
  await db.prepare(
    `INSERT INTO x_agent_profiles (user_id, handle, persona_json, memory_json, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(user_id, handle) DO UPDATE SET persona_json = ?3, memory_json = ?4, updated_at = ?5`
  ).bind(userId, handle, JSON.stringify(persona.persona), JSON.stringify(memory.memory), now).run()
  return { ok: true, handle, persona: persona.persona, memory: memory.memory, updatedAt: now, limits: PERSONA_LIMITS }
}

export async function getUsage(db, userId, now = Date.now()) {
  const period = periodKey(now)
  const { results } = await db.prepare(
    'SELECT kind, used FROM x_usage WHERE user_id = ?1 AND period = ?2'
  ).bind(userId, period).all()
  const usedBy = Object.fromEntries((results || []).map((r) => [r.kind, r.used]))
  const quota = planFor(userId).quota
  return {
    period,
    items: QUOTA_KINDS.map((kind) => ({ kind, used: usedBy[kind] || 0, limit: quota[kind] })),
  }
}

// 原子扣额：只有 used + n <= limit 时才写入，超额返回 QUOTA_EXCEEDED，不降级放行。
export async function consumeQuota(db, userId, kind, n = 1, now = Date.now()) {
  if (!QUOTA_KINDS.includes(kind) || !Number.isInteger(n) || n < 1) {
    return { ok: false, status: 400, error: 'INVALID_QUOTA_REQUEST' }
  }
  const limit = planFor(userId).quota[kind]
  const period = periodKey(now)
  const res = await db.prepare(
    `INSERT INTO x_usage (user_id, period, kind, used, updated_at)
     SELECT ?1, ?2, ?3, ?4, ?6 WHERE ?4 <= ?5
     ON CONFLICT(user_id, period, kind) DO UPDATE SET used = used + ?4, updated_at = ?6
       WHERE used + ?4 <= ?5`
  ).bind(userId, period, kind, n, limit, now).run()
  if (!res.meta?.changes) return { ok: false, status: 429, error: 'QUOTA_EXCEEDED', kind, limit }
  return { ok: true, kind, limit }
}

// LLM 调用失败时退还已扣额度，避免用户为失败请求付费。
export async function refundQuota(db, userId, kind, n = 1, now = Date.now()) {
  if (!QUOTA_KINDS.includes(kind) || !Number.isInteger(n) || n < 1) return { ok: false }
  await db.prepare(
    'UPDATE x_usage SET used = MAX(0, used - ?4), updated_at = ?5 WHERE user_id = ?1 AND period = ?2 AND kind = ?3'
  ).bind(userId, periodKey(now), kind, n, now).run()
  return { ok: true }
}
