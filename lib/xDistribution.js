const X_CREATE_POST_URL = 'https://api.x.com/2/tweets'
const X_MEDIA_UPLOAD_URL = 'https://api.x.com/2/media/upload'
const X_POST_WEIGHT_LIMIT = 280
const X_SHORT_URL_WEIGHT = 23

function cleanText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function characterWeight(character) {
  return character.codePointAt(0) <= 0x7f ? 1 : 2
}

export function weightedTextLength(value) {
  return Array.from(String(value || '')).reduce(
    (total, character) => total + characterWeight(character),
    0,
  )
}

function truncateWeighted(value, limit) {
  const text = cleanText(value)
  if (weightedTextLength(text) <= limit) return text

  const ellipsis = '…'
  const contentLimit = Math.max(0, limit - characterWeight(ellipsis))
  let result = ''
  let weight = 0
  for (const character of Array.from(text)) {
    const nextWeight = characterWeight(character)
    if (weight + nextWeight > contentLimit) break
    result += character
    weight += nextWeight
  }
  return `${result.trimEnd()}${ellipsis}`
}

export function buildXArticlePost({ title, summary, url }) {
  const cleanTitle = cleanText(title)
  const cleanSummary = cleanText(summary)
  const cleanUrl = String(url || '').trim()
  if (!cleanTitle || !cleanUrl) return ''

  const separatorWeight = weightedTextLength('\n\n')
  const bodyBudget = X_POST_WEIGHT_LIMIT - X_SHORT_URL_WEIGHT - separatorWeight
  const titleOnly = truncateWeighted(cleanTitle, bodyBudget)
  const titleWeight = weightedTextLength(titleOnly)
  const summaryBudget = bodyBudget - titleWeight - separatorWeight

  if (!cleanSummary || summaryBudget < 8) {
    return `${titleOnly}\n\n${cleanUrl}`
  }

  const summaryText = truncateWeighted(cleanSummary, summaryBudget)
  return `${titleOnly}\n\n${summaryText}\n\n${cleanUrl}`
}

function percentEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (character) => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ))
}

function bytesToBase64(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function hmacSha1(key, value) {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value))
  return bytesToBase64(new Uint8Array(signature))
}

export async function createXOAuth1Header({
  method = 'POST',
  url = X_CREATE_POST_URL,
  consumerKey,
  consumerSecret,
  accessToken,
  accessTokenSecret,
  nonce,
  timestamp,
}) {
  const oauth = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(timestamp),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }
  const normalizedParameters = Object.entries(oauth)
    .map(([key, value]) => [percentEncode(key), percentEncode(value)])
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => (
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue)
    ))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  const signatureBase = [
    String(method).toUpperCase(),
    percentEncode(url),
    percentEncode(normalizedParameters),
  ].join('&')
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(accessTokenSecret)}`
  const signature = await hmacSha1(signingKey, signatureBase)
  const headerParameters = { ...oauth, oauth_signature: signature }

  return `OAuth ${Object.entries(headerParameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(', ')}`
}

function randomNonce() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getXCredentials(env = {}) {
  const credentials = {
    consumerKey: String(env.X_API_KEY || process.env.X_API_KEY || '').trim(),
    consumerSecret: String(env.X_API_KEY_SECRET || process.env.X_API_KEY_SECRET || '').trim(),
    accessToken: String(env.X_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN || '').trim(),
    accessTokenSecret: String(env.X_ACCESS_TOKEN_SECRET || process.env.X_ACCESS_TOKEN_SECRET || '').trim(),
  }
  return Object.values(credentials).every(Boolean) ? credentials : null
}

export async function publishXPost(text, {
  credentials = getXCredentials(),
  fetchImpl = fetch,
  mediaIds = [],
  nonce = randomNonce(),
  timestamp = Math.floor(Date.now() / 1000),
} = {}) {
  if (!credentials) return { ok: false, status: 503, error: 'X_NOT_CONFIGURED' }

  const authorization = await createXOAuth1Header({
    ...credentials,
    method: 'POST',
    url: X_CREATE_POST_URL,
    nonce,
    timestamp,
  })
  const normalizedMediaIds = (Array.isArray(mediaIds) ? mediaIds : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, 4)
  const body = normalizedMediaIds.length
    ? { text, media: { media_ids: normalizedMediaIds } }
    : { text }
  let response
  try {
    response = await fetchImpl(X_CREATE_POST_URL, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    return { ok: false, status: 502, error: 'X_UNREACHABLE' }
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.data?.id) {
    return {
      ok: false,
      status: response.status >= 400 && response.status < 500 ? 400 : 502,
      error: 'X_PUBLISH_FAILED',
      xStatus: response.status,
      detail: payload?.detail || payload?.title || payload?.errors?.[0]?.detail || null,
    }
  }

  return {
    ok: true,
    post: {
      id: String(payload.data.id),
      text: String(payload.data.text || text),
      url: `https://x.com/i/web/status/${payload.data.id}`,
    },
  }
}

export async function uploadXMedia(media, {
  credentials = getXCredentials(),
  fetchImpl = fetch,
  nonce = randomNonce(),
  timestamp = Math.floor(Date.now() / 1000),
} = {}) {
  if (!credentials) return { ok: false, status: 503, error: 'X_NOT_CONFIGURED' }
  if (!(media instanceof Blob) || !media.size) {
    return { ok: false, status: 400, error: 'X_MEDIA_INVALID' }
  }

  const authorization = await createXOAuth1Header({
    ...credentials,
    method: 'POST',
    url: X_MEDIA_UPLOAD_URL,
    nonce,
    timestamp,
  })
  const form = new FormData()
  form.append('media', media, media.type === 'image/png' ? 'post-image.png' : 'post-image.jpg')
  form.append('media_category', 'tweet_image')

  let response
  try {
    response = await fetchImpl(X_MEDIA_UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: authorization },
      body: form,
      signal: AbortSignal.timeout(60_000),
    })
  } catch {
    return { ok: false, status: 502, error: 'X_MEDIA_UNREACHABLE' }
  }

  const payload = await response.json().catch(() => null)
  const mediaId = payload?.data?.id || payload?.data?.media_id || payload?.media_id_string || payload?.media_id
  if (!response.ok || !mediaId) {
    return {
      ok: false,
      status: response.status >= 400 && response.status < 500 ? 400 : 502,
      error: 'X_MEDIA_UPLOAD_FAILED',
      xStatus: response.status,
      detail: payload?.detail || payload?.title || payload?.errors?.[0]?.detail || null,
    }
  }

  return { ok: true, mediaId: String(mediaId) }
}
