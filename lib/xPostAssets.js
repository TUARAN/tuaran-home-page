export const X_IMAGE_PREFIX = 'images/x-posts/'
export const X_ASSET_TYPES = ['greeting', 'community-image', 'culture-story', 'crypto-insight', 'us-english']
const LEASE_MS = 10 * 60 * 1000

function randomIndex(length, random) {
  return Math.min(length - 1, Math.floor(Math.max(0, random()) * length))
}

export function assetError(code, status = 502) {
  return Object.assign(new Error(code), { code, status })
}

export function xAssetView(row) {
  return {
    id: row.id, date: row.date_key, slot: row.slot, contentType: row.content_type,
    text: row.text, prompt: row.prompt, objectKey: row.object_key,
    imageUrl: row.object_key ? `/api/admin/morning-greeting/assets/${encodeURIComponent(row.id)}` : '',
    model: row.image_model, sizeBytes: row.size_bytes, status: row.status,
    source: row.asset_source || 'pool', poolAssetId: row.pool_asset_id || '', fallbackError: row.fallback_error || '',
    error: row.error, postUrl: row.post_url, createdAt: row.created_at,
    storage: row.asset_source === 'text' ? 'D1 · 纯文本' : 'R2 · tuaran-media',
  }
}

export async function claimXAsset(db, { date, slot, contentType, now = Date.now() }) {
  const id = `${date}_${slot}`
  const token = crypto.randomUUID()
  await db.prepare(`INSERT INTO x_post_assets
    (id, date_key, slot, content_type, asset_source, created_at, updated_at) VALUES (?, ?, ?, ?, 'pool', ?, ?)
    ON CONFLICT(id) DO NOTHING`).bind(id, date, slot, contentType, now, now).run()
  const result = await db.prepare(`UPDATE x_post_assets SET lease_token = ?, lease_until = ?, updated_at = ?
    WHERE id = ? AND lease_until <= ? AND status NOT IN ('published', 'publishing', 'publish-unknown')`)
    .bind(token, now + LEASE_MS, now, id, now).run()
  const row = await db.prepare('SELECT * FROM x_post_assets WHERE id = ?').bind(id).first()
  return { row, token, acquired: result.meta?.changes === 1 }
}

const PATCH_FIELDS = new Set(['text', 'prompt', 'object_key', 'mime_type', 'size_bytes', 'image_model', 'asset_source', 'pool_asset_id', 'fallback_error', 'status', 'error', 'media_id', 'post_id', 'post_url'])
export async function updateXAsset(db, asset, values) {
  const entries = Object.entries(values).filter(([key]) => PATCH_FIELDS.has(key))
  const now = Date.now()
  const result = await db.prepare(`UPDATE x_post_assets SET ${entries.map(([key]) => `${key} = ?`).join(', ')}, updated_at = ?
    WHERE id = ? AND lease_token = ? AND lease_until > ?`)
    .bind(...entries.map(([, value]) => value), now, asset.row.id, asset.token, now).run()
  if (result.meta?.changes !== 1) throw assetError('X_ASSET_LEASE_LOST', 409)
  Object.assign(asset.row, values)
}

export async function releaseXAsset(db, asset) {
  await db.prepare('UPDATE x_post_assets SET lease_token = ?, lease_until = 0 WHERE id = ? AND lease_token = ?')
    .bind('', asset.row.id, asset.token).run()
}

export async function saveXPostDraft(db, asset, { text, random = Math.random }) {
  const savedFormat = asset.row.asset_source === 'text' ? 'text' : 'image'
  const hasDraft = Boolean(asset.row.text || asset.row.object_key || asset.row.prompt)
  const format = hasDraft ? savedFormat : random() < 0.5 ? 'image' : 'text'
  await updateXAsset(db, asset, { text, asset_source: format === 'text' ? 'text' : asset.row.asset_source })
  return format
}

export async function prepareXImage(options) {
  const { db, bucket, asset, random = Math.random } = options
  if (!bucket) throw assetError('X_IMAGE_R2_NOT_CONFIGURED', 503)
  // Keep pool selections stable on retry. Drafts created by the retired online
  // generator are replaced with a fixed template before they can be retried.
  if (asset.row.object_key && asset.row.asset_source !== 'generated') {
    const stored = await bucket.get(asset.row.object_key)
    if (!stored) throw assetError('X_IMAGE_STORED_OBJECT_MISSING')
    return new Blob([await stored.arrayBuffer()], { type: asset.row.mime_type })
  }
  return prepareXPoolImage({ db, bucket, asset, random })
}

async function prepareXPoolImage({ db, bucket, asset, random }) {
  const result = await db.prepare(`SELECT id, object_key, mime_type, size_bytes, image_model, prompt
    FROM x_image_pool WHERE content_type = ?1 AND enabled = 1
    ORDER BY id`)
    .bind(asset.row.content_type).all()
  const candidates = result.results || []
  if (!candidates.length) throw assetError('X_IMAGE_POOL_UNAVAILABLE')
  const index = randomIndex(candidates.length, random)
  let selected
  let stored
  // Check a bounded random sample; one missing old object should not prevent a post.
  for (let offset = 0; offset < Math.min(candidates.length, 5); offset++) {
    selected = candidates[(index + offset) % candidates.length]
    stored = await bucket.get(selected.object_key)
    if (stored) break
  }
  if (!stored) throw assetError('X_IMAGE_POOL_OBJECT_MISSING')
  const bytes = await stored.arrayBuffer()
  await updateXAsset(db, asset, {
    object_key: selected.object_key, mime_type: selected.mime_type, size_bytes: selected.size_bytes,
    image_model: selected.image_model, prompt: selected.prompt, asset_source: 'pool', pool_asset_id: selected.id,
    status: 'ready', error: '', fallback_error: '',
  })
  return new Blob([bytes], { type: selected.mime_type })
}

export function xPoolView(row) {
  return { id: row.id, label: row.title, contentType: row.content_type, objectKey: row.object_key,
    imageUrl: `/api/admin/morning-greeting/assets/${encodeURIComponent(row.id)}?pool=1`,
    model: row.image_model, prompt: row.prompt, sizeBytes: row.size_bytes, createdAt: row.created_at,
    storage: 'R2 · tuaran-media', source: 'pool' }
}

export async function listXImagePool(db, { type = '' } = {}) {
  const result = await db.prepare(`SELECT * FROM x_image_pool WHERE enabled = 1 ${type ? 'AND content_type = ?' : ''} ORDER BY content_type, id`)
    .bind(...(type ? [type] : [])).all()
  return (result.results || []).map(xPoolView)
}

export async function listXAssets(db, { type = '', status = '', before = '', limit = 24 } = {}) {
  const filters = []
  const args = []
  if (type) { filters.push('content_type = ?'); args.push(type) }
  if (status) { filters.push('status = ?'); args.push(status) }
  if (before) { filters.push('id < ?'); args.push(before) }
  const count = Math.min(50, Math.max(1, Number(limit) || 24))
  const result = await db.prepare(`SELECT * FROM x_post_assets ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY id DESC LIMIT ?`)
    .bind(...args, count + 1).all()
  const rows = result.results || []
  return { items: rows.slice(0, count).map(xAssetView), nextCursor: rows.length > count ? rows[count - 1].id : '' }
}
