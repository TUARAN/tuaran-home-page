const ISSUER = 'https://token.actions.githubusercontent.com'
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`
const CLOCK_SKEW_SECONDS = 60

let cachedJwks = null
let cachedJwksAt = 0

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}
function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)))
}

function audienceMatches(actual, expected) {
  return Array.isArray(actual) ? actual.includes(expected) : actual === expected
}

export function validateGitHubActionsClaims(claims, options) {
  const now = Math.floor(Date.now() / 1000)
  if (claims?.iss !== ISSUER) throw new Error('unexpected token issuer')
  if (!audienceMatches(claims?.aud, options.audience)) throw new Error('unexpected token audience')
  if (!Number.isFinite(claims?.exp) || claims.exp < now - CLOCK_SKEW_SECONDS) throw new Error('token expired')
  if (Number.isFinite(claims?.nbf) && claims.nbf > now + CLOCK_SKEW_SECONDS) throw new Error('token not active')
  if (claims?.repository !== options.repository) throw new Error('unexpected repository')
  if (claims?.ref !== options.ref) throw new Error('unexpected git ref')
  const workflowRef = String(claims?.workflow_ref || '')
  if (!workflowRef.startsWith(`${options.repository}/.github/workflows/`) || !workflowRef.endsWith(`@${options.ref}`)) {
    throw new Error('unexpected workflow ref')
  }
  return claims
}

async function getJwks() {
  if (cachedJwks && Date.now() - cachedJwksAt < 60 * 60 * 1000) return cachedJwks
  const discoveryResponse = await fetch(DISCOVERY_URL, { cf: { cacheTtl: 3600, cacheEverything: true } })
  if (!discoveryResponse.ok) throw new Error('OIDC discovery failed')
  const discovery = await discoveryResponse.json()
  const jwksResponse = await fetch(discovery.jwks_uri, { cf: { cacheTtl: 3600, cacheEverything: true } })
  if (!jwksResponse.ok) throw new Error('OIDC JWKS fetch failed')
  cachedJwks = await jwksResponse.json()
  cachedJwksAt = Date.now()
  return cachedJwks
}

export async function verifyGitHubActionsToken(token, options) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) throw new Error('invalid token shape')
  const header = decodeJsonPart(parts[0])
  const claims = decodeJsonPart(parts[1])
  if (header.alg !== 'RS256' || !header.kid) throw new Error('unsupported token algorithm')

  const jwks = await getJwks()
  const jwk = jwks?.keys?.find((item) => item.kid === header.kid && item.kty === 'RSA')
  if (!jwk) throw new Error('token signing key not found')
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  )
  if (!verified) throw new Error('invalid token signature')
  return validateGitHubActionsClaims(claims, options)
}
