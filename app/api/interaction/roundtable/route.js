import { getR2 } from '../../../../lib/db/r2'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
const OBJECT_KEY = 'interaction/roundtable-2026-11-01.json'

export async function GET() {
  try {
    const object = await getR2().get(OBJECT_KEY)
    if (!object) return Response.json({ error: '名录暂未准备好' }, { status: 404 })
    return new Response(object.body, { headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'ETag': object.httpEtag,
      'X-Content-Type-Options': 'nosniff',
    } })
  } catch {
    return Response.json({ error: '名录暂时无法加载，请稍后重试' }, { status: 503 })
  }
}
