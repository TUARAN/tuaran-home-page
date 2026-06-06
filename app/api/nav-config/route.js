import { getNavOverrides } from '../../../lib/navOverrides'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 公共接口：返回当前站点菜单的 audience 覆盖映射。
 * 客户端 SessionProvider 在拉 /api/me 的同时拉这个，配合 SITE_CHANNELS
 * 决定每一项菜单是否对当前用户展示。
 *
 * 注意：暴露 overrides 给所有访客是安全的——它只控制菜单展示，
 * 真正的页面访问仍由各页面自己的 owner gate 兜底。
 */
export async function GET() {
  try {
    const overrides = await getNavOverrides()
    return Response.json({ overrides })
  } catch {
    return Response.json({ overrides: {} })
  }
}
