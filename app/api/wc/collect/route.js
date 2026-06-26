/**
 * 采集触发入口
 * - Cloudflare Cron Trigger: scheduled event (无需 secret,Cron 来自 CF 内部)
 * - 手动触发 (运维用): GET/POST 携带 ?secret=<WC_COLLECT_SECRET> 或 header `x-wc-secret`
 *
 * 数据源是 openfootball/worldcup.json (公共 JSON,无 key、无限流),
 * 所以这里不需要任何外部 API key —— 只需要 D1 binding。
 *
 * 真正的工作在 lib/wc/collector.js。
 */

import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { runCollect, recordCollectError } from '../../../../lib/wc/collector.js'
import { settleAllFinished } from '../../../../lib/wc/predictions.js'

// 采集完后顺手结算竞猜（猜中发燃币）。best-effort：失败只记日志，不影响采集结果。
async function settleAfterCollect(db, log) {
  try {
    const r = await settleAllFinished(db)
    if (r.settled) log(`settled predictions: ${JSON.stringify(r)}`)
    return r
  } catch (err) {
    log(`settle failed: ${err.message}`)
    return { settled: 0, awarded: 0 }
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const HEADER_SECRET = 'x-wc-secret'

async function handle(request, ctx) {
  const env = ctx?.env || {}
  const requiredSecret = env.WC_COLLECT_SECRET
  const log = (msg) => console.log(`[wc-collect] ${msg}`)

  // 鉴权: cron 不带 query/header,走 CF 平台;手动调用必须带 secret
  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret') || ''
  const headerSecret = request.headers.get(HEADER_SECRET) || ''
  const isCron = request.headers.get('cf-cron') || request.headers.get('x-cron') || false
  const isAuthorized =
    Boolean(isCron) ||
    (requiredSecret && (querySecret === requiredSecret || headerSecret === requiredSecret))

  if (!isAuthorized) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = env.DB
  if (!db) {
    return Response.json({ error: 'D1 binding DB is missing' }, { status: 500 })
  }

  try {
    log('start')
    const stats = await runCollect({ db, log })
    const settle = await settleAfterCollect(db, log)
    log(`done ${JSON.stringify(stats)}`)
    return Response.json({ ok: true, ...stats, predictionsSettled: settle.settled, predictionsAwarded: settle.awarded })
  } catch (err) {
    log(`failed: ${err.message}`)
    await recordCollectError(db, err.message)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// Next.js App Router 第二参是 { params } 不是 CF 上下文,必须直接取 getOptionalRequestContext()。
export const GET = (request) => handle(request, getOptionalRequestContext())
export const POST = (request) => handle(request, getOptionalRequestContext())

// scheduled 事件处理:Cloudflare Pages 不支持 cron triggers,所以线上不会调用它
// (定时走 GitHub Actions 敲上面的 HTTP 端点)。保留它以便将来迁到 Worker 时可直接复用。
export const scheduled = async (event, env, ctx) => {
  const db = env?.DB
  if (!db) {
    console.log('[wc-collect:cron] missing D1 binding DB')
    return
  }
  const log = (msg) => console.log(`[wc-collect:cron] ${msg}`)
  try {
    const stats = await runCollect({ db, log })
    await settleAfterCollect(db, log)
    log(`done ${JSON.stringify(stats)}`)
  } catch (err) {
    log(`failed: ${err.message}`)
    await recordCollectError(db, err.message)
  }
}
