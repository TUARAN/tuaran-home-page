import { getD1 } from '../../../../lib/db/d1'
import { applyNotify } from '../../../../lib/pay/orders'
import { normalizeNotifyPayload, readGatewayConfig } from '../../../../lib/pay/gateways/xunhupay'
import { workerEnv } from '../../../../lib/pay/runtimeEnv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

/**
 * 支付回调（网关 -> 本站）。
 * 必须无鉴权，靠 MD5 签名 + 金额校验 + 订单唯一性保证可信。
 * 网关只认 body 里的 "success"，其余一律返回 fail 让网关重试。
 */
async function readPayload(req) {
  const url = new URL(req.url)
  const search = url.search
  let body = null
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || ''
    const text = await req.text()
    if (text) {
      if (contentType.includes('application/json')) {
        try {
          body = JSON.parse(text)
        } catch {
          body = null
        }
      } else {
        const params = new URLSearchParams(text)
        body = {}
        params.forEach((value, key) => {
          body[key] = value
        })
      }
    }
  }
  return normalizeNotifyPayload({ search, body, contentType: req.headers.get('content-type') || '' })
}

async function handle(req) {
  try {
    const payload = await readPayload(req)
    const db = getD1()
    const result = await applyNotify(db, payload, { config: readGatewayConfig(workerEnv()) })
    if (!result.ok) {
      // 不泄露具体失败原因，日志里也不打印签名原文
      return new Response('fail', { status: 400 })
    }
    return new Response('success', { status: 200 })
  } catch {
    return new Response('fail', { status: 500 })
  }
}

export async function GET(req) {
  return handle(req)
}

export async function POST(req) {
  return handle(req)
}
