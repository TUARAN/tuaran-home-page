// 工作台 API 的请求入口：校验来源与登录，再把 userId 交给业务函数。
// 登录态沿用主站 Cookie（Domain=.2aran.com），不新建身份体系。
import { isAccountOrigin } from '../../site/subsiteOrigins.js'

function headers(request) {
  const h = new Headers({
    'Cache-Control': 'private, no-store',
    Vary: 'Origin, Cookie',
    'X-Content-Type-Options': 'nosniff',
  })
  const origin = request.headers.get('origin')
  if (isAccountOrigin(origin)) {
    h.set('Access-Control-Allow-Origin', origin)
    h.set('Access-Control-Allow-Credentials', 'true')
  }
  return h
}

function reply(request, body, status = 200) {
  return Response.json(body, { status, headers: headers(request) })
}

export function workbenchPreflight(request, methods) {
  const origin = request.headers.get('origin')
  if (!isAccountOrigin(origin)) return reply(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  const h = headers(request)
  h.set('Access-Control-Allow-Methods', `${methods.join(', ')}, OPTIONS`)
  h.set('Access-Control-Allow-Headers', 'Content-Type')
  return new Response(null, { status: 204, headers: h })
}

function sameSite(request, origin) {
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

// services: { getD1, getUserFromRequest }；run(db, userId, request) 返回 { ok, status?, ...data }。
// allowAnonymousGet 只放开 GET：公开榜和已审核话题。写操作、个人监控和待审核话题仍要登录。
export async function handleWorkbench(request, services, run, options = {}) {
  const origin = request.headers.get('origin')
  const writes = request.method !== 'GET'
  const publicGet = Boolean(options.allowAnonymousGet) && !writes
  const originAllowed = origin === null || isAccountOrigin(origin) || (publicGet && sameSite(request, origin))
  // 浏览器写请求必须带受信 Origin；带了 Origin 的读请求也必须受信，除非是同一站点的公开读取。
  if ((writes && origin === null) || !originAllowed) {
    return reply(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)
  }
  try {
    const user = await services.getUserFromRequest(request)
    if (!user?.id && !publicGet) return reply(request, { error: 'UNAUTHENTICATED' }, 401)
    const result = await run(services.getD1(), user?.id ? String(user.id) : '', request)
    const { status, ...body } = result
    return reply(request, result.ok ? body : { error: result.error, ...body }, result.ok ? 200 : status || 400)
  } catch {
    return reply(request, { error: 'WORKBENCH_UNAVAILABLE' }, 503)
  }
}
