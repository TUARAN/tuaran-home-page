const RETURN_TO_BASE = 'https://2aran.local'
const ALLOWED_ABSOLUTE_ORIGINS = new Set(['https://2aran.com', 'https://admin.2aran.com'])

export function normalizeReturnTo(value, fallback = '/') {
  const raw = String(value || '').trim()
  const safeFallback = typeof fallback === 'string' && fallback.startsWith('/') ? fallback : '/'
  if (!raw) return safeFallback
  if (raw.includes('\\')) return safeFallback
  if (/[\u0000-\u001F\u007F]/.test(raw)) return safeFallback

  try {
    if (raw.startsWith('/')) {
      if (raw.startsWith('//')) return safeFallback
      const url = new URL(raw, RETURN_TO_BASE)
      if (url.origin !== RETURN_TO_BASE) return safeFallback
      return `${url.pathname}${url.search}${url.hash}` || safeFallback
    }

    const url = new URL(raw)
    if (!ALLOWED_ABSOLUTE_ORIGINS.has(url.origin)) return safeFallback
    return url.toString()
  } catch {
    return safeFallback
  }
}
