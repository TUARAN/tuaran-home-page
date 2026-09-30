import { getBalance, RANBI_ACCOUNTS } from './points'

export const REDEMPTION_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled']

function text(value, max = 300) {
  return String(value || '').trim().slice(0, max)
}

function mapReward(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    emoji: row.emoji || '🎁',
    costPoints: Number(row.cost_points || 0),
    itemType: row.item_type === 'digital' ? 'digital' : 'physical',
    stock: Number(row.stock || 0),
    perUserLimit: Number(row.per_user_limit || 0),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order || 0),
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
  }
}

function mapRedemption(row, { includePrivate = false } = {}) {
  const output = {
    id: row.id,
    rewardId: row.reward_id,
    rewardTitle: row.reward_title,
    costPoints: Number(row.cost_points || 0),
    itemType: row.item_type,
    status: row.status,
    trackingNo: row.tracking_no || '',
    createdAt: Number(row.created_at || 0),
    updatedAt: Number(row.updated_at || 0),
  }
  if (includePrivate) {
    output.userId = row.user_id
    output.recipientName = row.recipient_name || ''
    output.contact = row.contact || ''
    output.shippingAddress = row.shipping_address || ''
    output.userNote = row.user_note || ''
    output.adminNote = row.admin_note || ''
  }
  return output
}

export async function listPublicRewards(db, userId = '') {
  const result = await db
    .prepare(
      `SELECT ri.*,
        (SELECT COUNT(*) FROM reward_redemptions rr
          WHERE rr.reward_id = ri.id AND rr.user_id = ?1 AND rr.status != 'cancelled') AS redeemed_count
       FROM reward_items ri
       WHERE ri.active = 1
       ORDER BY ri.sort_order DESC, ri.created_at DESC`
    )
    .bind(String(userId || ''))
    .all()
  return (result?.results || []).map((row) => ({
    ...mapReward(row),
    redeemedCount: Number(row.redeemed_count || 0),
  }))
}

export async function listUserRedemptions(db, userId, limit = 30) {
  const result = await db
    .prepare(
      `SELECT * FROM reward_redemptions
       WHERE user_id = ?1 ORDER BY created_at DESC LIMIT ?2`
    )
    .bind(String(userId || ''), Math.min(100, Math.max(1, Number(limit) || 30)))
    .all()
  return (result?.results || []).map((row) => mapRedemption(row))
}

export async function redeemReward(db, userId, rewardId, input = {}) {
  const uid = text(userId, 200)
  const rid = text(rewardId, 100)
  if (!uid || !rid) return { ok: false, status: 400, error: 'INVALID_REDEMPTION' }

  const item = await db.prepare('SELECT * FROM reward_items WHERE id = ?1').bind(rid).first()
  if (!item || !item.active) return { ok: false, status: 404, error: 'REWARD_NOT_FOUND' }
  if (Number(item.stock) === 0) return { ok: false, status: 409, error: 'OUT_OF_STOCK' }

  const recipientName = text(input.recipientName, 80)
  const contact = text(input.contact, 120)
  const shippingAddress = text(input.shippingAddress, 500)
  const userNote = text(input.userNote, 300)
  if (item.item_type === 'physical' && (!recipientName || !contact || !shippingAddress)) {
    return { ok: false, status: 400, error: 'SHIPPING_INFO_REQUIRED' }
  }

  const orderId = crypto.randomUUID()
  const now = Date.now()
  const results = await db.batch([
    db.prepare(
      `INSERT INTO reward_redemptions
        (id, user_id, reward_id, reward_title, cost_points, item_type, status,
         recipient_name, contact, shipping_address, user_note, created_at, updated_at)
       SELECT ?1, ?2, ri.id, ri.title, ri.cost_points, ri.item_type, 'pending',
              ?4, ?5, ?6, ?7, ?8, ?8
       FROM reward_items ri JOIN user_points up ON up.user_id = ?2
       WHERE ri.id = ?3 AND ri.active = 1 AND (ri.stock = -1 OR ri.stock > 0)
         AND up.balance >= ri.cost_points
         AND (ri.per_user_limit = 0 OR
           (SELECT COUNT(*) FROM reward_redemptions previous
            WHERE previous.user_id = ?2 AND previous.reward_id = ri.id AND previous.status != 'cancelled') < ri.per_user_limit)`
    ).bind(orderId, uid, rid, recipientName, contact, shippingAddress, userNote, now),
    db.prepare(
      `INSERT OR IGNORE INTO ranbi_transfers
        (from_account, to_account, amount, reason, ref, created_at)
       SELECT user_id, ?2, cost_points, 'reward_redeem', 'reward:' || id, ?3
       FROM reward_redemptions WHERE id = ?1`
    ).bind(orderId, RANBI_ACCOUNTS.burn, now),
    db.prepare(
      `UPDATE reward_items SET stock = stock - 1, updated_at = ?2
       WHERE id = ?3 AND stock > 0 AND EXISTS (SELECT 1 FROM reward_redemptions WHERE id = ?1)`
    ).bind(orderId, now, rid),
  ])

  if (!(Number(results?.[0]?.meta?.changes || 0) > 0)) {
    const [balance, countRow, latest] = await Promise.all([
      getBalance(db, uid),
      db.prepare(
        `SELECT COUNT(*) AS count FROM reward_redemptions
         WHERE user_id = ?1 AND reward_id = ?2 AND status != 'cancelled'`
      ).bind(uid, rid).first(),
      db.prepare('SELECT active, stock, cost_points, per_user_limit FROM reward_items WHERE id = ?1').bind(rid).first(),
    ])
    if (!latest?.active) return { ok: false, status: 404, error: 'REWARD_NOT_FOUND' }
    if (Number(latest.stock) === 0) return { ok: false, status: 409, error: 'OUT_OF_STOCK' }
    if (Number(latest.per_user_limit) > 0 && Number(countRow?.count || 0) >= Number(latest.per_user_limit)) {
      return { ok: false, status: 409, error: 'USER_LIMIT_REACHED' }
    }
    return { ok: false, status: 402, error: 'INSUFFICIENT_BALANCE', balance, cost: Number(latest.cost_points || 0) }
  }

  const row = await db.prepare('SELECT * FROM reward_redemptions WHERE id = ?1').bind(orderId).first()
  return { ok: true, redemption: mapRedemption(row), balance: await getBalance(db, uid) }
}

export async function listAdminRewards(db) {
  const [items, orders] = await Promise.all([
    db.prepare('SELECT * FROM reward_items ORDER BY sort_order DESC, created_at DESC').all(),
    db.prepare('SELECT * FROM reward_redemptions ORDER BY created_at DESC LIMIT 200').all(),
  ])
  return {
    items: (items?.results || []).map(mapReward),
    orders: (orders?.results || []).map((row) => mapRedemption(row, { includePrivate: true })),
  }
}

export async function upsertReward(db, input = {}) {
  const id = text(input.id, 100) || crypto.randomUUID()
  const title = text(input.title, 120)
  const description = text(input.description, 500)
  const emoji = text(input.emoji, 16) || '🎁'
  const costPoints = Math.trunc(Number(input.costPoints) || 0)
  const itemType = input.itemType === 'digital' ? 'digital' : 'physical'
  const stock = Math.trunc(Number(input.stock))
  const perUserLimit = Math.max(0, Math.trunc(Number(input.perUserLimit) || 0))
  const active = input.active ? 1 : 0
  const sortOrder = Math.trunc(Number(input.sortOrder) || 0)
  if (!title || costPoints < 1 || !Number.isFinite(stock) || stock < -1) {
    return { ok: false, status: 400, error: 'INVALID_REWARD' }
  }
  const now = Date.now()
  await db.prepare(
    `INSERT INTO reward_items
      (id, title, description, emoji, cost_points, item_type, stock, per_user_limit, active, sort_order, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, description = excluded.description,
       emoji = excluded.emoji, cost_points = excluded.cost_points, item_type = excluded.item_type,
       stock = excluded.stock, per_user_limit = excluded.per_user_limit, active = excluded.active,
       sort_order = excluded.sort_order, updated_at = excluded.updated_at`
  ).bind(id, title, description, emoji, costPoints, itemType, stock, perUserLimit, active, sortOrder, now).run()
  return { ok: true, id }
}

export async function updateRedemption(db, input = {}) {
  const id = text(input.id, 100)
  const status = text(input.status, 20)
  if (!id || !REDEMPTION_STATUSES.includes(status)) return { ok: false, status: 400, error: 'INVALID_STATUS' }
  const result = await db.prepare(
    `UPDATE reward_redemptions SET status = ?2, tracking_no = ?3, admin_note = ?4, updated_at = ?5 WHERE id = ?1`
  ).bind(id, status, text(input.trackingNo, 120), text(input.adminNote, 500), Date.now()).run()
  if (!Number(result?.meta?.changes || 0)) return { ok: false, status: 404, error: 'REDEMPTION_NOT_FOUND' }
  return { ok: true }
}
