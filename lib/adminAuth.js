import { getAdminLocalPreviewUser, isAdminLocalPreviewEnabled } from './adminLocalPreview'
import { getUserFromRequest } from './edgeSession'
import { isOwnerUser } from './ownerAuth'

/** API 路由统一 owner 校验：401 未登录，403 非 owner。 */
export async function getOwnerOrReject(req) {
  if (isAdminLocalPreviewEnabled()) {
    return { ok: true, user: getAdminLocalPreviewUser(), localPreview: true }
  }

  const user = await getUserFromRequest(req)
  if (!user) {
    return { ok: false, response: Response.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 }) }
  }
  if (!isOwnerUser(user)) {
    return { ok: false, response: Response.json({ error: 'NOT_OWNER' }, { status: 403 }) }
  }
  return { ok: true, user }
}
