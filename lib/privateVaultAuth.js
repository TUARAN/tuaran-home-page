import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getUserFromRequest } from './edgeSession'

const FALLBACK_OWNER_LOGINS = new Set(['tuaran'])
const FALLBACK_OWNER_EMAILS = new Set(['tuaran666@gmail.com'])

function splitEnv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function getPrivateVaultOwners() {
  const ctx = getOptionalRequestContext()
  const env = ctx?.env || {}
  return {
    ids: new Set(splitEnv(env.PRIVATE_VAULT_OWNER_IDS || process.env.PRIVATE_VAULT_OWNER_IDS)),
    logins: new Set(splitEnv(env.PRIVATE_VAULT_OWNER_LOGINS || process.env.PRIVATE_VAULT_OWNER_LOGINS)),
    emails: new Set(splitEnv(env.PRIVATE_VAULT_OWNER_EMAILS || process.env.PRIVATE_VAULT_OWNER_EMAILS)),
  }
}

export function isPrivateVaultOwner(user) {
  if (!user?.id) return false

  const owners = getPrivateVaultOwners()
  const id = String(user.id).toLowerCase()
  const login = String(user.login || '').toLowerCase()

  if (owners.ids.size > 0 && owners.ids.has(id)) return true
  if (owners.logins.size > 0 && owners.logins.has(login)) return true
  if (owners.emails.size > 0 && owners.emails.has(login)) return true

  // Personal-site fallback so the feature works before Pages env vars are added.
  if (FALLBACK_OWNER_LOGINS.has(login)) return true
  if (FALLBACK_OWNER_EMAILS.has(login)) return true

  return false
}

export async function getPrivateVaultUser(req) {
  const user = await getUserFromRequest(req)
  if (!user) return { user: null, status: 401 }
  if (!isPrivateVaultOwner(user)) return { user, status: 403 }
  return { user, status: 200 }
}
