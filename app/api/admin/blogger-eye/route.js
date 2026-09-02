import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import {
  detectBloggerEyeCloudIp,
  parseBloggerEyeAllowedHosts,
  parseBloggerEyeRunnerConfig,
  runBloggerEyeRegionalChecks,
  visitBloggerEyeTarget,
} from '../../../../lib/bloggerEyeCloud.mjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const MAX_REQUEST_BYTES = 8 * 1024

function environment() {
  return getOptionalRequestContext()?.env || process.env || {}
}

function cloudContext(req) {
  const env = environment()
  const runners = parseBloggerEyeRunnerConfig(env.BLOGGER_EYE_RUNNERS)
  return {
    allowedHosts: parseBloggerEyeAllowedHosts(env.BLOGGER_EYE_ALLOWED_HOSTS),
    colo: req.cf?.colo || req.headers.get('cf-ray')?.split('-').at(-1) || 'unknown',
    runnerSecret: env.BLOGGER_EYE_RUNNER_SECRET || '',
    runners,
  }
}

function errorResponse(error, status = 502) {
  return Response.json(
    { ok: false, error: error?.message || String(error) || '云端请求失败' },
    { status },
  )
}

export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const context = cloudContext(req)
  return Response.json({
    ok: true,
    state: 'online',
    mode: 'cloud-edge',
    message: 'Cloudflare Edge 已连接',
    allowedHosts: context.allowedHosts,
    colo: context.colo,
    runners: {
      ready: context.runners.length > 0 && Boolean(context.runnerSecret),
      count: context.runners.length,
      items: context.runners.map(({ id, label }) => ({ id, label })),
    },
  })
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_REQUEST_BYTES) return errorResponse(new Error('请求体太大'), 413)

  let body
  try {
    body = await req.json()
  } catch {
    return errorResponse(new Error('请求体不是有效 JSON'), 400)
  }

  const action = String(body?.action || '')
  const context = cloudContext(req)
  try {
    if (action === 'ip') {
      const ip = await detectBloggerEyeCloudIp()
      return Response.json({ ok: true, mode: 'cloud-edge', colo: context.colo, ip })
    }

    if (action === 'visit') {
      const visit = await visitBloggerEyeTarget({
        targetUrl: body?.url,
        allowedHosts: context.allowedHosts,
      })
      const ip = await detectBloggerEyeCloudIp().catch((error) => ({
        ip: '',
        error: error?.message || String(error),
      }))
      return Response.json({ ok: true, mode: 'cloud-edge', colo: context.colo, ip, visit })
    }

    if (action === 'regional') {
      const results = await runBloggerEyeRegionalChecks({
        targetUrl: body?.url,
        allowedHosts: context.allowedHosts,
        runners: context.runners,
        secret: context.runnerSecret,
      })
      return Response.json({
        ok: true,
        passed: results.some((item) => item.ok),
        mode: 'regional-runners',
        results,
      })
    }

    return errorResponse(new Error('不支持的操作'), 400)
  } catch (error) {
    const message = String(error?.message || error)
    const status = /请输入|必须|不能|不在授权|重定向/.test(message) ? 400 : 502
    return errorResponse(error, status)
  }
}
