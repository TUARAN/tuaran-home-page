import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getUserFromRequest } from './edgeSession'

const DEFAULT_OWNER = 'TUARAN'

function getEnv() {
  const ctx = getOptionalRequestContext()
  return ctx?.env || process.env || {}
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return out === 0
}

export function isOwnerUser(user) {
  if (!user) return false
  const env = getEnv()
  const allowed = splitList(env.VOICE_TASK_OWNER_IDS || env.SITE_OWNER_GITHUB_IDS || DEFAULT_OWNER)
  const candidates = [
    user.id,
    user.login,
    user.name,
  ]
    .map((item) => String(item || '').toLowerCase())
    .filter(Boolean)

  return allowed.some((item) => candidates.includes(String(item).toLowerCase()))
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
