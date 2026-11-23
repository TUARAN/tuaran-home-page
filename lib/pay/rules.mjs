/**
 * 付费订单的纯逻辑规则（无框架、无 D1 依赖，可在 node 单测中直接验证）。
 */

const REUSE_WINDOW_MS = 30 * 60 * 1000
export const ORDER_REUSE_WINDOW_MS = REUSE_WINDOW_MS

/** 订单号：T + 北京时间 yyyymmddHHmmss + 6 位随机，始终 ≤ 32 且只含字母数字 */
export function newOrderNo(now = Date.now()) {
  const d = new Date(now + 8 * 60 * 60 * 1000)
  const stamp =
    d.getUTCFullYear().toString() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0') +
    String(d.getUTCHours()).padStart(2, '0') +
    String(d.getUTCMinutes()).padStart(2, '0') +
    String(d.getUTCSeconds()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 8).padEnd(6, '0')
  return `T${stamp}${rand}`
}

export function normalizeResourceKey(value) {
  const key = typeof value === 'string' ? value.trim() : ''
  return !key || key.length > 180 ? '' : key
}

/**
 * 回调金额与订单金额是否一致。
 * 网关给的是「元」的字符串，订单存「分」的整数；浮点直接比较会踩 10.00 vs 10 的坑。
 */
export function isAmountMatch(orderAmountFen, notifyTotalFee) {
  const expected = Math.trunc(Number(orderAmountFen || 0))
  if (expected <= 0) return false
  const raw = String(notifyTotalFee ?? '').trim()
  if (!raw) return false
  const fee = Number(raw)
  if (!Number.isFinite(fee) || fee < 0) return false
  return Math.round(fee * 100) === expected
}

/** 失败订单是否还值得复用（30 分钟内未支付的 pending 单） */
export function canReuseOrder({ createdAt, now = Date.now(), status = 'pending', hasQrCode } = {}) {
  if (String(status) !== 'pending' || !hasQrCode) return false
  return now - Number(createdAt || 0) < REUSE_WINDOW_MS
}
