import { resolveActor } from './auth.js'
import { getFile, getResourceBySlug, listResources } from './database.js'
import { ensureGuestBalance, getBalance, getGuestSeed, getResourceAccess, isUnlocked, unlockResource } from './points.js'

function json(data, init = {}, setCookie = null) {
  const headers = new Headers(init.headers || {})
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', 'private, no-store')
  headers.set('x-content-type-options', 'nosniff')
  if (setCookie) headers.append('set-cookie', setCookie)
  return new Response(JSON.stringify(data), { ...init, headers })
}

function safeSegment(value, max = 120) {
  const text = String(value || '').trim()
  return text && text.length <= max && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(text) ? text : ''
}

function isTrustedMutation(request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function attachmentHeader(fileName, inline = false) {
  const safe = String(fileName || 'workbuddy-resource').replace(/[\\/\r\n"]/g, '_')
  return `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(safe)}`
}

export function parseByteRange(header, size) {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header)
  if (!match || (!match[1] && !match[2]) || size < 1) return false
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return false
  return { offset: start, length: end - start + 1 }
}

async function actorWithBalance(request, env) {
  const actor = await resolveActor(request, env)
  if (actor.error) return actor
  await ensureGuestBalance(env.DB, actor)
  return actor
}

async function handleMe(request, env) {
  const actor = await actorWithBalance(request, env)
  if (actor.error) return json({ error: actor.error }, { status: actor.status })
  const balance = await getBalance(env.DB, actor.userId)
  return json(
    { authed: !actor.isGuest, isGuest: actor.isGuest, name: actor.name, balance, guestSeed: await getGuestSeed(env.DB) },
    {},
    actor.setCookie,
  )
}

async function handleCatalog(url, env) {
  const catalog = await listResources(env.DB, url.searchParams)
  return json(catalog)
}

async function handleDetail(request, env, slug) {
  const resource = await getResourceBySlug(env.DB, slug)
  if (!resource) return json({ error: 'RESOURCE_NOT_FOUND' }, { status: 404 })
  const actor = await actorWithBalance(request, env)
  if (actor.error) {
    return json({ resource, access: { unlocked: false, balance: 0, cost: resource.costPoints }, authUnavailable: true })
  }
  const access = await getResourceAccess(env.DB, actor, resource)
  return json({ resource, access }, {}, actor.setCookie)
}

async function handleUnlock(request, env, slug) {
  if (!isTrustedMutation(request)) return json({ error: 'UNTRUSTED_ORIGIN' }, { status: 403 })
  const resource = await getResourceBySlug(env.DB, slug)
  if (!resource) return json({ error: 'RESOURCE_NOT_FOUND' }, { status: 404 })
  if (resource.fileCount < 1) {
    return json({ error: 'RESOURCE_NOT_READY', message: '文件尚未导入，当前不会消耗燃币。' }, { status: 409 })
  }
  // Metadata alone is insufficient: do not charge for missing R2 objects.
  for (const entry of resource.files) {
    const file = await getFile(env.DB, slug, entry.id)
    if (!file || !(await env.MEDIA.head(file.object_key))) {
      return json({ error: 'RESOURCE_NOT_READY' }, { status: 409 })
    }
  }
  const actor = await actorWithBalance(request, env)
  if (actor.error) return json({ error: actor.error }, { status: actor.status })
  const result = await unlockResource(env.DB, actor, resource)
  return json(result, { status: result.ok ? 200 : result.status || 400 }, actor.setCookie)
}

async function handleFile(request, env, ctx, slug, fileId) {
  const file = await getFile(env.DB, slug, fileId)
  if (!file) return json({ error: 'FILE_NOT_FOUND' }, { status: 404 })
  const actor = await actorWithBalance(request, env)
  if (actor.error) return json({ error: actor.error }, { status: actor.status })
  if (!(await isUnlocked(env.DB, actor.userId, file.resource_key))) {
    return json({ error: 'RESOURCE_LOCKED', cost: Number(file.cost_points || 0) }, { status: 403 }, actor.setCookie)
  }

  const rangeHeader = request.headers.get('range')
  let range = null
  if (rangeHeader) {
    const metadata = await env.MEDIA.head(file.object_key)
    if (!metadata) return json({ error: 'FILE_NOT_FOUND' }, { status: 404 }, actor.setCookie)
    range = parseByteRange(rangeHeader, metadata.size)
    if (range === false) {
      return json({ error: 'INVALID_RANGE' }, { status: 416, headers: { 'content-range': `bytes */${metadata.size}` } }, actor.setCookie)
    }
  }
  const object = await env.MEDIA.get(file.object_key, range ? { range } : undefined)
  if (!object) return json({ error: 'FILE_NOT_FOUND' }, { status: 404 }, actor.setCookie)
  const safeInlineTypes = new Set(['application/pdf', 'text/plain', 'video/mp4', 'video/webm', 'audio/mpeg', 'image/png', 'image/jpeg', 'image/webp'])
  const inline = new URL(request.url).searchParams.get('mode') === 'read' && file.delivery !== 'download' && safeInlineTypes.has(file.content_type)
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('content-type', file.content_type || headers.get('content-type') || 'application/octet-stream')
  headers.set('content-disposition', attachmentHeader(file.file_name, inline))
  headers.set('cache-control', 'private, no-store')
  headers.set('accept-ranges', 'bytes')
  headers.set('etag', object.httpEtag)
  headers.set('x-content-type-options', 'nosniff')
  headers.set('content-security-policy', "sandbox; default-src 'none'")
  if (actor.setCookie) headers.append('set-cookie', actor.setCookie)

  let status = 200
  if (range) {
    const start = range.offset
    const end = start + range.length - 1
    headers.set('content-range', `bytes ${start}-${end}/${object.size}`)
    headers.set('content-length', String(range.length))
    status = 206
  } else {
    headers.set('content-length', String(object.size))
  }

  ctx.waitUntil(
    env.DB.prepare(
      `INSERT INTO resource_events (user_id, resource_key, event_type, item_key, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
      .bind(actor.userId, file.resource_key, inline ? 'read' : 'download', file.id, Date.now())
      .run()
      .catch((error) => console.error(JSON.stringify({ event: 'workbuddy_resource_event_failed', error: String(error?.message || error) }))),
  )
  return new Response(object.body, { status, headers })
}

async function handleApi(request, env, ctx) {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (request.method === 'GET' && url.pathname === '/api/me') return handleMe(request, env)
  if (request.method === 'GET' && url.pathname === '/api/resources') return handleCatalog(url, env)

  if (parts[0] === 'api' && parts[1] === 'resources' && safeSegment(parts[2])) {
    const slug = safeSegment(parts[2])
    if (request.method === 'GET' && parts.length === 3) return handleDetail(request, env, slug)
    if (request.method === 'POST' && parts[3] === 'unlock' && parts.length === 4) {
      return handleUnlock(request, env, slug)
    }
    if (request.method === 'GET' && parts[3] === 'files' && safeSegment(parts[4]) && parts.length === 5) {
      return handleFile(request, env, ctx, slug, safeSegment(parts[4]))
    }
  }

  return json({ error: 'API_NOT_FOUND' }, { status: 404 })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)

    try {
      return await handleApi(request, env, ctx)
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'workbuddy_request_failed',
          method: request.method,
          path: url.pathname,
          error: String(error?.message || error),
        }),
      )
      return json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 })
    }
  },
}

export { isTrustedMutation, safeSegment }
