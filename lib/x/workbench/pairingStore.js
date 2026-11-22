export async function secretHash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('')
}
function secret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
}
export async function createPairing(db, userId, now = Date.now()) {
  const code = secret()
  const id = crypto.randomUUID()
  const expiresAt = now + 10 * 60_000
  await db.batch([
    db.prepare("DELETE FROM x_plugin_credentials WHERE user_id = ?1 AND kind = 'code'").bind(userId),
    db.prepare('DELETE FROM x_plugin_credentials WHERE expires_at <= ?1').bind(now),
    db.prepare("INSERT INTO x_plugin_credentials VALUES (?1, ?2, ?3, 'code', ?4, ?5)").bind(id, userId, await secretHash(code), now, expiresAt),
  ])
  return { ok: true, code, expiresAt }
}
export async function exchangePairing(db, code, now = Date.now()) {
  if (!/^[a-f0-9]{64}$/.test(String(code || ''))) return { ok: false, status: 401, error: 'INVALID_PAIRING_CODE' }
  // 原子消费：并发兑换最多一个请求拿到该行。
  const row = await db.prepare("DELETE FROM x_plugin_credentials WHERE secret_hash = ?1 AND kind = 'code' AND expires_at > ?2 RETURNING user_id").bind(await secretHash(code), now).first()
  if (!row) return { ok: false, status: 401, error: 'INVALID_PAIRING_CODE' }
  const token = secret()
  const expiresAt = now + 30 * 86400000
  await db.prepare("INSERT INTO x_plugin_credentials VALUES (?1, ?2, ?3, 'token', ?4, ?5)").bind(crypto.randomUUID(), row.user_id, await secretHash(token), now, expiresAt).run()
  return { ok: true, token, expiresAt }
}
export async function authenticatePlugin(db, request, now = Date.now()) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') || '')
  if (!match) return null
  return db.prepare("SELECT user_id FROM x_plugin_credentials WHERE secret_hash = ?1 AND kind = 'token' AND expires_at > ?2").bind(await secretHash(match[1]), now).first()
}
export async function revokePlugins(db, userId) {
  await db.prepare('DELETE FROM x_plugin_credentials WHERE user_id = ?1').bind(userId).run()
  return { ok: true }
}
