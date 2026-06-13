const RETURN_TO_BASE = 'https://2aran.local'

export function normalizeReturnTo(value, fallback = '/') {
  const raw = String(value || '').trim()
  const safeFallback = typeof fallback === 'string' && fallback.startsWith('/') ? fallback : '/'
  if (!raw) return safeFallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return safeFallback
  if (/[\u0000-\u001F\u007F]/.test(raw)) return safeFallback

  try {
    const url = new URL(raw, RETURN_TO_BASE)
    if (url.origin !== RETURN_TO_BASE) return safeFallback
    return `${url.pathname}${url.search}${url.hash}` || safeFallback
  } catch {
    return safeFallback
  }
}
