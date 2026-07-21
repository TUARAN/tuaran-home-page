export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function archivedResponse() {
  return Response.json(
    { ok: false, error: 'ACTIVITY_ARCHIVED', archivedAt: '2026-07-21', archivePath: '/archives/agent-world-cup' },
    { status: 410 }
  )
}

export const GET = archivedResponse
export const POST = archivedResponse
export const scheduled = async () => undefined
