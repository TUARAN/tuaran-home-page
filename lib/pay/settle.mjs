/**
 * 支付兜底落库（纯逻辑，无 edge 专属依赖，可在 node 单测中直接验证）。
 *
 * 回调（applyNotify）是支付落地的主路径；这里提供「主动查单」兜底：
 * 回调丢失（网关重试失败、验签被拒）时，向网关查询订单状态，确认已支付再落库。
 * 与回调共用同一套幂等规则：验金额一致才写，权益不重复。
 */

import { queryPayment } from './gateways/xunhupay.js'
import { isAmountMatch } from './rules.mjs'
import {
  isSignatureResourceKey,
  markBookOrderPaid,
  slugFromResourceKey,
} from './bookOrders.mjs'

/**
 * 写权益（幂等）：不扣燃币，记录来源与订单号。
 *
 * 游客订单也写：权益挂在 guest:<gid> 名下，付完当场可读；登录时 mergeGuestFromRequest
 * 会把这条记录迁到正式账号，跨设备继续有效。
 *
 * 副作用：resource_unlocks 插入会触发 0088 的访客目录触发器，让该游客计入「已解锁」段位。
 * 这里的语义是「付过费或有解锁行为的游客」，统计文案按此理解，不再把付费当污染。
 */
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

  // 签名版实体书不写数字权益，改为 book_orders 状态流转（与回调同口径）
  if (isSignatureResourceKey(order.resource_key)) {
    await markBookOrderPaid(db, {
      orderNo,
      bookSlug: slugFromResourceKey(order.resource_key),
      now,
    })
  } else {
    await grantEntitlement(db, {
      userId: order.user_id,
      resourceKey: order.resource_key,
      orderNo,
      source: 'paid',
      now,
    })
  }

  return { checked: true, paid: true }
}
