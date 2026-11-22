export const X_ORIGIN = 'https://x.2aran.com'
export const X_HOST = 'x.2aran.com'
export const CANONICAL_HOST = '2aran.com'

export const X_SHORT_REWRITES = Object.freeze({
  '/theory': '/resources/big-interaction-whitepaper',
  '/docs': '/resources/x-reply-clipboard-extension/docs',
  '/calendar': '/resources/big-interaction-whitepaper/calendar',
  '/roundtable': '/resources/big-interaction-whitepaper/roundtable',
})

export const X_LEGACY_TO_SHORT = Object.freeze({
  '/x-workbench': '/',
  '/x': '/theory',
  '/resources/big-interaction-whitepaper': '/theory',
  '/resources/big-interaction-whitepaper/calendar': '/calendar',
  '/resources/big-interaction-whitepaper/roundtable': '/roundtable',
  '/resources/x-reply-clipboard-extension/docs': '/docs',
})

export function isXPreviewHost(host) {
  return host.endsWith('.pages.dev') && host !== 'tuaran.pages.dev'
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
