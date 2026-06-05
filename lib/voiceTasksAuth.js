import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getUserFromRequest } from './edgeSession'
import { isOwnerUser, safeEqual } from './ownerAuth'

function getEnv() {
  const ctx = getOptionalRequestContext()
  return ctx?.env || process.env || {}
}

export async function getVoiceTaskPrincipal(req) {
  const env = getEnv()
  const expectedToken = env.VOICE_TASK_API_TOKEN || ''
  const auth = req.headers.get('authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const apiKey = req.headers.get('x-api-key') || ''
  const token = bearer || apiKey

  if (expectedToken && safeEqual(token, expectedToken)) {
    return { type: 'token', user: null }
  }

  const user = await getUserFromRequest(req)
  if (isOwnerUser(user)) {
    return { type: 'owner', user }
  }

  return null
}

export { isOwnerUser }
