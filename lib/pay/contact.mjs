/**
 * 现金支付免登录与联系邮箱的纯规则（无框架、无 D1 依赖，可在 node 单测里验证）。
 */

/**
 * 是否允许游客（未登录）下单。
 *
 * 判定以「后台实配现金价」为准：只要 gated_resources.price_fen > 0，说明这条内容走现金购买，
 * 就放行游客下单（圈子和付费文章同一套）。后台新配价的内容自动适用，不必改代码加白名单。
 * priceFen 未传（或查不到）时，仅圈子方案按旧前缀兜底；最终能否下单仍由 createPaidOrder 的
 * PRICE_NOT_SET 校验把关，不会凭空生成订单。
 */
export function isGuestPayResource(resourceKey, priceFen = 0) {
  const key = String(resourceKey || '').trim()
  // 资源键先做统一合法性约束：空值、超长、含路径分隔符或空白一律不参与游客放行
  if (!key || key.length > 180 || /[/\\\s]/.test(key)) return false
  if (Number(priceFen) > 0) return true
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
