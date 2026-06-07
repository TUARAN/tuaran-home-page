const SENSITIVE_KEYS = new Set([
  'access_token',
  'id_token',
  'refresh_token',
  'client_secret',
  'code',
])

function sanitizeProviderPayload(value) {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sanitizeProviderPayload)

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : sanitizeProviderPayload(entry),
    ])
  )
}

export async function readProviderJson(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export function logOAuthProviderFailure(provider, stage, response, payload) {
  console.error('oauth provider failure', {
    provider,
    stage,
    status: response?.status,
    statusText: response?.statusText,
    payload: sanitizeProviderPayload(payload),
  })
}

export function oauthProviderError(code, status = 400) {
  return Response.json({ error: code }, { status })
}
