/**
 * 圈子方案免登录支付与联系邮箱的纯规则（无框架、无 D1 依赖，可在 node 单测里验证）。
 */

/** 只有圈子方案开放游客下单；付费文章的权益必须挂在登录账号上。 */
export function isGuestPayResource(resourceKey) {
  const key = String(resourceKey || '').trim()
  return /^community:[a-z0-9-]+$/.test(key)
}

/**
 * 联系邮箱：只做够用的格式与长度校验，不追求 RFC 完整性。
 * 统一小写并去掉首尾空白，避免同一邮箱在后台出现多种写法。
 */
export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  if (!email || email.length > 254) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ''
  return email
}

/** 网关 return_url 只接受站内相对路径，避免开放重定向。 */
export function normalizeReturnPath(value) {
  const path = String(value || '').trim()
  if (!path.startsWith('/') || path.startsWith('//')) return ''
  if (path.length > 300 || /[\r\n]/.test(path)) return ''
  return path
}
