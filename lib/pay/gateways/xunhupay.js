/**
 * 虎皮椒（xunhupay）网关适配器。
 * 业务层只通过本文件创建支付/验签，换通道时改这一个文件即可。
 *
 * 约定：金额一律以「分」在站内流转，网关要求「元」，在这里换算。
 * 注意：虎皮椒个人版按「价格表」匹配到账，因此 total_fee 必须是后台预先建好的固定金额。
 */

import { md5 } from '../md5.mjs'

const DEFAULT_GATEWAY_URL = 'https://api.xunhupay.com/payment/do.html'
const DEFAULT_QUERY_URL = 'https://api.xunhupay.com/payment/query.html'

/**
 * 读网关配置：优先传入的 Worker env，其次构建期 process.env。
 * 这里刻意不 import @cloudflare/next-on-pages——网关只做纯逻辑，运行时变量由调用方注入，
 * 这样本文件可以在 node 单测里直接使用。
 */
export function readGatewayConfig(env = {}) {
  const source = env || {}
  const pick = (runtimeValue, buildValue) => String(runtimeValue || buildValue || '').trim()
  return {
    appid: pick(source.XUNHUPAY_APPID, process.env.XUNHUPAY_APPID),
    secret: pick(source.XUNHUPAY_SECRET, process.env.XUNHUPAY_SECRET),
    gatewayUrl: pick(source.XUNHUPAY_GATEWAY_URL, process.env.XUNHUPAY_GATEWAY_URL) || DEFAULT_GATEWAY_URL,
    queryUrl: pick(source.XUNHUPAY_QUERY_URL, process.env.XUNHUPAY_QUERY_URL) || DEFAULT_QUERY_URL,
    notifyBase: (pick(source.PAY_NOTIFY_BASE, process.env.PAY_NOTIFY_BASE) || 'https://2aran.com').replace(/\/$/, ''),
  }
}

export function isConfigured(config = readGatewayConfig()) {
  return Boolean(config.appid && config.secret)
}

/** 去掉空值、null 与 hash 本身，保留原样字符串 */
function signableEntries(params) {
  return Object.entries(params || {})
    .filter(([key, value]) => key !== 'hash' && value !== undefined && value !== null && String(value) !== '')
    .map(([key, value]) => [key, String(value)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
}

/**
 * 网关签名：非空参数按参数名 ASCII 升序拼 k1=v1&k2=v2，末尾加 &key=secret，取 MD5 小写。
 * @param {Record<string, unknown>} params
 * @param {string} secret
 */
export function buildSign(params, secret) {
  const query = signableEntries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return md5(`${query}&key=${secret}`)
}

/** 恒定时间无关紧要（MD5 摘要比较），但要求长度与每一位一致 */
export function verifySign(params, secret) {
  if (!secret) return false
  const provided = String(params?.hash || '').toLowerCase()
  if (!provided) return false
  const expected = buildSign(params, secret)
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

/** 分 → 元字符串（10 → "10.00"） */
export function fenToYuan(fen) {
  return (Number(fen || 0) / 100).toFixed(2)
}

function nonce() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    // 网关在国内，Worker 直连可能很慢；超时宁可失败也不要挂住请求
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    return { ok: false, error: 'GATEWAY_BAD_RESPONSE', status: res.status, raw: text.slice(0, 300) }
  }
  return { ok: res.ok, data, status: res.status }
}

/**
 * 创建支付：返回二维码地址（PC 端由本站本地展示）。
 * @returns {Promise<{ok:boolean, qrCode?:string, payUrl?:string, error?:string, raw?:unknown}>}
 */
export async function createPayment({ orderNo, amountFen, title, notifyUrl, returnUrl, clientIp, config }) {
  if (!isConfigured(config)) return { ok: false, error: 'GATEWAY_NOT_CONFIGURED' }

  const payload = {
    version: '1.1',
    appid: config.appid,
    trade_order_id: orderNo,
    total_fee: fenToYuan(amountFen),
    title: String(title || '付费内容').slice(0, 120),
    time: String(Math.floor(Date.now() / 1000)),
    notify_url: notifyUrl,
    return_url: returnUrl,
    wap_url: returnUrl,
    wap_name: 'TUARAN',
    nonce_str: nonce(),
  }
  payload.hash = buildSign(payload, config.secret)

  const result = await postJson(config.gatewayUrl, payload)
  if (!result.ok || !result.data) {
    return { ok: false, error: 'GATEWAY_REQUEST_FAILED', raw: result.raw || result.data }
  }
  const data = result.data
  if (Number(data.errcode || 0) !== 0) {
    return { ok: false, error: 'GATEWAY_REJECTED', raw: data }
  }
  // 回调签名可选校验；网关返回不签名也不影响下单
  const qrCode = String(data.url_qrcode || '').trim()
  const payUrl = String(data.url || '').trim()
  if (!qrCode && !payUrl) return { ok: false, error: 'GATEWAY_NO_PAYLOAD', raw: data }
  return { ok: true, qrCode, payUrl, orderId: data.orderId || data.orderid || '' }
}

/** 主动查单（兜底用；不同网关支持度不同，失败时由回调兜住） */
export async function queryPayment({ orderNo, config }) {
  if (!isConfigured(config)) return { ok: false, error: 'GATEWAY_NOT_CONFIGURED' }
  const payload = {
    appid: config.appid,
    out_trade_order: orderNo,
    time: String(Math.floor(Date.now() / 1000)),
    nonce_str: nonce(),
  }
  payload.hash = buildSign(payload, config.secret)
  const result = await postJson(config.queryUrl, payload)
  if (!result.ok || !result.data) return { ok: false, error: 'GATEWAY_REQUEST_FAILED' }
  return { ok: true, data: result.data }
}

/** 回调可能是 GET query、form 或 JSON，统一摊平成对象 */
export function normalizeNotifyPayload({ search = '', body = null, contentType = '' } = {}) {
  const out = {}
  if (search) {
    new URLSearchParams(search).forEach((value, key) => {
      out[key] = value
    })
  }
  if (body && typeof body === 'object') {
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null) out[key] = String(value)
    })
  }
  return out
}

/** 订单号兼容字段：虎皮椒回调里一般是 trade_order_id，也见过 out_trade_order */
export function notifyOrderNo(payload) {
  return String(payload?.trade_order_id || payload?.out_trade_order || '').trim()
}

/** 支付成功判定：status=OD */
export function notifyPaid(payload) {
  return String(payload?.status || '').toUpperCase() === 'OD'
}
