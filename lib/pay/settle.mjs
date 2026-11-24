/**
 * 支付兜底落库（纯逻辑，无 edge 专属依赖，可在 node 单测中直接验证）。
 *
 * 回调（applyNotify）是支付落地的主路径；这里提供「主动查单」兜底：
 * 回调丢失（网关重试失败、验签被拒）时，向网关查询订单状态，确认已支付再落库。
 * 与回调共用同一套幂等规则：验金额一致才写，权益不重复。
 */

import { queryPayment } from './gateways/xunhupay.js'
import { isAmountMatch } from './rules.mjs'

/** 写权益（幂等）：不扣燃币，记录来源与订单号 */
export async function grantEntitlement(db, { userId, resourceKey, orderNo, source, now }) {
  await db
    .prepare(
      `INSERT INTO resource_unlocks (user_id, resource_key, unlocked_at, cost_points, source, order_ref)
       SELECT ?1, ?2, ?3, 0, ?4, ?5
        WHERE NOT EXISTS (
          SELECT 1 FROM resource_unlocks WHERE user_id = ?1 AND resource_key = ?2
        )`
    )
    .bind(userId, resourceKey, now, source, orderNo)
    .run()
}

/**
 * 游客订单不写权益表：圈子服务由站长按订单人工交付，且 guest:* 会触发访客目录统计，
 * 把一笔付款算成免费解锁。订单本身与联系邮箱仍正常留存。回调与主动查单兜底共用。
 */
export function grantIfAccount(db, args) {
  if (String(args.userId || '').startsWith('guest:')) return Promise.resolve()
  return grantEntitlement(db, args)
}

/**
 * 主动查单兜底：向网关查询订单支付状态。
 * 网关确认已支付（status=OD）且金额与下单一致才落库并写权益，幂等可重复调用。
 * @param {object} deps.query 查单函数（默认 queryPayment，测试可注入）
 * @returns {Promise<{checked:boolean, paid?:boolean, error?:string}>}
 */
export async function settleFromGateway(db, outTradeNo, { config, now = Date.now(), query = queryPayment } = {}) {
  const orderNo = String(outTradeNo || '').trim()
  if (!db || !orderNo) return { checked: false }

  const order = await db
    .prepare(
      `SELECT out_trade_no, user_id, resource_key, amount_fen, status
         FROM paid_orders WHERE out_trade_no = ?1`
    )
    .bind(orderNo)
    .first()
  if (!order || order.status === 'paid') return { checked: false }

  let result
  try {
    result = await query({ orderNo, config })
  } catch {
    return { checked: false }
  }
  if (!result?.ok || !result?.data) return { checked: false }

  const data = result.data
  // 回调与查单共用网关的 status=OD 表示支付成功
  if (String(data?.status || data?.trade_state || '').toUpperCase() !== 'OD') {
    return { checked: true, paid: false }
  }

  // 查单金额与下单金额必须一致（网关给「元」，订单存「分」）
  if (!isAmountMatch(order.amount_fen, data?.total_fee ?? data?.real_price)) {
    return { checked: true, paid: false, error: 'AMOUNT_MISMATCH' }
  }

  await db
    .prepare(
      `UPDATE paid_orders
          SET status = 'paid', paid_at = ?2,
              transaction_id = COALESCE(NULLIF(?3, ''), transaction_id)
        WHERE out_trade_no = ?1 AND status != 'paid'`
    )
    .bind(orderNo, now, String(data.transaction_id || data.open_order_id || data.trade_no || ''))
    .run()

  await grantIfAccount(db, {
    userId: order.user_id,
    resourceKey: order.resource_key,
    orderNo,
    source: 'paid',
    now,
  })

  return { checked: true, paid: true }
}
