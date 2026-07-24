import { getUserFromRequest } from '../edgeSession'
import { isOwnerUser } from '../ownerAuth'
import { getUserRole } from '../userDirectory'
import { getDigitalHumanAccessMode } from './config'

export async function requireDigitalHumanUser(req) {
  const user = await getUserFromRequest(req)
  if (!user?.id) {
    return {
      response: Response.json(
        { error: 'LOGIN_REQUIRED', message: '请先登录后再使用数字人口播。' },
        { status: 401 }
      ),
    }
  }

  const userId = String(user.id)
  const owner = isOwnerUser(user)
  if ((await getUserRole(userId)) === 'blocked') {
    return { response: Response.json({ error: 'USER_BLOCKED' }, { status: 403 }) }
  }
  if (!owner && getDigitalHumanAccessMode() !== 'authed') {
    return {
      response: Response.json(
        { error: 'BETA_OWNER_ONLY', message: '数字人口播目前处于站长内测阶段。' },
        { status: 403 }
      ),
    }
  }

  return { user, userId, isOwner: owner }
}
