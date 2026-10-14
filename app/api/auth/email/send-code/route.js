export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json({ error: 'LEGACY_EMAIL_AUTH_REMOVED' }, { status: 410 })
}
