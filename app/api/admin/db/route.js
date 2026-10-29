import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
import { getD1 } from '../../../../lib/db/d1'
import { getD1AdminSnapshot, getD1TableDetail } from '../../../../lib/admin/dbAdmin'

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
    const url = new URL(req.url)
    const tableName = url.searchParams.get('table')
    if (tableName) {
      const includeTextBytes = url.searchParams.get('stats') === 'full'
      const table = await getD1TableDetail(db, tableName, { includeTextBytes })
      if (!table) return Response.json({ status: 'error', error: 'TABLE_NOT_FOUND' }, { status: 404 })
      return Response.json({ status: 'ok', generatedAt: Date.now(), table })
    }
    return Response.json(await getD1AdminSnapshot(db))
  } catch (error) {
    const detail = String(error?.message || error)
    const quotaHit = /free tier daily row read limit|exceeded D1|row read limit/i.test(detail)
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: quotaHit ? 'DB_QUOTA_EXCEEDED' : 'DB_SNAPSHOT_FAILED',
        message: quotaHit
          ? 'D1 免费额度今日行读取已用尽，库本身未损坏。可升级付费计划，或等到 UTC 次日 0 点额度重置后再试。'
          : '数据库状态快照读取失败。',
        detail,
      },
      { status: quotaHit ? 503 : 500 }
    )
  }
}
