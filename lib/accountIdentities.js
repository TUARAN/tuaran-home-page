import { getD1 } from './d1'

/**
 * 账号模块的登录身份表是唯一正本。
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

function newPlatformId() {
  return `acct_${crypto.randomUUID().replace(/-/g, '')}`
}

function userFromRow(row, providerProfile = {}) {
  if (!row) return null
  const provider = clean(providerProfile.provider) || clean(row.provider)
  return {
    // 迁移前的 site_users.id 可能仍是 github:<id> 等历史别名；会话和业务
    // 数据一律使用 platform_id，避免把任一第三方账号当作本站账号本体。
    id: clean(row.platform_id) || clean(row.id),
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
  return db
    .prepare('SELECT id, platform_id, provider, login, name, email, image FROM site_users WHERE platform_id = ?1 OR id = ?1 LIMIT 1')
    .bind(userId)
    .first()
}

async function ensurePlatformAccount(db, userId) {
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO platform_accounts (id, created_at, updated_at)
       VALUES (?1, ?2, ?2)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`
    )
    .bind(userId, now)
    .run()
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
    // 平台 ID 只在此处生成，绝不由 GitHub/微信/邮箱的 subject 拼接而成。
    return { ok: true, user: { ...fallbackUser, id: newPlatformId() }, isNewAccount: true }
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
  await ensurePlatformAccount(db, userId)
  await touchIdentity(db, provider, providerAccountId, userId, profile)
  return { ok: true, alreadyBound: Boolean(identity) }
}

/** 邮箱密码登录也进入同一账号模块，不再把 email:<uuid> 当业务主键。 */
export async function resolveEmailLogin(user) {
  const email = clean(user?.email || user?.login).toLowerCase()
  if (!email) return { error: 'EMAIL_IDENTITY_MISSING', status: 400 }
  const profile = {
    provider: 'email',
    login: email,
    name: clean(user?.name) || email,
    image: null,
  }
  let resolved = await resolveIdentityForLogin({
    provider: 'email',
    providerAccountId: email,
    profile,
    fallbackUser: { ...user, ...profile },
  })
  if (!resolved.ok || !resolved.isNewAccount) return resolved

  const ensured = await ensureIdentityForUser({
    provider: 'email', providerAccountId: email, userId: resolved.user.id, profile,
  })
  if (ensured.ok) return resolved
  if (ensured.error !== 'IDENTITY_ALREADY_BOUND') return ensured

  resolved = await resolveIdentityForLogin({
    provider: 'email', providerAccountId: email, profile, fallbackUser: { ...user, ...profile },
  })
  return resolved.ok && !resolved.isNewAccount
    ? resolved
    : { error: 'IDENTITY_RESOLUTION_FAILED', status: 409 }
}

/** 已登录用户主动绑定；若微信已属于另一账号，永远不自动合并。 */
export async function bindIdentityToUser({ provider, providerAccountId, userId, profile }) {
  const db = dbOrNull()
  if (!db) return { error: 'ACCOUNT_IDENTITY_STORAGE_UNAVAILABLE', status: 503 }

  const identity = await findIdentity(db, provider, providerAccountId)
  if (identity && identity.user_id !== userId) {
    return { error: 'IDENTITY_ALREADY_BOUND', status: 409 }
  }
  await ensurePlatformAccount(db, userId)
  await touchIdentity(db, provider, providerAccountId, userId, profile)
  return { ok: true, alreadyBound: Boolean(identity) }
}

export async function listAccountIdentities(userId) {
  const db = dbOrNull()
  if (!db) return []
  try {
    const result = await db
      .prepare(
        `SELECT provider, provider_account_id, provider_login, provider_name, provider_image, created_at, updated_at
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

/** 平台账号曾使用过的匿名游客身份；只返回短 ID，完整 gid 不对前端暴露。 */
export async function listAccountGuestIdentities(userId) {
  const db = dbOrNull()
  if (!db) return []
  try {
    const result = await db
      .prepare(
        `SELECT gid, bound_at
         FROM guest_bindings
         WHERE user_id = ?1
         ORDER BY bound_at DESC`
      )
      .bind(userId)
      .all()
    return (result?.results || []).map((row) => ({
      id: `guest:${String(row.gid || '').slice(0, 8)}`,
      boundAt: Number(row.bound_at) || null,
    }))
  } catch {
    return []
  }
}

/**
 * 解绑一个第三方登录方式。邮箱密码身份暂不允许由通用接口解绑：删除它必须同时
 * 销毁或迁移凭据，留给单独的安全设置流程处理。
 */
export async function unbindIdentityFromUser({ provider, userId }) {
  const db = dbOrNull()
  if (!db) return { error: 'ACCOUNT_IDENTITY_STORAGE_UNAVAILABLE', status: 503 }
  const normalizedProvider = clean(provider, 40).toLowerCase()
  if (!normalizedProvider || normalizedProvider === 'email') {
    return { error: 'IDENTITY_CANNOT_BE_UNBOUND', status: 400 }
  }
  const identities = await db
    .prepare('SELECT provider FROM account_identities WHERE user_id = ?1')
    .bind(userId)
    .all()
  const rows = identities?.results || []
  if (!rows.some((row) => row.provider === normalizedProvider)) {
    return { error: 'IDENTITY_NOT_FOUND', status: 404 }
  }
  if (rows.length <= 1) {
    return { error: 'LAST_LOGIN_METHOD', status: 409 }
  }
  await db
    .prepare('DELETE FROM account_identities WHERE user_id = ?1 AND provider = ?2')
    .bind(userId, normalizedProvider)
    .run()
  return { ok: true }
}

/** 兼容旧会话：把曾写入 provider:<subject> 的会话就地解析为平台 ID。 */
export async function canonicalizeSessionUser(user) {
  const id = clean(user?.id)
  if (!id || id.startsWith('acct_')) return user || null
  const db = dbOrNull()
  if (!db) return user || null
  try {
    const provider = clean(user?.provider || id.split(':')[0], 40).toLowerCase()
    const legacySubject = clean(id.slice(id.indexOf(':') + 1))
    const login = clean(user?.email || user?.login).toLowerCase()
    let identity = null
    if (provider && legacySubject) identity = await findIdentity(db, provider, legacySubject)
    // 邮箱体系的外部 subject 是规范化邮箱，旧会话的 id 是 email:<uuid>。
    if (!identity && provider === 'email' && login) {
      identity = await db
        .prepare(
          `SELECT provider, provider_account_id, user_id, provider_login, provider_name, provider_image
           FROM account_identities
           WHERE provider = 'email' AND (provider_account_id = ?1 OR provider_login = ?1)
           LIMIT 1`
        )
        .bind(login)
        .first()
    }
    return identity?.user_id ? { ...user, id: clean(identity.user_id) } : user
  } catch {
    return user || null
  }
}
