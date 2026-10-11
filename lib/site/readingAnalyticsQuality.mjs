export const MIN_QUALIFIED_READING_MS = 8_000

const AUTOMATED_UA_RE = /(bot\b|crawler\b|spider\b|slurp\b|bingpreview\b|headless\b|lighthouse\b|pagespeed\b|curl\b|wget\b|python-requests\b|go-http-client\b|facebookexternalhit\b|preview\b)/i

function normalizedHost(value) {
  return String(value || '').trim().toLowerCase().split(':')[0]
}

function originHost(value) {
  try {
    return normalizedHost(new URL(String(value || '')).host)
  } catch {
    return ''
  }
}

export function assessReadingHit({ host, origin, secFetchSite, userAgent, body } = {}) {
  const engagedMs = Math.max(0, Math.min(60 * 60 * 1000, Number(body?.engagedMs) || 0))
  const requestHost = normalizedHost(host)
  const sourceHost = originHost(origin)
  const fetchSite = String(secFetchSite || '').toLowerCase()
  const ua = String(userAgent || '').trim()

  if (body?.signal !== 'content_read_v2') return { qualified: false, reason: 'invalid_signal', engagedMs }
  if (!requestHost || !sourceHost || sourceHost !== requestHost) return { qualified: false, reason: 'origin_mismatch', engagedMs }
  if (!['same-origin', 'same-site'].includes(fetchSite)) return { qualified: false, reason: 'cross_site_request', engagedMs }
  if (!ua || AUTOMATED_UA_RE.test(ua)) return { qualified: false, reason: 'automated_user_agent', engagedMs }
  if (body?.visibilityState !== 'visible') return { qualified: false, reason: 'page_not_visible', engagedMs }
  if (engagedMs < MIN_QUALIFIED_READING_MS) return { qualified: false, reason: 'insufficient_engagement', engagedMs }
  return { qualified: true, reason: 'qualified', engagedMs }
}
