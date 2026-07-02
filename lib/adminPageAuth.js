import { cookies } from 'next/headers'
import { headers } from 'next/headers'

import { getAdminLocalPreviewUser, isAdminLocalPreviewEnabled } from './adminLocalPreview'
import { cookieNames, getSecrets, getUserFromCanonicalSession, verifySession } from './edgeSession'
import { isOwnerUser } from './ownerAuth'

/** 服务端页面 owner 状态：anonymous | not-owner | owner */
export async function getOwnerPageState() {
  if (isAdminLocalPreviewEnabled()) {
    return { state: 'owner', user: getAdminLocalPreviewUser(), localPreview: true }
  }

  const { sessionSecret } = getSecrets()
  if (!sessionSecret) {
    const headerStore = await headers()
    const user = await getUserFromCanonicalSession(
      headerStore.get('cookie'),
      headerStore.get('host')
    )
    if (!user) return { state: 'anonymous', user: null }
    if (!isOwnerUser(user)) return { state: 'not-owner', user }
    return { state: 'owner', user }
  }
  const cookieStore = await cookies()
  const token = cookieStore.get(cookieNames.session)?.value
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null
  if (!user) return { state: 'anonymous', user: null }
  if (!isOwnerUser(user)) return { state: 'not-owner', user }
  return { state: 'owner', user }
}
