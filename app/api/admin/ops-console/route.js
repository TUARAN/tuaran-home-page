import { getOwnerOrReject } from '../../../../lib/adminAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const startedAt = Date.now()
  return Response.json({
    status: 'reachable',
    label: '站内可访问',
    message: '当前请求已通过站内 admin owner 校验，Ops 入口不再依赖 ops.2aran.com / Cloudflare Access。',
    checkedAt: Date.now(),
    latencyMs: Date.now() - startedAt,
    route: '/admin/ops',
  })
}
