import { getD1 } from '../../../../lib/db/d1'
import { authorizeCommunitySecret } from '../../../../lib/content/xReplyPersonInvite.mjs'
import { normalizePluginReport, recordPluginReport } from '../../../../lib/community/pluginMonitor.mjs'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function POST(req) {
  try {
    const text = await req.text()
    if (text.length > 64000) return Response.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    let body
    try { body = JSON.parse(text) } catch { return Response.json({ error: 'INVALID_REPORT' }, { status: 400 }) }
    const report = normalizePluginReport(body)
    const db = getD1()
    const auth = await authorizeCommunitySecret(db, req.headers.get('x-community-action-secret'), { deviceId: report.deviceId, bind: true })
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
    return Response.json(await recordPluginReport(db, report), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof RangeError) return Response.json({ error: error.message }, { status: 400 })
    console.error('Plugin report failed', error.message)
    return Response.json({ error: /no such table/.test(error.message) ? 'MIGRATION_REQUIRED' : 'REPORT_UNAVAILABLE' }, { status: 503 })
  }
}
