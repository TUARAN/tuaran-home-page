import { getOwnerOrReject } from '../../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../../lib/db/d1'
import { enqueuePluginCommand, readPluginMonitor } from '../../../../../lib/community/pluginMonitor.mjs'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
async function serve(req, mutate) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  try {
    const db = getD1()
    const url = new URL(req.url)
    const result = mutate ? await enqueuePluginCommand(db, await req.json()) : await readPluginMonitor(db, { date: url.searchParams.get('date') || undefined, platform: url.searchParams.get('target') || '' })
    return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    if (error instanceof RangeError || error instanceof SyntaxError) return Response.json({ error: error.message }, { status: 400 })
    console.error('Plugin monitor failed', error.message)
    return Response.json({ error: /no such table/.test(error.message) ? 'MIGRATION_REQUIRED' : 'MONITOR_UNAVAILABLE' }, { status: 503 })
  }
}
export const GET = req => serve(req, false)
export const POST = req => serve(req, true)
