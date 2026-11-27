export const X_ORIGIN = 'https://x.2aran.com'
export const X_HOST = 'x.2aran.com'
export const CANONICAL_HOST = '2aran.com'

export const X_SHORT_REWRITES = Object.freeze({
  '/theory': '/resources/big-interaction-whitepaper',
  '/docs': '/resources/x-reply-clipboard-extension/docs',
  '/extension': '/resources/x-reply-clipboard-extension',
  '/calendar': '/resources/big-interaction-whitepaper/calendar',
  '/roundtable': '/resources/big-interaction-whitepaper/roundtable',
  '/grokbot': '/resources/big-interaction-whitepaper/grokbot',
})

/** x.2aran.com 上由 XSiteFrame 提供导航的页面：主站页头页脚不再叠加。 */
export const X_CHROME_FREE_PATHS = Object.freeze([
  ...Object.keys(X_SHORT_REWRITES),
  ...Object.values(X_SHORT_REWRITES),
])

export const X_LEGACY_TO_SHORT = Object.freeze({
  '/x-workbench': '/',
  '/x': '/theory',
  '/resources/big-interaction-whitepaper': '/theory',
  '/resources/big-interaction-whitepaper/calendar': '/calendar',
  '/resources/big-interaction-whitepaper/roundtable': '/roundtable',
  '/resources/big-interaction-whitepaper/grokbot': '/grokbot',
  '/resources/x-reply-clipboard-extension/docs': '/docs',
  '/resources/x-reply-clipboard-extension': '/extension',
})

export function isXPreviewHost(host) {
  return host.endsWith('.pages.dev') && host !== 'tuaran.pages.dev'
}

/** 使用 XSiteFrame、不走主站页头的路径（含工作台与短路径改写目标）。 */
export const X_SURFACE_PATHS = new Set([
  '/x-workbench',
  ...X_CHROME_FREE_PATHS,
])

/** 顶栏进度条与 route loading 是否套用 X 黑白蓝视觉（非主站灰绿）。 */
export function isXContentSurface(pathname, hostname = '') {
  const path = String(pathname || '').replace(/\/+$/, '') || '/'
  const host = String(hostname || '').split(':')[0].toLowerCase()
  if (host === X_HOST) return true
  if (!X_SURFACE_PATHS.has(path)) return false
  // 客户端首帧尚无 hostname 时，按路径避免 X 域闪主站灰骨架。
  if (!host) return true
  if (isXPreviewHost(host) || host === 'localhost' || host === '127.0.0.1') return true
  return path === '/x-workbench'
}

export function xRouteDecision(host, pathname) {
  const preview = isXPreviewHost(host)
  const onX = host === X_HOST
  const onCanonical = host === CANONICAL_HOST
  const rewriteTo = X_SHORT_REWRITES[pathname]
  if (rewriteTo && (onX || preview)) return { action: 'rewrite', pathname: rewriteTo }
  if (rewriteTo && onCanonical) return { action: 'redirect', location: `${X_ORIGIN}${pathname}`, status: 308 }
  const short = X_LEGACY_TO_SHORT[pathname]
  if (!short) return null
  if (preview) {
    // 预览域的 / 是主站首页。工作台页留在 /x-workbench，方便核未登录榜单。
    if (pathname === '/x-workbench') return null
    return { action: 'redirect', location: short, status: 308 }
  }
  if (onX || onCanonical) {
    return { action: 'redirect', location: `${X_ORIGIN}${short === '/' ? '/' : short}`, status: 308 }
  }
  return null
}
