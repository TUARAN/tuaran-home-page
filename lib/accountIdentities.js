import { getD1 } from './d1'

/**
 * OAuth 身份表是账号绑定的唯一正本。
 *
 * 绝不按昵称或邮箱自动合并：微信 openid/unionid 不提供可靠邮箱，自动合并会把
 * 两个真实用户的内容、燃币和评论混在一起。已有账号只能在已登录状态下主动绑定。
 */

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function clean(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength)
}

function userFromRow(row, providerProfile = {}) {
  if (!row) return null
  const provider = clean(providerProfile.provider) || clean(row.provider)
  return {
    id: clean(row.id),
    provider,
    login: clean(providerProfile.login) || clean(row.login),
    name: clean(providerProfile.name) || clean(row.name) || clean(row.login) || '用户',
    image: providerProfile.image || row.image || null,
    email: clean(row.email),
  }
}

async function findIdentity(db, provider, providerAccountId) {
  return db
    .prepare(
      `SELECT provider, provider_account_id, user_id, provider_login, provider_name, provider_image
       FROM account_identities
       WHERE provider = ?1 AND provider_account_id = ?2`
    )
    .bind(provider, providerAccountId)
    .first()
}

async function findDirectoryUser(db, userId) {
  return db.prepare('SELECT id, provider, login, name, email, image FROM site_users WHERE id = ?').bind(userId).first()
}

async function touchIdentity(db, provider, providerAccountId, userId, profile) {
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO account_identities
        (provider, provider_account_id, user_id, provider_login, provider_name, provider_image, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)
       ON CONFLICT(provider, provider_account_id) DO UPDATE SET
         provider_login = excluded.provider_login,
         provider_name = excluded.provider_name,
         provider_image = COALESCE(excluded.provider_image, account_identities.provider_image),
         updated_at = excluded.updated_at`
    )
    .bind(
      provider,
      providerAccountId,
      userId,
      clean(profile.login),
      clean(profile.name),
      profile.image ? clean(profile.image, 2000) : null,
      now
    )
    .run()
}

/**
 * 登录时根据外部身份取回已有账号；没有时才创建一个新账号 id。
 * 返回 NEW_ACCOUNT 时，调用方必须先 recordUserLogin，再调用 ensureIdentity。
 */
export async function resolveIdentityForLogin({ provider, providerAccountId, profile, fallbackUser }) {
  const db = dbOrNull()
  if (!db) return { error: 'ACCOUNT_IDENTITY_STORAGE_UNAVAILABLE', status: 503 }

  const identity = await findIdentity(db, provider, providerAccountId)
  if (!identity) {
    return { ok: true, user: fallbackUser, isNewAccount: true }
  }

  const directoryUser = await findDirectoryUser(db, identity.user_id)
  const user = userFromRow(directoryUser, profile) || { ...fallbackUser, id: identity.user_id }
  await touchIdentity(db, provider, providerAccountId, identity.user_id, profile)
  return { ok: true, user, isNewAccount: false }
}

/** 为新 OAuth 账号写入唯一身份。并发首次登录时以数据库唯一键为裁决。 */
export async function ensureIdentityForUser({ provider, providerAccountId, userId, profile }) {
  const db = dbOrNull()
  if (!db) return { error: 'ACCOUNT_IDENTITY_STORAGE_UNAVAILABLE', status: 503 }

  const identity = await findIdentity(db, provider, providerAccountId)
  if (identity && identity.user_id !== userId) {
    return { error: 'IDENTITY_ALREADY_BOUND', status: 409 }
  }
  await touchIdentity(db, provider, providerAccountId, userId, profile)
  return { ok: true, alreadyBound: Boolean(identity) }
}

/** 已登录用户主动绑定；若微信已属于另一账号，永远不自动合并。 */
export async function bindIdentityToUser({ provider, providerAccountId, userId, profile }) {
  const db = dbOrNull()
  if (!db) return { error: 'ACCOUNT_IDENTITY_STORAGE_UNAVAILABLE', status: 503 }

  const identity = await findIdentity(db, provider, providerAccountId)
  if (identity && identity.user_id !== userId) {
    return { error: 'IDENTITY_ALREADY_BOUND', status: 409 }
  }
  await touchIdentity(db, provider, providerAccountId, userId, profile)
  return { ok: true, alreadyBound: Boolean(identity) }
}

export async function listAccountIdentities(userId) {
  const db = dbOrNull()
  if (!db) return []
  try {
    const result = await db
      .prepare(
        `SELECT provider, provider_login, provider_name, provider_image, created_at, updated_at
         FROM account_identities
         WHERE user_id = ?1
         ORDER BY created_at ASC`
      )
      .bind(userId)
      .all()
    return result?.results || []
  } catch {
    return []
  }
}
