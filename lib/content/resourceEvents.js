import { getResourceCatalogItem, resourceUserLabel } from './resourceCatalog'

const EVENT_LABELS = {
  download: '已领取',
  external_open: '已打开外部资源',
}

export async function recordResourceEvent(db, { userId, resourceKey, eventType, itemKey = '', now = Date.now() }) {
  const id = String(userId || '').trim()
  const key = String(resourceKey || '').trim()
  const type = String(eventType || '').trim()
  if (!db || !id || !key || !type) return null
  const result = await db
    .prepare(
      `INSERT INTO resource_events (user_id, resource_key, event_type, item_key, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(id, key, type, String(itemKey || '').trim(), now)
    .run()
  return Number(result?.meta?.last_row_id || 0) || null
}

function normalizeEvent(row) {
  const resourceKey = String(row?.resource_key || '')
  const item = getResourceCatalogItem(resourceKey)
  return {
    id: Number(row?.id || 0),
    resourceKey,
    eventType: row?.event_type || '',
    eventLabel: EVENT_LABELS[row?.event_type] || row?.event_type || '资源操作',
    itemKey: row?.item_key || '',
    createdAt: row?.created_at || null,
    title: item?.title || resourceKey,
    href: item?.href || '',
    typeLabel: resourceUserLabel(item),
    userDescription: item?.userDescription || '资源操作已记录。',
    adminDescription: item?.adminDescription || '未登记的资源操作。',
    delivery: item?.delivery || 'unknown',
  }
}

export async function listResourceEventsForUser(db, userId, { limit = 100 } = {}) {
  const id = String(userId || '').trim()
  const max = Math.max(1, Math.min(300, Math.trunc(Number(limit) || 100)))
  if (!db || !id) return []
  const result = await db
    .prepare(
      `SELECT id, user_id, resource_key, event_type, item_key, created_at
         FROM resource_events
        WHERE user_id = ?1
        ORDER BY created_at DESC, id DESC
        LIMIT ?2`
    )
    .bind(id, max)
    .all()
  return (result?.results || []).map(normalizeEvent)
}

export async function migrateGuestResourceEvents(db, guestUserId, userId) {
  const guestId = String(guestUserId || '').trim()
  const id = String(userId || '').trim()
  if (!db || !guestId.startsWith('guest:') || !id || id.startsWith('guest:')) return
  await db.prepare('UPDATE resource_events SET user_id = ?1 WHERE user_id = ?2').bind(id, guestId).run()
}
