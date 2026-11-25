/**
 * 亲笔签名版实体书订单（Issue #613）。
 *
 * 支付主链路复用 paid_orders；这里只放签名版专属的规则与 book_orders 状态流转：
 *  - 资源键约定：signature:<slug>（无斜杠、小写连字符），价格走 gated_resources.price_fen，
 *    因此游客下单、限频、回调验签、金额校验全部沿用现有逻辑，不需要新链路。
 *  - 签名版是实体书：付完不写 resource_unlocks（无数字权益），改为 book_orders 状态流转。
 *  - 定价：book_signature_editions 存划线原价（分），早鸟价 = round(原价 * 0.88)，
 *    后台保存时把早鸟价同步进 gated_resources.price_fen 作为实际收款金额。
 */

export const SIGNATURE_RESOURCE_PREFIX = 'signature:'

/** 早鸟折扣：8.8 折，用千分比避免浮点误差 */
export const SIGNATURE_DISCOUNT_PERMILLE = 880

/** book_orders.status */
export const BOOK_ORDER_STATUS = {
  pending: 'pending', // 已下单未支付
  awaitingAddress: 'awaiting_address', // 已支付，待填收货信息
  toShip: 'to_ship', // 已填收货信息，待发货
  shipped: 'shipped', // 已发货
  closed: 'closed', // 人工关闭
}

const SLUG_RE = /^[a-z0-9-]{1,80}$/

/** 站长可开签名版的实体书（电子小册《AI Bots 通关指南》不在列，无实体可签） */
export const SIGNATURE_BOOKS = [
  { slug: 'seedance-guide', title: '《Seedance：电影级AI视频创作指南》' },
  { slug: 'llm-underlying-logic', title: '《AI大模型的底层逻辑》' },
  { slug: 'programmer-growth-notes', title: '《程序员成长手记》' },
]

const SIGNATURE_SLUGS = new Set(SIGNATURE_BOOKS.map((book) => book.slug))

export function isKnownSignatureSlug(slug) {
  return SIGNATURE_SLUGS.has(String(slug || ''))
}

export function signatureResourceKey(slug) {
  const clean = String(slug || '').trim()
  return SLUG_RE.test(clean) ? `${SIGNATURE_RESOURCE_PREFIX}${clean}` : ''
}

export function slugFromResourceKey(resourceKey) {
  const key = String(resourceKey || '').trim()
  if (!key.startsWith(SIGNATURE_RESOURCE_PREFIX)) return ''
  const slug = key.slice(SIGNATURE_RESOURCE_PREFIX.length)
  return SLUG_RE.test(slug) ? slug : ''
}

export function isSignatureResourceKey(resourceKey) {
  return Boolean(slugFromResourceKey(resourceKey))
}

/** 早鸟价（分）：round(原价 * 0.88)；原价非法返回 0（0 = 不开放购买） */
export function salePriceFor(basePriceFen) {
  const base = Math.trunc(Number(basePriceFen || 0))
  if (!Number.isFinite(base) || base <= 0) return 0
  return Math.round((base * SIGNATURE_DISCOUNT_PERMILLE) / 1000)
}

/**
 * 收货信息规范化：够用的长度与格式校验。
 * 手机号放宽到「11 位手机号」或「区号-座机号」，不追求运营商段位精确性。
 * @returns {{ok:boolean, name?:string, phone?:string, address?:string, error?:string}}
 */
export function normalizeRecipient(input = {}) {
  const name = String(input.name || '').trim().replace(/\s+/g, ' ')
  const phone = String(input.phone || '').trim()
  const address = String(input.address || '').trim().replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 30) return { ok: false, error: 'INVALID_NAME' }
  if (!/^1\d{10}$/.test(phone) && !/^\d{2,4}-\d{7,8}$/.test(phone)) {
    return { ok: false, error: 'INVALID_PHONE' }
  }
  if (address.length < 8 || address.length > 200) return { ok: false, error: 'INVALID_ADDRESS' }
  return { ok: true, name, phone, address }
}

/**
 * 下单时登记 book_orders 行（幂等）。支付主链路 /api/pay/create 在
 * resourceKey 带 signature: 前缀且 createPaidOrder 成功后调用。
 */
export async function ensureBookOrderRow(db, { orderNo, bookSlug, now = Date.now() } = {}) {
  const no = String(orderNo || '').trim()
  const slug = String(bookSlug || '').trim()
  if (!db || !no || !SLUG_RE.test(slug)) return { ok: false, error: 'INVALID_BOOK_ORDER' }
  await db
    .prepare(
      `INSERT INTO book_orders (out_trade_no, book_slug, status, created_at, updated_at)
       VALUES (?1, ?2, 'pending', ?3, ?3)
       ON CONFLICT(out_trade_no) DO NOTHING`
    )
    .bind(no, slug, now)
    .run()
  return { ok: true, orderNo: no, bookSlug: slug }
}

/**
 * 支付落地（回调 / 主动查单 / 站长补单共用）：pending → awaiting_address。
 * 行缺失时补建（老订单跨上线窗口的场景），幂等可重复调用。
 */
export async function markBookOrderPaid(db, { orderNo, bookSlug, now = Date.now() } = {}) {
  const no = String(orderNo || '').trim()
  const slug = String(bookSlug || '').trim()
  if (!db || !no || !SLUG_RE.test(slug)) return { ok: false, error: 'INVALID_BOOK_ORDER' }
  await ensureBookOrderRow(db, { orderNo: no, bookSlug: slug, now })
  await db
    .prepare(
      `UPDATE book_orders
          SET status = 'awaiting_address', updated_at = ?2
        WHERE out_trade_no = ?1 AND status = 'pending'`
    )
    .bind(no, now)
    .run()
  return { ok: true, orderNo: no }
}

/**
 * 买家填收货信息：awaiting_address / to_ship → to_ship（允许在发货前反复修改）。
 * @returns {{ok:boolean, error?:string}}
 */
export async function setBookOrderAddress(db, orderNo, recipient, { now = Date.now() } = {}) {
  const no = String(orderNo || '').trim()
  if (!db || !no) return { ok: false, error: 'INVALID_ORDER' }
  const checked = normalizeRecipient(recipient)
  if (!checked.ok) return checked
  const result = await db
    .prepare(
      `UPDATE book_orders
          SET status = 'to_ship',
              recipient_name = ?2, recipient_phone = ?3, recipient_address = ?4,
              updated_at = ?5
        WHERE out_trade_no = ?1 AND status IN ('awaiting_address', 'to_ship')`
    )
    .bind(no, checked.name, checked.phone, checked.address, now)
    .run()
  if (!(Number(result?.meta?.changes || 0) > 0)) {
    return { ok: false, error: 'ORDER_NOT_EDITABLE' }
  }
  return { ok: true, ...checked }
}

/** 本人视角查单（地址表单提交前后校验归属与状态） */
export async function getBookOrderForUser(db, orderNo, userId) {
  const no = String(orderNo || '').trim()
  const id = String(userId || '').trim()
  if (!db || !no || !id) return null
  const row = await db
    .prepare(
      `SELECT b.out_trade_no, b.book_slug, b.status, b.recipient_name, b.recipient_phone,
              b.recipient_address, b.tracking_no, b.shipped_at, b.created_at, b.updated_at,
              p.user_id, p.amount_fen, p.status AS pay_status
         FROM book_orders b
         LEFT JOIN paid_orders p ON p.out_trade_no = b.out_trade_no
        WHERE b.out_trade_no = ?1`
    )
    .bind(no)
    .first()
  if (!row || String(row.user_id || '') !== id) return null
  return {
    orderNo: row.out_trade_no,
    bookSlug: row.book_slug,
    status: row.status,
    recipient: { name: row.recipient_name || '', phone: row.recipient_phone || '', address: row.recipient_address || '' },
    trackingNo: row.tracking_no || '',
    shippedAt: row.shipped_at || null,
    amountFen: Number(row.amount_fen || 0),
    payStatus: row.pay_status || '',
    createdAt: Number(row.created_at || 0),
  }
}

/** 后台订单列表：联 paid_orders 带出买家、金额、联系邮箱 */
export async function listBookOrdersWithPayment(db, { status = '', limit = 200 } = {}) {
  if (!db) return []
  const capped = Math.min(500, Math.max(1, Number(limit) || 200))
  const stmt = status
    ? db
        .prepare(
          `SELECT b.*, p.user_id, p.amount_fen, p.contact_email, p.status AS pay_status, p.paid_at
             FROM book_orders b
             LEFT JOIN paid_orders p ON p.out_trade_no = b.out_trade_no
            WHERE b.status = ?1
            ORDER BY b.updated_at DESC LIMIT ?2`
        )
        .bind(String(status), capped)
    : db.prepare(
        `SELECT b.*, p.user_id, p.amount_fen, p.contact_email, p.status AS pay_status, p.paid_at
           FROM book_orders b
           LEFT JOIN paid_orders p ON p.out_trade_no = b.out_trade_no
          ORDER BY b.updated_at DESC LIMIT ?1`
      ).bind(capped)
  const result = await stmt.all()
  return result?.results || []
}

/** 站长发货：to_ship → shipped，登记快递单号 */
export async function shipBookOrder(db, orderNo, trackingNo, { now = Date.now() } = {}) {
  const no = String(orderNo || '').trim()
  const tracking = String(trackingNo || '').trim()
  if (!db || !no) return { ok: false, error: 'INVALID_ORDER' }
  if (tracking.length < 5 || tracking.length > 60) return { ok: false, error: 'INVALID_TRACKING' }
  const result = await db
    .prepare(
      `UPDATE book_orders
          SET status = 'shipped', tracking_no = ?2, shipped_at = ?3, updated_at = ?3
        WHERE out_trade_no = ?1 AND status = 'to_ship'`
    )
    .bind(no, tracking, now)
    .run()
  if (!(Number(result?.meta?.changes || 0) > 0)) {
    return { ok: false, error: 'ORDER_NOT_SHIPPABLE' }
  }
  return { ok: true, orderNo: no, trackingNo: tracking }
}

/** 后台定价：读全部签名版定价配置 */
export async function listSignatureEditions(db) {
  if (!db) return []
  const result = await db.prepare(`SELECT * FROM book_signature_editions`).all()
  return result?.results || []
}

export async function readSignatureEdition(db, slug) {
  const clean = String(slug || '').trim()
  if (!db || !SLUG_RE.test(clean)) return null
  return (
    (await db
      .prepare(`SELECT * FROM book_signature_editions WHERE book_slug = ?1`)
      .bind(clean)
      .first()) || null
  )
}

/**
 * 轻量查询：签名版实收价（分）。
 * 不 import lib/pay/orders.js——那条链拖进整个支付网关 bundle，会让每条 edge
 * 路由的 func 体积多出 ~700 KiB；这里只需要 gated_resources 的一个数字。
 */
export async function readSignatureSaleFen(db, slug) {
  const clean = String(slug || '').trim()
  if (!db || !SLUG_RE.test(clean)) return 0
  const row = await db
    .prepare('SELECT price_fen FROM gated_resources WHERE resource_key = ?1')
    .bind(`${SIGNATURE_RESOURCE_PREFIX}${clean}`)
    .first()
  return Math.max(0, Math.trunc(Number(row?.price_fen || 0)))
}

/**
 * 轻量归属校验：签名版订单必须属于当前登录用户 / 游客（paid_orders 同表查询）。
 * 与 getPaidOrderForUser 同口径，但只取本场景需要的字段，避免支付网关依赖。
 */
export async function getSignaturePayOrderForOwner(db, orderNo, userId) {
  const no = String(orderNo || '').trim()
  const id = String(userId || '').trim()
  if (!db || !no || !id) return null
  const row = await db
    .prepare(
      `SELECT out_trade_no, resource_key, amount_fen, status, paid_at
         FROM paid_orders WHERE out_trade_no = ?1 AND user_id = ?2`
    )
    .bind(no, id)
    .first()
  if (!row) return null
  return {
    orderNo: row.out_trade_no,
    resourceKey: row.resource_key,
    amountFen: Number(row.amount_fen || 0),
    status: row.status,
    paid: row.status === 'paid',
  }
}

/**
 * 轻量留邮箱：与 setOrderContactEmail 同一条 UPDATE。
 * 列由 0136 迁移添加；未执行迁移时静默跳过，不影响主链路。
 */
export async function markOrderContactEmail(db, orderNo, email, now = Date.now()) {
  const no = String(orderNo || '').trim()
  if (!db || !no || !email) return { ok: false, error: 'INVALID_CONTACT' }
  try {
    await db
      .prepare(`UPDATE paid_orders SET contact_email = ?2, contact_email_at = ?3 WHERE out_trade_no = ?1`)
      .bind(no, email, now)
      .run()
    return { ok: true }
  } catch {
    return { ok: false, error: 'CONTACT_UNAVAILABLE' }
  }
}
