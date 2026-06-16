import { getAdminLocalPreviewUser, isAdminLocalPreviewEnabled } from './adminLocalPreview'
import { cookieNames, getSecrets, parseCookies, verifySession } from './edgeSession'
import { isOwnerUser } from './ownerAuth'

/** API 路由统一 owner 校验：401 未登录，403 非 owner。 */
export async function getOwnerOrReject(req) {
  if (isAdminLocalPreviewEnabled()) {
    return { ok: true, user: getAdminLocalPreviewUser(), localPreview: true }
  }

  const { sessionSecret } = getSecrets()
  if (!sessionSecret) {
    return { ok: false, response: Response.json({ error: 'MISSING_AUTH_CONFIG' }, { status: 500 }) }
  }
  const cookies = parseCookies(req)
  const token = cookies[cookieNames.session]
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null
  if (!user) {
    return { ok: false, response: Response.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 }) }
  }
  if (!isOwnerUser(user)) {
    return { ok: false, response: Response.json({ error: 'NOT_OWNER' }, { status: 403 }) }
  }
  return { ok: true, user }
}
