/**
 * 付费订单：创建、回调落地、补单、查询。
 *
 * 与燃币共用 resource_unlocks 一张权益表，靠 source 区分来源：
 *   ranbi  燃币解锁（由 lib/ledger/points.js 写入）
 *   paid   现金支付（由本文件写入，cost_points 记 0）
 *   admin  站长补单（同上）
 * 这样 isUnlocked / 评论区 / 相关阅读只需要判断一组 key，不必分叉。
 */

import { isUnlocked } from '../ledger/points.js'
import {
  createPayment,
  fenToYuan,
  isConfigured,
  notifyOrderNo,
  notifyPaid,
  readGatewayConfig,
  verifySign,
} from './gateways/xunhupay.js'
import { canReuseOrder, isAmountMatch, newOrderNo, normalizeResourceKey } from './rules.mjs'

export const ORDER_STATUS = {
  pending: 'pending',
  paid: 'paid',
  closed: 'closed',
  failed: 'failed',
}

/** 读现金价：只认 gated_resources 显式配置，不做前缀回退（没配就是不能买） */
export async function readPriceFen(db, resourceKey) {
  const key = normalizeResourceKey(resourceKey)
  if (!db || !key) return 0
  const row = await db
    .prepare('SELECT price_fen FROM gated_resources WHERE resource_key = ?1')
    .bind(key)
    .first()
  return Math.max(0, Math.trunc(Number(row?.price_fen || 0)))
}

/**
 * 创建支付订单。
 * @returns {Promise<{ok:boolean, orderNo?:string, qrCode?:string, payUrl?:string, amountFen?:number, alreadyUnlocked?:boolean, error?:string, raw?:unknown}>}
 */
export async function createPaidOrder(db, { userId, resourceKey, title, clientIp, returnTo = '', config = readGatewayConfig(), now = Date.now() } = {}) {
  const key = normalizeResourceKey(resourceKey)
  const id = String(userId || '').trim()
  if (!db || !id) return { ok: false, error: 'UNAUTHORIZED' }
  if (!key) return { ok: false, error: 'INVALID_RESOURCE' }
  if (!isConfigured(config)) return { ok: false, error: 'GATEWAY_NOT_CONFIGURED' }

  if (await isUnlocked(db, id, key)) return { ok: false, error: 'ALREADY_UNLOCKED' }
  const priceFen = await readPriceFen(db, key)
  if (priceFen <= 0) return { ok: false, error: 'PRICE_NOT_SET' }

  // 30 分钟内同一用户同一内容复用未支付订单，避免重复生成二维码
  const recent = await db
    .prepare(
      `SELECT out_trade_no, qr_code_url, pay_url, created_at FROM paid_orders
        WHERE user_id = ?1 AND resource_key = ?2 AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1`
    )
    .bind(id, key)
    .first()
  if (canReuseOrder({ createdAt: recent?.created_at, now, status: recent?.status || 'pending', hasQrCode: recent?.qr_code_url })) {
    return {
      ok: true,
      orderNo: recent.out_trade_no,
      qrCode: recent.qr_code_url,
      payUrl: recent.pay_url || '',
      amountFen: priceFen,
      reused: true,
    }
  }

  const orderNo = newOrderNo(now)
  await db
    .prepare(
      `INSERT INTO paid_orders (out_trade_no, user_id, resource_key, amount_fen, channel, status, created_at)
       VALUES (?1, ?2, ?3, ?4, 'xunhupay', 'pending', ?5)`
    )
    .bind(orderNo, id, key, priceFen, now)
    .run()

  const notifyUrl = `${config.notifyBase}/api/pay/notify`
  // 圈子方案允许游客下单，付完不能跳回需要登录的 /account；用下单页作为返回地址
  const returnUrl = returnTo
    ? `${config.notifyBase}${returnTo}`
    : `${config.notifyBase}/account?order=${orderNo}`
  const payment = await createPayment({
    orderNo,
    amountFen: priceFen,
    title,
    notifyUrl,
    returnUrl,
    clientIp,
    config,
  })

  if (!payment.ok) {
    await db
      .prepare(`UPDATE paid_orders SET status = 'failed' WHERE out_trade_no = ?1`)
      .bind(orderNo)
      .run()
    return { ok: false, error: payment.error || 'GATEWAY_FAILED', raw: payment.raw }
  }

  await db
    .prepare(
      `UPDATE paid_orders
          SET qr_code_url = ?2, pay_url = ?3, gateway_order_id = ?4
        WHERE out_trade_no = ?1`
    )
    .bind(orderNo, payment.qrCode || '', payment.payUrl || '', String(payment.orderId || ''))
    .run()

  return { ok: true, orderNo, qrCode: payment.qrCode, payUrl: payment.payUrl, amountFen: priceFen }
}

/** 写权益（幂等）：不扣燃币，记录来源与订单号 */
async function grantEntitlement(db, { userId, resourceKey, orderNo, source, now }) {
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
 * 把一笔付款算成免费解锁。订单本身与联系邮箱仍正常留存。
 */
function grantIfAccount(db, args) {
  if (String(args.userId || '').startsWith('guest:')) return Promise.resolve()
  return grantEntitlement(db, args)
}

/**
 * 回调落地：验签 → 金额校验 → 幂等流转 → 写权益。
 * @returns {Promise<{ok:boolean, error?:string, orderNo?:string}>}
 */
export async function applyNotify(db, payload, { config = readGatewayConfig(), now = Date.now(), channel = 'xunhupay' } = {}) {
  if (!verifySign(payload, config.secret)) return { ok: false, error: 'INVALID_SIGN' }
  if (config.appid && payload.appid && String(payload.appid) !== config.appid) {
    return { ok: false, error: 'APPID_MISMATCH' }
  }
  if (!notifyPaid(payload)) return { ok: false, error: 'NOT_PAID' }

  const orderNo = notifyOrderNo(payload)
  if (!orderNo) return { ok: false, error: 'ORDER_NO_MISSING' }

  const order = await db
    .prepare(
      `SELECT out_trade_no, user_id, resource_key, amount_fen, status
         FROM paid_orders WHERE out_trade_no = ?1`
    )
    .bind(orderNo)
    .first()
  if (!order) return { ok: false, error: 'ORDER_NOT_FOUND' }

  // 金额必须与下单一致，防止改价（1 分钱下单换 10 元内容）
  if (!isAmountMatch(order.amount_fen, payload.total_fee)) {
    return { ok: false, error: 'AMOUNT_MISMATCH', expected: order.amount_fen, got: String(payload.total_fee || '') }
  }

  const transactionId = String(payload.transaction_id || payload.open_order_id || payload.trade_no || '')
  const updated = await db
    .prepare(
      `UPDATE paid_orders
          SET status = 'paid', paid_at = ?2, transaction_id = ?3,
              notify_count = notify_count + 1, raw_notify = ?4, channel = ?5
        WHERE out_trade_no = ?1 AND status != 'paid'`
    )
    .bind(orderNo, now, transactionId, JSON.stringify(payload).slice(0, 2000), channel)
    .run()

  // 已 paid 也要补权益（此前可能因异常漏写）
  if (!(Number(updated?.meta?.changes || 0) > 0)) {
    await db.prepare(`UPDATE paid_orders SET notify_count = notify_count + 1 WHERE out_trade_no = ?1`).bind(orderNo).run()
  }

  await grantIfAccount(db, {
    userId: order.user_id,
    resourceKey: order.resource_key,
    orderNo,
    source: 'paid',
    now,
  })

  return { ok: true, orderNo, firstTime: Number(updated?.meta?.changes || 0) > 0 }
}

/** 站长补单：不依赖回调，直接写权益 */
export async function grantPaidOrder(db, outTradeNo, { now = Date.now(), note = 'manual' } = {}) {
  const orderNo = String(outTradeNo || '').trim()
  if (!db || !orderNo) return { ok: false, error: 'INVALID_ORDER' }
  const order = await db
    .prepare(`SELECT out_trade_no, user_id, resource_key, status FROM paid_orders WHERE out_trade_no = ?1`)
    .bind(orderNo)
    .first()
  if (!order) return { ok: false, error: 'ORDER_NOT_FOUND' }

  await db
    .prepare(
      `UPDATE paid_orders
          SET status = 'paid', paid_at = COALESCE(paid_at, ?2), transaction_id = COALESCE(transaction_id, ?3)
        WHERE out_trade_no = ?1 AND status != 'paid'`
    )
    .bind(orderNo, now, note)
    .run()

  await grantIfAccount(db, {
    userId: order.user_id,
    resourceKey: order.resource_key,
    orderNo,
    source: 'admin',
    now,
  })

  return { ok: true, orderNo, resourceKey: order.resource_key, userId: order.user_id }
}

/** 本人订单状态（供前端轮询；只暴露必要字段） */
export async function getPaidOrderForUser(db, outTradeNo, userId) {
  const orderNo = String(outTradeNo || '').trim()
  const id = String(userId || '').trim()
  if (!db || !orderNo || !id) return null
  const row = await db
    .prepare(
      `SELECT out_trade_no, resource_key, amount_fen, status, qr_code_url, pay_url, paid_at, created_at
         FROM paid_orders WHERE out_trade_no = ?1 AND user_id = ?2`
    )
    .bind(orderNo, id)
    .first()
  if (!row) return null
  return {
    orderNo: row.out_trade_no,
    resourceKey: row.resource_key,
    amountFen: Number(row.amount_fen || 0),
    amountLabel: fenToYuan(row.amount_fen),
    status: row.status,
    qrCode: row.qr_code_url || '',
    payUrl: row.pay_url || '',
    paidAt: row.paid_at || null,
    createdAt: Number(row.created_at || 0),
    unlocked: row.status === 'paid' || (await isUnlocked(db, id, row.resource_key)),
  }
}

/**
 * 支付后留联系邮箱：允许覆盖，填错时能改。
 * 列由 0136 迁移添加；未执行迁移时明确报错，不影响支付主链路。
 */
export async function setOrderContactEmail(db, outTradeNo, email, now = Date.now()) {
  const orderNo = String(outTradeNo || '').trim()
  if (!db || !orderNo || !email) return { ok: false, error: 'INVALID_CONTACT' }
  try {
    await db
      .prepare(
        `UPDATE paid_orders SET contact_email = ?2, contact_email_at = ?3
          WHERE out_trade_no = ?1`
      )
      .bind(orderNo, email, now)
      .run()
    return { ok: true }
  } catch {
    return { ok: false, error: 'CONTACT_UNAVAILABLE' }
  }
}

/** 后台订单列表 */
export async function listPaidOrders(db, { status = '', limit = 100 } = {}) {
  const capped = Math.min(500, Math.max(1, Number(limit) || 100))
  const stmt = status
    ? db
        .prepare(
          `SELECT * FROM paid_orders WHERE status = ?1 ORDER BY created_at DESC LIMIT ?2`
        )
        .bind(String(status), capped)
    : db.prepare(`SELECT * FROM paid_orders ORDER BY created_at DESC LIMIT ?1`).bind(capped)
  const result = await stmt.all()
  return result?.results || []
}
