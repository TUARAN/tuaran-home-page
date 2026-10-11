import { getOwnerConfig, getOwnerUserFromRequest, isOwnerUser } from './ownerAuth'

export function isPrivateVaultOwner(user) {
  return isOwnerUser(user)
}

export async function getPrivateVaultUser(req) {
  return getOwnerUserFromRequest(req)
}

export { getOwnerConfig }
