const GUEST_USER_PREFIX = 'guest:'

/**
 * 内容周报里的 reader.key：登录用户 / 游客为 user_id，纯匿名为 visitor_hash。
 * 只有能对应到账号（含游客 guest:）时，才查解锁权益。
 */
export function readerAccountUserId({ key, type }) {
  const id = String(key || '').trim()
  if (!id) return ''
  if (id.startsWith(GUEST_USER_PREFIX)) return id
  if (type === 'user' || type === 'guest') return id
  return ''
}

export function readerUnlockAdminHref(accountUserId) {
  const id = String(accountUserId || '').trim()
  if (!id) return null
  if (id.startsWith(GUEST_USER_PREFIX)) {
    return `/admin/users?tab=guests&guestUnlock=${encodeURIComponent(id)}`
  }
  return `/admin/points?userId=${encodeURIComponent(id)}&view=ledger`
}