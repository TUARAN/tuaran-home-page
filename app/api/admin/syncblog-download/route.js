import { GET as packageStatus } from '../community-actions/extension-package/route'
import { getOwnerOrReject } from '../../../../lib/admin/adminAuth'
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function GET(req) {
  const url = new URL(req.url)
  url.searchParams.set('plugin', 'ai-distributor')
  return packageStatus(new Request(url, { headers: req.headers }))
}
async function retired(req) {
  const auth = await getOwnerOrReject(req)
  if (!auth.ok) return auth.response
  return Response.json({ error: 'MANAGED_PACKAGE_DELIVERY', message: '安装包已改为自动打包交付，请使用人员码或站长下载。' }, { status: 410 })
}
export const POST = retired
export const PUT = retired
