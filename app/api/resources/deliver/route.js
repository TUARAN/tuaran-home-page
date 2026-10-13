import { getD1 } from '../../../../lib/db/d1'
import { getUserFromRequest } from '../../../../lib/auth/edgeSession'
import { GUEST_USER_PREFIX, getOrIssueGuest } from '../../../../lib/auth/guestSession'
import { awardGuestSeed, unlockResource } from '../../../../lib/ledger/points'
import { getR2 } from '../../../../lib/db/r2'
import { getResourceDelivery } from '../../../../lib/content/resourceCatalog'
import { recordResourceEvent } from '../../../../lib/content/resourceEvents'
import { getUserRole } from '../../../../lib/auth/userDirectory'
import { embeddedResourcePackage } from '../../../../lib/generated/xReplyExtensionPackage'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const LOCKED_RESOURCE = 'resource:x-reply-clipboard-extension'
const PASSWORD_SALT = '5e41ccb77b481a35a528d3de64c9d81d'
const PASSWORD_HASH = 'b101ab8a1d712d7b036826d4292634fd90896068e9ac282cf96082eda265bb00'

async function validDownloadPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return false
  const bytes = new TextEncoder().encode(`${PASSWORD_SALT}:${password}`)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  const expected = PASSWORD_HASH.match(/../g).map((part) => parseInt(part, 16))
  let different = 0
  for (let index = 0; index < digest.length; index += 1) different |= digest[index] ^ expected[index]
  return different === 0
}

function jsonError(error, status, setCookie = null, details = {}) {
  return Response.json({ error, ...details }, { status, headers: setCookie ? { 'Set-Cookie': setCookie } : undefined })
}

function attachmentHeader(fileName) {
  const safe = String(fileName || 'download').replace(/[\\/\r\n"]/g, '_')
  return `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`
}

async function actorFor(req) {
  const user = await getUserFromRequest(req)
  if (user?.id) {
    const userId = String(user.id)
    if ((await getUserRole(userId)) === 'blocked') return { error: 'USER_BLOCKED', status: 403 }
    return { userId, setCookie: null }
  }
  const guest = await getOrIssueGuest(req)
  if (!guest) return { error: 'GUEST_UNAVAILABLE', status: 400 }
  return { userId: `${GUEST_USER_PREFIX}${guest.gid}`, setCookie: guest.setCookie }
}

async function deliver(req, passwordVerified = false) {
  try {
    const url = new URL(req.url)
    const resourceKey = String(url.searchParams.get('resourceKey') || '').trim()
    const fileKey = String(url.searchParams.get('file') || '').trim()
    const wallpaperId = String(url.searchParams.get('wallpaperId') || '').trim()
    const delivery = getResourceDelivery(resourceKey, fileKey || wallpaperId)
    if (!delivery) return jsonError('DELIVERY_NOT_FOUND', 404)
    const locked = resourceKey === LOCKED_RESOURCE
    if (locked && !passwordVerified) return jsonError('PASSWORD_REQUIRED', 403)

    const db = getD1()
    const actor = await actorFor(req)
    if (actor.error) return jsonError(actor.error, actor.status)

    if (actor.userId.startsWith(GUEST_USER_PREFIX)) {
      await awardGuestSeed(db, actor.userId)
    }

    // 付费工具包按真正点击领取时结算；文字页的解锁仍由 RanbiPaywall 处理。
    if (delivery.kind === 'tool' && delivery.access !== 'free') {
      const result = await unlockResource(db, actor.userId, resourceKey)
      if (!result.ok) {
        return jsonError(result.error || 'UNLOCK_FAILED', result.status || 400, actor.setCookie, {
          cost: Number(result.cost || 0),
          balance: Number(result.balance || 0),
          need: Number(result.need || 0),
        })
      }
    }

    if (delivery.delivery === 'external') {
      await recordResourceEvent(db, {
        userId: actor.userId,
        resourceKey,
        eventType: 'external_open',
      })
      const headers = new Headers({ Location: delivery.externalUrl, 'Cache-Control': 'no-store' })
      if (actor.setCookie) headers.set('Set-Cookie', actor.setCookie)
      return new Response(null, { status: 302, headers })
    }

    let objectKey = delivery.objectKey
    let fileName = delivery.fileName
    let itemKey = delivery.fileKey
    if (delivery.dynamicFile === 'wallpaper') {
      if (!wallpaperId) return jsonError('WALLPAPER_REQUIRED', 400, actor.setCookie)
      const wallpaper = await db
        .prepare('SELECT id, object_key, file_name FROM wallpapers WHERE id = ?1 AND published = 1')
        .bind(wallpaperId)
        .first()
      if (!wallpaper) return jsonError('WALLPAPER_NOT_FOUND', 404, actor.setCookie)
      objectKey = wallpaper.object_key
      fileName = wallpaper.file_name || `${wallpaper.id}.jpg`
      itemKey = wallpaper.id
      await db.prepare('UPDATE wallpapers SET downloads = downloads + 1 WHERE id = ?1').bind(wallpaper.id).run()
    }

    // This release must never be placed in the public R2 bucket.
    const bucket = locked ? null : getR2()
    const object = locked ? null : await bucket.get(objectKey)
    const embedded = locked ? embeddedResourcePackage(objectKey) : object ? null : embeddedResourcePackage(objectKey)
    if (!object && !embedded) return jsonError('FILE_NOT_FOUND', 404, actor.setCookie)
    if (embedded && !locked) {
      await bucket.put(objectKey, embedded.bytes, {
        httpMetadata: { contentType: embedded.contentType },
        customMetadata: { sha256: embedded.sha256, source: 'embedded-release-fallback' },
      }).catch(() => {})
    }
    await recordResourceEvent(db, {
      userId: actor.userId,
      resourceKey,
      eventType: 'download',
      itemKey,
    })

    const headers = new Headers({
      'Content-Type': embedded?.contentType || object?.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': attachmentHeader(fileName),
      'Cache-Control': 'private, no-store',
    })
    const size = embedded?.size ?? object?.size
    if (size != null) headers.set('Content-Length', String(size))
    if (actor.setCookie) headers.set('Set-Cookie', actor.setCookie)
    return new Response(embedded?.bytes || object.body, { headers })
  } catch (error) {
    return Response.json({ error: 'DELIVERY_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}

export async function GET(req) {
  return deliver(req)
}

export async function POST(req) {
  const url = new URL(req.url)
  if (url.searchParams.get('resourceKey') !== LOCKED_RESOURCE || url.searchParams.get('file') !== 'extension-zip') {
    return jsonError('DELIVERY_NOT_FOUND', 404)
  }
  if (Number(req.headers.get('content-length') || 0) > 512) return jsonError('INVALID_PASSWORD', 400)
  let payload
  try {
    payload = await req.json()
  } catch {
    return jsonError('INVALID_PASSWORD', 400)
  }
  if (!(await validDownloadPassword(payload?.password))) return jsonError('INVALID_PASSWORD', 403)
  return deliver(req, true)
}
