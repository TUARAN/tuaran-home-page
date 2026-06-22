import { getD1 } from './d1'
import {
  cookieNames,
  cookiesConfig,
  getSecrets,
  parseCookies,
  serializeCookie,
  signSession,
  verifySession,
} from './edgeSession'

/**
 * 游客身份（一期·游客评论）
 *
 * 主身份是「tuaran_guest 签名 Cookie 里的随机 UUID」：服务端生成 UUID 后用
 * 与正式会话相同的 HMAC 密钥（NEXTAUTH_SECRET）签名，读取时验签，篡改即失效。
 * IP 只做限流与异常关联，不进身份主键；设备指纹本期不做。
 *
 * 落库约定：游客评论写在同一张 article_comments，
 *   user_provider = 'guest'，user_id = 'guest:<gid>'。
 * 注册/登录瞬间调 mergeGuestFromRequest 归并历史评论并清除 guest cookie。
 */

const GUEST_MAX_AGE_SECONDS = 180 * 24 * 60 * 60 // 180 天

export const GUEST_USER_PREFIX = 'guest:'

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

/** 游客展示名：游客 + gid 短哈希（稳定、不泄露完整 id） */
export function guestDisplayName(gid) {
  const short = String(gid || '').replace(/-/g, '').slice(0, 6) || '匿名'
  return `游客 ${short}`
}

/** 验签 tuaran_guest cookie，返回 gid 或 null */
export async function getGuestId(req) {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) return null
  const cookies = parseCookies(req)
  const token = cookies[cookieNames.guest]
  const payload = await verifySession(token, sessionSecret)
  const gid = payload?.gid
  return typeof gid === 'string' && gid ? gid : null
}

/** 签发一个新的游客身份，返回 { gid, setCookie }（setCookie 为序列化后的 Set-Cookie 串） */
export async function issueGuestCookie() {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) return null
  const gid = crypto.randomUUID()
  const token = await signSession({ gid, iat: Math.floor(Date.now() / 1000) }, sessionSecret)
  const { secure } = cookiesConfig()
  const setCookie = serializeCookie(cookieNames.guest, token, {
    maxAge: GUEST_MAX_AGE_SECONDS,
    secure,
  })
  return { gid, setCookie }
}

/**
 * 取现有游客身份，没有则签发一个新的。
 * @returns {Promise<{ gid: string, setCookie: string|null }|null>}
 */
export async function getOrIssueGuest(req) {
  const existing = await getGuestId(req)
  if (existing) return { gid: existing, setCookie: null }
  return issueGuestCookie()
}

/** 清除 guest cookie 的 Set-Cookie 串（绑定后调用） */
export function clearGuestCookie() {
  const { secure } = cookiesConfig()
  return serializeCookie(cookieNames.guest, '', { maxAge: 0, secure })
}

/**
 * 注册/登录成功后归并游客身份。best-effort：任何失败只打日志，绝不阻断登录。
 * 幂等：gid 主键 + INSERT OR IGNORE，抢绑只第一个生效；评论迁移可重入。
 * @returns {Promise<string|null>} 归并成功的 gid（调用方据此清 cookie），否则 null
 */
export async function mergeGuestFromRequest(req, user) {
  try {
    const gid = await getGuestId(req)
    const userId = String(user?.id || '').trim()
    if (!gid || !userId) return gid || null

    const db = dbOrNull()
    if (!db) return gid // 无 D1 也清掉游客 cookie，避免登录后仍以游客落库

    const provider = String(user?.provider || (userId.startsWith('google:') ? 'google' : 'github'))
    await db.batch([
      db
        .prepare('INSERT OR IGNORE INTO guest_bindings (gid, user_id, bound_at) VALUES (?1, ?2, ?3)')
        .bind(gid, userId, Date.now()),
      db
        .prepare(
          `UPDATE article_comments
             SET user_id = ?1, user_provider = ?2
           WHERE user_id = ?3`
        )
        .bind(userId, provider, `${GUEST_USER_PREFIX}${gid}`),
    ])
    return gid
  } catch (error) {
    console.error('mergeGuestFromRequest failed', error)
    return null
  }
}
