/**
 * 虎皮椒支付终端：PC 用 url_qrcode，手机 H5 用 url，两者互斥展示。
 * @see https://www.xunhupay.com/doc/api/pay.html
 */

export const PAY_CLIENT_WEB = 'web'
export const PAY_CLIENT_H5 = 'h5'

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|HarmonyOS|HMSCore/i

/** 规整前端或 UA 推断的终端标识 */
export function normalizePayClientMode(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === PAY_CLIENT_H5 || raw === 'mobile' || raw === 'm') return PAY_CLIENT_H5
  return PAY_CLIENT_WEB
}

export function isH5PayClientMode(mode) {
  return normalizePayClientMode(mode) === PAY_CLIENT_H5
}

/** 服务端根据 User-Agent 推断（客户端未上报时的兜底） */
export function detectPayClientModeFromUa(userAgent = '') {
  const ua = String(userAgent || '')
  if (MOBILE_UA_RE.test(ua)) return PAY_CLIENT_H5
  // iPadOS 13+ 桌面 UA：带 Mobile 子串或触摸 Macintosh
  if (/iPad/i.test(ua)) return PAY_CLIENT_H5
  if (/Macintosh/i.test(ua) && /Mobile/i.test(ua)) return PAY_CLIENT_H5
  return PAY_CLIENT_WEB
}

/** 客户端上报优先，其次 UA */
export function resolvePayClientMode({ requested, userAgent } = {}) {
  const fromClient = String(requested || '').trim()
  if (fromClient) return normalizePayClientMode(fromClient)
  return detectPayClientModeFromUa(userAgent)
}

/**
 * 浏览器侧终端判断：移动 UA 或主指针为 coarse（手机/平板）。
 * 须在客户端组件中调用。
 */
export function detectPayClientModeInBrowser() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return PAY_CLIENT_WEB
  const uaMode = detectPayClientModeFromUa(navigator.userAgent)
  if (uaMode === PAY_CLIENT_H5) return PAY_CLIENT_H5
  try {
    if (window.matchMedia?.('(pointer: coarse)').matches) return PAY_CLIENT_H5
  } catch {
    // matchMedia 不可用时退回 UA
  }
  return PAY_CLIENT_WEB
}

export function payClientModeLabel(mode) {
  return isH5PayClientMode(mode) ? 'H5' : 'Web'
}

/**
 * 按终端裁剪网关返回：H5 只给 payUrl，Web 只给 qrCode。
 * H5 另带 payImageUrl（网关 url_qrcode）仅供「保存到相册 → 微信扫一扫」，不在页内展示二维码图。
 * 禁止在手机上先展示 url_qrcode 再跳 url。
 */
export function shapePaymentForClient(clientMode, { qrCode = '', payUrl = '' } = {}) {
  const mode = normalizePayClientMode(clientMode)
  if (mode === PAY_CLIENT_H5) {
    const url = String(payUrl || '').trim()
    const image = String(qrCode || '').trim()
    return {
      clientMode: mode,
      clientModeLabel: payClientModeLabel(mode),
      qrCode: '',
      payUrl: url,
      payImageUrl: image,
    }
  }
  const qr = String(qrCode || '').trim()
  return {
    clientMode: mode,
    clientModeLabel: payClientModeLabel(mode),
    qrCode: qr,
    payUrl: '',
  }
}