import { getD1 } from '../../../../lib/db/d1'
import {
  COMMUNITY_ACTION_SECRET_HEADER,
  normalizeCommunityActionReport,
  recordCommunityActionReport,
  readCommunityActionHistory,
} from '../../../../lib/community/communityActions'
import { authorizeCommunitySecret } from '../../../../lib/content/xReplyPersonInvite.mjs'
import { createExtensionAlertNotification } from '../../../../lib/site/siteNotifications'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_BODY_CHARS = 20000

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

function isMissingTable(error) {
  return /no such table/i.test(String(error?.message || error))
}

export async function POST(req) {
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })

  const text = await req.text()
  if (text.length > MAX_BODY_CHARS) {
    return Response.json({ ok: false, error: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
  }
  let body = null
  try {
    body = JSON.parse(text || 'null')
  } catch {
    body = null
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ ok: false, error: 'INVALID_REPORT' }, { status: 400 })
  }

  // Some deployed proxies only forward POST for this endpoint. Keep cloud
  // history sync compatible with those deployments while GET is rolled out.
  if (body.action === 'pull') {
    try {
      const authorized = await authorizeCommunitySecret(db, req.headers.get(COMMUNITY_ACTION_SECRET_HEADER), {
        deviceId: body.deviceId || '',
        accountHandle: body.accountHandle || '',
        bind: Boolean(body.deviceId),
      })
      if (!authorized.ok) return Response.json({ ok: false, error: authorized.error }, { status: authorized.status })
      const history = await readCommunityActionHistory(db, { accountHandle: body.accountHandle || '' })
      if (!history.ok) return Response.json(history, { status: 400 })
      return Response.json(history)
    } catch (error) {
      if (isMissingTable(error)) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
      throw error
    }
  }

  try {
    const preview = normalizeCommunityActionReport(body)
    const authorized = await authorizeCommunitySecret(db, req.headers.get(COMMUNITY_ACTION_SECRET_HEADER), {
      deviceId: preview.ok ? preview.deviceId : String(body.deviceId || ''),
      accountHandle: preview.ok ? preview.accountHandle : String(body.accountHandle || ''),
      bind: true,
    })
    if (!authorized.ok) return Response.json({ ok: false, error: authorized.error }, { status: authorized.status })

    const recorded = await recordCommunityActionReport(db, body)
    if (!recorded.ok) return Response.json(recorded, { status: 400 })
    const normalized = normalizeCommunityActionReport(body)
    if (normalized.ok && normalized.platform === 'x') {
      for (const event of normalized.events) {
        if (event.result !== 'failed' || !event.errorCode.startsWith('x-')) continue
        await createExtensionAlertNotification(db, {
          deviceId: normalized.deviceId,
          task: event.task,
          errorCode: event.errorCode,
          accountHandle: event.accountHandle || normalized.accountHandle,
          extensionVersion: normalized.extensionVersion,
          targetId: event.targetId,
        })
      }
    }
    return Response.json({
      ok: true,
      accepted: recorded.accepted,
      dailyReportSaved: recorded.dailyReportSaved,
      commandsFinished: recorded.commandsFinished || 0,
      commands: recorded.commands || [],
    })
  } catch (error) {
    if (isMissingTable(error)) {
      return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    }
    throw error
  }
}

export async function GET(req) {
  const db = dbOrNull()
  if (!db) return Response.json({ ok: false, error: 'DB_UNAVAILABLE' }, { status: 503 })
  try {
    const authorized = await authorizeCommunitySecret(db, req.headers.get(COMMUNITY_ACTION_SECRET_HEADER), { bind: false })
    if (!authorized.ok) return Response.json({ ok: false, error: authorized.error }, { status: authorized.status })
    const accountHandle = new URL(req.url).searchParams.get('accountHandle') || ''
    const history = await readCommunityActionHistory(db, { accountHandle })
    if (!history.ok) return Response.json(history, { status: 400 })
    return Response.json(history)
  } catch (error) {
    if (isMissingTable(error)) return Response.json({ ok: false, error: 'MIGRATION_REQUIRED' }, { status: 503 })
    throw error
  }
}
