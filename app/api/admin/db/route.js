import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { getD1AdminSnapshot, getD1TableDetail } from '../../../../lib/dbAdmin'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let db = null
  try {
    db = getD1()
  } catch (error) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      error: 'DB_UNAVAILABLE',
      message: '当前运行环境没有 Cloudflare D1 绑定 DB。本地开发需要通过 Pages/Workers 环境或 wrangler 绑定后才能读取。',
      detail: String(error?.message || error),
    })
  }

  try {
    const tableName = new URL(req.url).searchParams.get('table')
    if (tableName) {
      const table = await getD1TableDetail(db, tableName)
      if (!table) return Response.json({ status: 'error', error: 'TABLE_NOT_FOUND' }, { status: 404 })
      return Response.json({ status: 'ok', generatedAt: Date.now(), table })
    }
    return Response.json(await getD1AdminSnapshot(db))
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'DB_SNAPSHOT_FAILED',
        message: '数据库状态快照读取失败。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}
