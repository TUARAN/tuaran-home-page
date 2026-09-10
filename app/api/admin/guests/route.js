import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { getD1 } from '../../../../lib/d1'
import { createGuestDirectoryCache } from '../../../../lib/guestDirectoryCache'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const readGuestDirectory = createGuestDirectoryCache()

function dbOrNull() {
  try {
    return getD1()
  } catch {
    return null
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const db = dbOrNull()
  if (!db) {
    return Response.json({
      status: 'unavailable',
      generatedAt: Date.now(),
      message: '当前运行环境没有 D1 绑定，无法读取游客目录。',
    })
  }

  try {
    const url = new URL(req.url)
    const snapshot = await readGuestDirectory(db, {
      limit: url.searchParams.get('limit'),
      status: url.searchParams.get('status'),
      cursor: url.searchParams.get('cursor'),
    }, url.searchParams.get('fresh') === '1')
    return Response.json({ status: 'ok', ...snapshot }, {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        generatedAt: Date.now(),
        error: 'GUEST_DIRECTORY_READ_FAILED',
        message: '游客物化目录读取失败（迁移 0088 是否已应用？）。',
        detail: String(error?.message || error),
      },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response
  return Response.json({ error: 'GUEST_POINTS_UNSUPPORTED' }, { status: 400 })
}
