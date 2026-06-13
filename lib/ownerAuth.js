import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getUserFromRequest } from './edgeSession'

const DEFAULT_OWNER_LOGINS = new Set(['tuaran'])
const DEFAULT_OWNER_EMAILS = new Set(['tuaran666@gmail.com'])
const OWNER_ENV_KEYS = [
  'SITE_OWNER_IDS',
  'SITE_OWNER_GITHUB_IDS',
  'PRIVATE_VAULT_OWNER_IDS',
  'VOICE_TASK_OWNER_IDS',
  'SITE_OWNER_LOGINS',
  'PRIVATE_VAULT_OWNER_LOGINS',
  'SITE_OWNER_EMAILS',
  'PRIVATE_VAULT_OWNER_EMAILS',
]

function getEnv() {
  const ctx = getOptionalRequestContext()
  return ctx?.env || process.env || {}
}

function splitEnv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function mergeSets(...sets) {
  return new Set(sets.flatMap((set) => [...set]))
}

function hasConfiguredOwners(env) {
  return OWNER_ENV_KEYS.some((key) => splitEnv(env[key]).length > 0)
}

export function getOwnerConfig() {
  const env = getEnv()
  const useDefaultOwners = !hasConfiguredOwners(env)
  return {
    ids: mergeSets(
      new Set(splitEnv(env.SITE_OWNER_IDS)),
      new Set(splitEnv(env.SITE_OWNER_GITHUB_IDS)),
      new Set(splitEnv(env.PRIVATE_VAULT_OWNER_IDS)),
      new Set(splitEnv(env.VOICE_TASK_OWNER_IDS))
    ),
    logins: mergeSets(
      new Set(splitEnv(env.SITE_OWNER_LOGINS)),
      new Set(splitEnv(env.PRIVATE_VAULT_OWNER_LOGINS)),
      new Set(splitEnv(env.SITE_OWNER_GITHUB_IDS)),
      new Set(splitEnv(env.VOICE_TASK_OWNER_IDS)),
      useDefaultOwners ? DEFAULT_OWNER_LOGINS : new Set()
    ),
    emails: mergeSets(
      new Set(splitEnv(env.SITE_OWNER_EMAILS)),
      new Set(splitEnv(env.PRIVATE_VAULT_OWNER_EMAILS)),
      useDefaultOwners ? DEFAULT_OWNER_EMAILS : new Set()
    ),
  }
}

export function isOwnerUser(user) {
  if (!user?.id) return false

  const owners = getOwnerConfig()
  const id = String(user.id || '').toLowerCase()
  const login = String(user.login || '').toLowerCase()
  const email = String(user.email || '').toLowerCase()
  const name = String(user.name || '').toLowerCase()

  if (owners.ids.size > 0 && owners.ids.has(id)) return true
  if (owners.logins.has(login) || owners.logins.has(name)) return true
  if (email && owners.emails.has(email)) return true

  return false
}

export async function getOwnerUserFromRequest(req) {
  const user = await getUserFromRequest(req)
  if (!user) return { user: null, status: 401 }
  if (!isOwnerUser(user)) return { user, status: 403 }
  return { user, status: 200 }
}

export function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return out === 0
}
