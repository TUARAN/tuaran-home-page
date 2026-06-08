import {
  cookieNames,
  getSecrets,
  parseCookies,
  verifySession,
} from '../../../../lib/edgeSession'
import { isOwnerUser } from '../../../../lib/ownerAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const OPS_URL = 'https://ops.2aran.com/'
const ACCESS_HOST = 'tuaran666.cloudflareaccess.com'

async function getOwnerOrReject(req) {
  const { sessionSecret } = getSecrets()
  if (!sessionSecret) return { ok: false, response: Response.json({ error: 'MISSING_AUTH_CONFIG' }, { status: 500 }) }
  const cookies = parseCookies(req)
  const token = cookies[cookieNames.session]
  const payload = await verifySession(token, sessionSecret)
  const user = payload?.user || null
  if (!user) return { ok: false, response: Response.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 }) }
  if (!isOwnerUser(user)) return { ok: false, response: Response.json({ error: 'NOT_OWNER' }, { status: 403 }) }
  return { ok: true, user }
}

function classifyOpsResponse(status, location) {
  if (status >= 200 && status < 300) {
    return {
      status: 'reachable',
      label: '可访问',
      message: '入口直接返回成功响应。若浏览器仍打不开，优先检查本地浏览器网络或登录态。',
    }
  }

  if (status >= 300 && status < 400 && location?.includes(ACCESS_HOST)) {
    return {
      status: 'access',
      label: 'Access 正常',
      message: '外层 Cloudflare Access 可达。打开后需要先完成 Access 登录，再进入本机 Agent Ops 控制台。',
    }
  }

  if (status >= 300 && status < 400) {
    return {
      status: 'redirect',
      label: '跳转中',
      message: '入口返回跳转，但不是预期的 Cloudflare Access 登录地址。',
    }
  }

  return {
    status: 'warning',
    label: '响应异常',
    message: `入口返回 HTTP ${status}，需要检查 Cloudflare Access、Tunnel 或本地服务。`,
  }
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const startedAt = Date.now()
  try {
    const res = await fetch(OPS_URL, {
      redirect: 'manual',
      headers: {
        'user-agent': 'tuaran-home-page/ops-console-health',
      },
    })
    const location = res.headers.get('location') || ''
    const classified = classifyOpsResponse(res.status, location)

    return Response.json({
      ...classified,
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      httpStatus: res.status,
      location: location ? new URL(location, OPS_URL).origin : '',
      url: OPS_URL,
    })
  } catch (error) {
    return Response.json({
      status: 'down',
      label: '无法连接',
      message: '站内服务器无法连接 ops.2aran.com。通常是 Tunnel、Cloudflare 边缘或网络链路异常。',
      checkedAt: Date.now(),
      latencyMs: Date.now() - startedAt,
      error: String(error?.message || error),
      url: OPS_URL,
    })
  }
}
