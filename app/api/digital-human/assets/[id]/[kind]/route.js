import { getD1 } from '../../../../../../lib/d1'
import { getUserFromRequest } from '../../../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../../../lib/ownerAuth'
import { getAvatarR2 } from '../../../../../../lib/r2'
import { getDigitalHumanSigningSecret } from '../../../../../../lib/digitalHuman/config'
import { getDigitalHumanJob } from '../../../../../../lib/digitalHuman/jobs'
import { verifyDigitalHumanSignature } from '../../../../../../lib/digitalHuman/signing'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function safeFilename(value) {
  return String(value || 'media').replace(/["\\\r\n]/g, '_')
}

function keyForKind(job, kind) {
  if (kind === 'source') return job.source_object_key
  if (kind === 'audio') return job.audio_object_key
  if (kind === 'result') return job.output_object_key
  return ''
}

function contentTypeForKind(job, kind, object) {
  if (kind === 'source') return job.source_content_type || object?.httpMetadata?.contentType || 'image/jpeg'
  if (kind === 'audio') return 'audio/mpeg'
  if (kind === 'result') return object?.httpMetadata?.contentType || 'video/mp4'
  return 'application/octet-stream'
}

export async function GET(req, { params }) {
  let db
  let bucket
  try {
    db = getD1()
    bucket = getAvatarR2()
  } catch {
    return Response.json({ error: 'DIGITAL_HUMAN_UNAVAILABLE' }, { status: 503 })
  }

  const { id, kind } = await params
  const normalizedKind = String(kind || '')
  if (!['source', 'audio', 'result'].includes(normalizedKind)) {
    return Response.json({ error: 'INVALID_ASSET_KIND' }, { status: 400 })
  }

  const job = await getDigitalHumanJob(db, id)
  if (!job) return Response.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (normalizedKind === 'result') {
    const user = await getUserFromRequest(req)
    if (!user?.id || (String(user.id) !== String(job.user_id) && !isOwnerUser(user))) {
      return Response.json({ error: 'NOT_AUTHORIZED' }, { status: user ? 403 : 401 })
    }
    if (job.expires_at && Number(job.expires_at) <= Date.now()) {
      if (job.output_object_key) await bucket.delete(job.output_object_key).catch(() => {})
      return Response.json({ error: 'RESULT_EXPIRED' }, { status: 410 })
    }
  } else {
    let verified = false
    try {
      const url = new URL(req.url)
      verified = await verifyDigitalHumanSignature(getDigitalHumanSigningSecret(), {
        purpose: 'asset',
        jobId: job.id,
        kind: normalizedKind,
        expires: url.searchParams.get('expires'),
        signature: url.searchParams.get('signature'),
      })
    } catch {
      verified = false
    }
    if (!verified) return Response.json({ error: 'INVALID_OR_EXPIRED_SIGNATURE' }, { status: 403 })
  }

  const objectKey = keyForKind(job, normalizedKind)
  if (!objectKey) return Response.json({ error: 'ASSET_NOT_READY' }, { status: 404 })
  const object = await bucket.get(objectKey)
  if (!object) return Response.json({ error: 'OBJECT_NOT_FOUND' }, { status: 404 })

  const download = new URL(req.url).searchParams.get('download') === '1'
  const fileName = normalizedKind === 'result'
    ? `digital-human-${job.id}.mp4`
    : normalizedKind === 'audio'
      ? 'speech.mp3'
      : job.source_file_name || 'source'

  return new Response(object.body, {
    headers: {
      'Content-Type': contentTypeForKind(job, normalizedKind, object),
      'Content-Length': String(object.size),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeFilename(fileName)}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  })
}
