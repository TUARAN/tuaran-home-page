const NOINDEX_EXACT_PATHS = new Set([
  '/account',
  '/articles/creation-calendar',
  '/bookmark-nav',
  '/context-memory',
  '/login',
  '/messages',
  '/notifications',
  '/oauth/authorize',
  '/oauth/authorize/complete',
  '/register',
  '/voice-tasks',
  '/xiaomoli-dad-todo',
])

const NOINDEX_PREFIXES = [
  '/admin',
  '/api',
  '/share',
]

export const LEGACY_PATH_REDIRECTS = Object.freeze({
  '/weekly': Object.freeze({ pathname: '/diary' }),
  '/articles/diary-self-reflection': Object.freeze({ pathname: '/diary' }),
  '/notifications': Object.freeze({ pathname: '/messages' }),
  '/downloads': Object.freeze({ pathname: '/tools', hash: '#downloads' }),
  '/browser-extensions': Object.freeze({ pathname: '/tools', hash: '#downloads' }),
  '/desktop-apps': Object.freeze({ pathname: '/tools', hash: '#downloads' }),
})

function normalizePathname(pathname) {
  const value = String(pathname || '/').split(/[?#]/, 1)[0] || '/'
  if (value === '/') return value
  return value.replace(/\/+$/, '') || '/'
}

export function shouldNoindexPath(pathname) {
  const normalized = normalizePathname(pathname)
  if (NOINDEX_EXACT_PATHS.has(normalized)) return true
  if (NOINDEX_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return true
  }

  // 原始下载文件由对应资源落地页承载搜索入口，避免 PDF 与 HTML 正文互相竞争 canonical。
  return normalized.startsWith('/resources/') && /\.pdf$/i.test(normalized)
}

export function getLegacyPathRedirect(pathname) {
  return LEGACY_PATH_REDIRECTS[normalizePathname(pathname)] || null
}
