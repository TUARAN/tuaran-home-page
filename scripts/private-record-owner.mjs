// Private records belong to the site's canonical platform account. The GitHub
// identifier remains only as a lookup alias after the account-center migration.
export const LEGACY_OWNER_ID = 'github:25968749'

export function ownerLookupSql() {
  return `SELECT platform_id AS owner_id FROM site_users WHERE id = '${LEGACY_OWNER_ID}' AND platform_id LIKE 'acct_%' LIMIT 1;`
}

export function resolvePrivateRecordOwner(rows) {
  const ownerId = String(Array.isArray(rows) ? rows[0]?.owner_id || '' : '').trim()
  if (!ownerId.startsWith('acct_')) throw new Error('无法解析长期罗盘所属的平台账号，拒绝读写。')
  return ownerId
}
