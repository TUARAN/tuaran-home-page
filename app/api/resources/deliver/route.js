import { getD1 } from '../../../../lib/d1'
import { getUserFromRequest } from '../../../../lib/edgeSession'
import { GUEST_USER_PREFIX, getOrIssueGuest } from '../../../../lib/guestSession'
import { awardGuestSeed, unlockResource } from '../../../../lib/points'
import { getR2 } from '../../../../lib/r2'
import { getResourceDelivery } from '../../../../lib/resourceCatalog'
import { recordResourceEvent } from '../../../../lib/resourceEvents'
import { getUserRole } from '../../../../lib/userDirectory'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function jsonError(error, status, setCookie = null) {
  return Response.json({ error }, { status, headers: setCookie ? { 'Set-Cookie': setCookie } : undefined })
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

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const resourceKey = String(url.searchParams.get('resourceKey') || '').trim()
    const fileKey = String(url.searchParams.get('file') || '').trim()
    const wallpaperId = String(url.searchParams.get('wallpaperId') || '').trim()
    const delivery = getResourceDelivery(resourceKey, fileKey || wallpaperId)
    if (!delivery) return jsonError('DELIVERY_NOT_FOUND', 404)

    const db = getD1()
    const actor = await actorFor(req)
    if (actor.error) return jsonError(actor.error, actor.status)

    if (actor.userId.startsWith(GUEST_USER_PREFIX)) {
      await awardGuestSeed(db, actor.userId)
    }

    // 付费工具包按真正点击领取时结算；文字页的解锁仍由 RanbiPaywall 处理。
    if (delivery.defaultCost != null) {
      const result = await unlockResource(db, actor.userId, resourceKey)
      if (!result.ok) return jsonError(result.error || 'UNLOCK_FAILED', result.status || 400, actor.setCookie)
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

    const object = await getR2().get(objectKey)
    if (!object) return jsonError('FILE_NOT_FOUND', 404, actor.setCookie)
    await recordResourceEvent(db, {
      userId: actor.userId,
      resourceKey,
      eventType: 'download',
      itemKey,
    })

    const headers = new Headers({
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': attachmentHeader(fileName),
      'Cache-Control': 'private, no-store',
    })
    if (object.size != null) headers.set('Content-Length', String(object.size))
    if (actor.setCookie) headers.set('Set-Cookie', actor.setCookie)
    return new Response(object.body, { headers })
  } catch (error) {
    return Response.json({ error: 'DELIVERY_FAILED', detail: String(error?.message || error) }, { status: 500 })
  }
}
