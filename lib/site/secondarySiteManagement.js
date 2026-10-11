import { createSiteRegistry, includeRegisteredSites, changeSiteRegistry, SiteRegistryError } from './secondarySiteRegistry.js'

export const SITE_REGISTRY_KEY = 'subsites.registry.v1'
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' }
const json = (body, status = 200) => Response.json(body, { status, headers })

export async function readSiteRegistry(db) {
  const row = await db.prepare('SELECT value, updated_at, updated_by FROM site_settings WHERE key = ?').bind(SITE_REGISTRY_KEY).first()
  if (!row) return { registry: createSiteRegistry(), raw: null, updatedAt: null, updatedBy: '' }
  const registry = JSON.parse(row.value)
  if (registry.version !== 1 || !Number.isSafeInteger(registry.revision) || registry.revision < 0 || !Array.isArray(registry.sites) || !Array.isArray(registry.relations)) {
    throw new Error('Invalid registry document')
  }
  return { registry: includeRegisteredSites(registry), raw: row.value, updatedAt: row.updated_at, updatedBy: row.updated_by }
}

export async function writeSiteRegistry(db, current, registry, user) {
  const updatedAt = Date.now()
  const updatedBy = String(user?.login || user?.id || 'owner')
  const raw = JSON.stringify(registry)
  // Compare the whole previous document, so two editors cannot overwrite each other.
  const result = current.raw === null
    ? await db.prepare('INSERT INTO site_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO NOTHING')
      .bind(SITE_REGISTRY_KEY, raw, updatedAt, updatedBy).run()
    : await db.prepare('UPDATE site_settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = ? AND value = ?')
      .bind(raw, updatedAt, updatedBy, SITE_REGISTRY_KEY, current.raw).run()
  if (result.meta?.changes !== 1) throw new SiteRegistryError('台账已被其他页面更新，请刷新后再保存。', 409)
  return { registry, updatedAt, updatedBy }
}

// Dependencies are injected so the actual route's auth and storage failure paths are testable.
export async function handleSiteManagement(request, { getOwnerOrReject, getD1 }) {
  const guard = await getOwnerOrReject(request)
  if (!guard.ok) {
    const response = new Response(guard.response.body, guard.response)
    response.headers.set('Cache-Control', headers['Cache-Control'])
    response.headers.set('Vary', 'Cookie')
    return response
  }
  if (!['GET', 'POST'].includes(request.method)) return json({ error: '不支持的请求方法。' }, 405)
  if (request.method === 'POST') {
    // Subdomains share cookies: same-site alone is not a sufficient CSRF check.
    if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: '只允许从当前后台页面保存。' }, 403)
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ error: '请使用 JSON 请求。' }, 415)
  }
  let db
  try { db = getD1() } catch { /* Unbound local preview stays explicitly read-only. */ }
  if (!db) {
    if (request.method === 'GET') return json({ registry: createSiteRegistry(), readOnly: true, message: '当前环境未连接 D1，仅展示代码目录；不能保存。' })
    return json({ error: '当前环境未连接 D1，无法保存。' }, 503)
  }
  let body
  if (request.method === 'POST') {
    const raw = await request.text()
    if (raw.length > 16000) return json({ error: '请求内容过大。' }, 413)
    try { body = JSON.parse(raw) } catch { return json({ error: '请求 JSON 无效。' }, 400) }
  }
  try {
    const current = await readSiteRegistry(db)
    if (request.method === 'GET') {
      const { raw: _raw, ...data } = current
      return json({ ...data, readOnly: false })
    }
    if (!Number.isSafeInteger(body?.revision) || body.revision !== current.registry.revision) {
      return json({ error: '台账版本已变化，请刷新后再保存。' }, 409)
    }
    const next = changeSiteRegistry(current.registry, body.action)
    return json({ ...await writeSiteRegistry(db, current, next, guard.user), readOnly: false })
  } catch (error) {
    if (error instanceof SiteRegistryError) return json({ error: error.message }, error.status)
    return json({ error: '台账读写失败，请检查 D1 连接与 site_settings 表；未返回模拟保存结果。' }, 503)
  }
}
