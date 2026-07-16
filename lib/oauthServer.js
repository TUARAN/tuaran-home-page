import { getD1 } from './d1'
import { getSecrets } from './edgeSession'

export const MCP_ARTICLES_SCOPE = 'articles:read'
export const OAUTH_ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const OAUTH_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60
const AUTHORIZATION_CODE_TTL_MS = 5 * 60 * 1000
const SUPPORTED_SCOPES = new Set([MCP_ARTICLES_SCOPE])

function base64Url(bytes) {
  let value = ''
  for (const byte of bytes) value += String.fromCharCode(byte)
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function randomToken(length = 32) {
  return base64Url(crypto.getRandomValues(new Uint8Array(length)))
}

export async function hashOAuthToken(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function oauthBaseUrl(req) {
  const configured = String(getSecrets().appUrl || '').trim().replace(/\/$/, '')
  if (configured) return configured
  try {
    return new URL(req.url).origin
  } catch {
    return 'https://2aran.com'
  }
}

export function mcpArticlesResource(baseUrl = 'https://2aran.com') {
  return `${String(baseUrl).replace(/\/$/, '')}/api/mcp/articles`
}

export function protectedResourceMetadataUrl(baseUrl = 'https://2aran.com') {
  return `${String(baseUrl).replace(/\/$/, '')}/.well-known/oauth-protected-resource/api/mcp/articles`
}

function parseJson(value, fallback = []) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function normalizeScopes(value, { allowEmpty = false } = {}) {
  const scopes = [...new Set(String(value || '').trim().split(/\s+/).filter(Boolean))]
  if (!scopes.length && !allowEmpty) return [MCP_ARTICLES_SCOPE]
  if (scopes.some((scope) => !SUPPORTED_SCOPES.has(scope))) return null
  return scopes
}

function validRedirectUri(raw) {
  try {
    const url = new URL(String(raw || ''))
    if (url.hash || url.username || url.password) return false
    if (url.protocol === 'https:') return true
    if (url.protocol === 'workbuddy:') {
      return url.hostname === 'workbuddy' && /^\/mcp\/[^/]+\/oauth\/callback$/.test(url.pathname) && !url.search
    }
    if (url.protocol !== 'http:') return false
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]'
  } catch {
    return false
  }
}

export async function registerOAuthClient(input) {
  const redirectUris = Array.isArray(input?.redirect_uris)
    ? [...new Set(input.redirect_uris.map((value) => String(value || '').trim()).filter(Boolean))]
    : []
  if (!redirectUris.length || redirectUris.length > 5 || redirectUris.some((uri) => !validRedirectUri(uri))) {
    return { ok: false, status: 400, error: 'invalid_redirect_uri' }
  }
  const grantTypes = Array.isArray(input?.grant_types) && input.grant_types.length
    ? [...new Set(input.grant_types.map(String))]
    : ['authorization_code', 'refresh_token']
  if (
    grantTypes.some((type) => !['authorization_code', 'refresh_token'].includes(type)) ||
    !grantTypes.includes('authorization_code') ||
    !grantTypes.includes('refresh_token')
  ) {
    return { ok: false, status: 400, error: 'invalid_client_metadata' }
  }
  const responseTypes = Array.isArray(input?.response_types) && input.response_types.length
    ? [...new Set(input.response_types.map(String))]
    : ['code']
  if (responseTypes.length !== 1 || responseTypes[0] !== 'code') {
    return { ok: false, status: 400, error: 'invalid_client_metadata' }
  }
  const authMethod = String(input?.token_endpoint_auth_method || 'none')
  if (authMethod !== 'none') return { ok: false, status: 400, error: 'invalid_client_metadata' }

  const db = getD1()
  const now = Date.now()
  const clientId = `mcp_${randomToken(24)}`
  const clientName = String(input?.client_name || 'MCP Client').trim().slice(0, 120) || 'MCP Client'
  await db
    .prepare(
      `INSERT INTO oauth_clients
        (client_id, client_name, redirect_uris_json, grant_types_json, token_endpoint_auth_method, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, 'none', ?5, ?5)`
    )
    .bind(clientId, clientName, JSON.stringify(redirectUris), JSON.stringify(grantTypes), now)
    .run()
  return {
    ok: true,
    client: {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: grantTypes,
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      client_id_issued_at: Math.floor(now / 1000),
    },
  }
}

export async function validateAuthorizationRequest(params, baseUrl) {
  const responseType = String(params?.response_type || '')
  const clientId = String(params?.client_id || '').trim()
  const redirectUri = String(params?.redirect_uri || '').trim()
  const resource = String(params?.resource || '').trim()
  const codeChallenge = String(params?.code_challenge || '').trim()
  const codeChallengeMethod = String(params?.code_challenge_method || '')
  const scopes = normalizeScopes(params?.scope)

  if (responseType !== 'code' || !clientId || !redirectUri || !resource || !codeChallenge) {
    return { ok: false, error: 'invalid_request', description: '缺少必要的 OAuth 授权参数。' }
  }
  if (resource !== mcpArticlesResource(baseUrl)) {
    return { ok: false, error: 'invalid_target', description: '目标 MCP Resource 不受此授权服务支持。' }
  }
  if (codeChallengeMethod !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
    return { ok: false, error: 'invalid_request', description: '必须使用 PKCE S256。' }
  }
  if (!scopes) return { ok: false, error: 'invalid_scope', description: '请求包含不受支持的权限。' }

  const db = getD1()
  const client = await db.prepare('SELECT * FROM oauth_clients WHERE client_id = ?1').bind(clientId).first()
  if (!client) return { ok: false, error: 'unauthorized_client', description: 'OAuth Client 未注册。' }
  const redirectUris = parseJson(client.redirect_uris_json)
  if (!redirectUris.includes(redirectUri)) {
    return { ok: false, error: 'invalid_request', description: 'redirect_uri 与注册信息不一致。' }
  }
  return {
    ok: true,
    client: { id: clientId, name: client.client_name || 'MCP Client' },
    redirectUri,
    resource,
    scopes,
    scope: scopes.join(' '),
    state: String(params?.state || ''),
    codeChallenge,
  }
}

export function authorizationErrorRedirect(redirectUri, error, state, description = '') {
  const target = new URL(redirectUri)
  target.searchParams.set('error', error)
  if (description) target.searchParams.set('error_description', description)
  if (state) target.searchParams.set('state', state)
  return target.toString()
}

async function audit(db, eventType, values = {}) {
  await db
    .prepare(
      `INSERT INTO oauth_audit_events (id, event_type, user_id, client_id, resource, detail, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
    .bind(
      crypto.randomUUID(), eventType, values.userId || null, values.clientId || null,
      values.resource || null, String(values.detail || '').slice(0, 500), Date.now()
    )
    .run()
}

export async function createAuthorizationCode({ request, userId }) {
  const db = getD1()
  const code = randomToken(32)
  const codeHash = await hashOAuthToken(code)
  const now = Date.now()
  await db
    .prepare(
      `INSERT INTO oauth_authorization_codes
        (code_hash, client_id, user_id, redirect_uri, scope, resource, code_challenge, expires_at, created_at, used_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL)`
    )
    .bind(
      codeHash, request.client.id, userId, request.redirectUri, request.scope,
      request.resource, request.codeChallenge, now + AUTHORIZATION_CODE_TTL_MS, now
    )
    .run()
  await db
    .prepare(
      `INSERT INTO oauth_consents (user_id, client_id, resource, scope, granted_at, revoked_at)
       VALUES (?1, ?2, ?3, ?4, ?5, NULL)
       ON CONFLICT(user_id, client_id, resource) DO UPDATE SET
         scope = excluded.scope, granted_at = excluded.granted_at, revoked_at = NULL`
    )
    .bind(userId, request.client.id, request.resource, request.scope, now)
    .run()
  await audit(db, 'authorization_granted', {
    userId, clientId: request.client.id, resource: request.resource, detail: request.scope,
  }).catch(() => {})
  const redirect = new URL(request.redirectUri)
  redirect.searchParams.set('code', code)
  if (request.state) redirect.searchParams.set('state', request.state)
  return redirect.toString()
}

async function pkceMatches(verifier, challenge) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest)) === challenge
}

async function issueTokenPair(db, grant, familyId = crypto.randomUUID()) {
  const accessToken = randomToken(32)
  const refreshToken = randomToken(48)
  const [accessHash, refreshHash] = await Promise.all([
    hashOAuthToken(accessToken), hashOAuthToken(refreshToken),
  ])
  const now = Date.now()
  await db.batch([
    db.prepare(
      `INSERT INTO oauth_access_tokens
        (token_hash, user_id, client_id, scope, resource, family_id, expires_at, created_at, revoked_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL)`
    ).bind(accessHash, grant.user_id, grant.client_id, grant.scope, grant.resource, familyId, now + OAUTH_ACCESS_TOKEN_TTL_SECONDS * 1000, now),
    db.prepare(
      `INSERT INTO oauth_refresh_tokens
        (token_hash, family_id, user_id, client_id, scope, resource, expires_at, created_at, rotated_at, revoked_at, replaced_by_hash)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL, NULL, NULL)`
    ).bind(refreshHash, familyId, grant.user_id, grant.client_id, grant.scope, grant.resource, now + OAUTH_REFRESH_TOKEN_TTL_SECONDS * 1000, now),
  ])
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: OAUTH_ACCESS_TOKEN_TTL_SECONDS,
    scope: grant.scope,
  }
}

export async function exchangeAuthorizationCode(params, baseUrl) {
  const code = String(params?.code || '')
  const clientId = String(params?.client_id || '')
  const redirectUri = String(params?.redirect_uri || '')
  const resource = String(params?.resource || '')
  const verifier = String(params?.code_verifier || '')
  if (!code || !clientId || !redirectUri || !resource || !verifier) return { ok: false, error: 'invalid_request' }
  if (resource !== mcpArticlesResource(baseUrl)) return { ok: false, error: 'invalid_target' }

  const db = getD1()
  const codeHash = await hashOAuthToken(code)
  const row = await db.prepare('SELECT * FROM oauth_authorization_codes WHERE code_hash = ?1').bind(codeHash).first()
  if (!row || row.used_at || Number(row.expires_at) <= Date.now()) return { ok: false, error: 'invalid_grant' }
  if (row.client_id !== clientId || row.redirect_uri !== redirectUri || row.resource !== resource) {
    return { ok: false, error: 'invalid_grant' }
  }
  if (!(await pkceMatches(verifier, row.code_challenge))) return { ok: false, error: 'invalid_grant' }
  const used = await db
    .prepare('UPDATE oauth_authorization_codes SET used_at = ?1 WHERE code_hash = ?2 AND used_at IS NULL')
    .bind(Date.now(), codeHash)
    .run()
  if (!Number(used?.meta?.changes || 0)) return { ok: false, error: 'invalid_grant' }
  const tokens = await issueTokenPair(db, row)
  await audit(db, 'token_issued', { userId: row.user_id, clientId, resource }).catch(() => {})
  return { ok: true, tokens }
}

export async function rotateRefreshToken(params, baseUrl) {
  const token = String(params?.refresh_token || '')
  const clientId = String(params?.client_id || '')
  const resource = String(params?.resource || '')
  if (!token || !clientId || !resource) return { ok: false, error: 'invalid_request' }
  if (resource !== mcpArticlesResource(baseUrl)) return { ok: false, error: 'invalid_target' }
  const db = getD1()
  const tokenHash = await hashOAuthToken(token)
  const row = await db.prepare('SELECT * FROM oauth_refresh_tokens WHERE token_hash = ?1').bind(tokenHash).first()
  if (!row || row.revoked_at || Number(row.expires_at) <= Date.now() || row.client_id !== clientId || row.resource !== resource) {
    return { ok: false, error: 'invalid_grant' }
  }
  if (row.rotated_at) {
    const now = Date.now()
    await db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE family_id = ?2').bind(now, row.family_id).run()
    await db.prepare('UPDATE oauth_access_tokens SET revoked_at = ?1 WHERE family_id = ?2').bind(now, row.family_id).run()
    await audit(db, 'refresh_reuse_detected', { userId: row.user_id, clientId, resource }).catch(() => {})
    return { ok: false, error: 'invalid_grant' }
  }
  const requestedScopes = params?.scope ? normalizeScopes(params.scope, { allowEmpty: true }) : row.scope.split(' ')
  const originalScopes = new Set(row.scope.split(' '))
  if (!requestedScopes || requestedScopes.some((scope) => !originalScopes.has(scope))) {
    return { ok: false, error: 'invalid_scope' }
  }
  const grant = { ...row, scope: requestedScopes.join(' ') }
  const tokens = await issueTokenPair(db, grant, row.family_id)
  const replacementHash = await hashOAuthToken(tokens.refresh_token)
  const rotated = await db
    .prepare('UPDATE oauth_refresh_tokens SET rotated_at = ?1, replaced_by_hash = ?2 WHERE token_hash = ?3 AND rotated_at IS NULL')
    .bind(Date.now(), replacementHash, tokenHash)
    .run()
  if (!Number(rotated?.meta?.changes || 0)) {
    await db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE family_id = ?2').bind(Date.now(), row.family_id).run()
    await db.prepare('UPDATE oauth_access_tokens SET revoked_at = ?1 WHERE family_id = ?2').bind(Date.now(), row.family_id).run()
    return { ok: false, error: 'invalid_grant' }
  }
  return { ok: true, tokens }
}

export async function revokeOAuthToken(token, clientId) {
  const db = getD1()
  const tokenHash = await hashOAuthToken(token)
  const refresh = await db.prepare('SELECT family_id, client_id FROM oauth_refresh_tokens WHERE token_hash = ?1').bind(tokenHash).first()
  const access = refresh ? null : await db.prepare('SELECT family_id, client_id FROM oauth_access_tokens WHERE token_hash = ?1').bind(tokenHash).first()
  const row = refresh || access
  if (!row || row.client_id !== clientId) return
  const now = Date.now()
  await db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ?1 WHERE family_id = ?2').bind(now, row.family_id).run()
  await db.prepare('UPDATE oauth_access_tokens SET revoked_at = ?1 WHERE family_id = ?2').bind(now, row.family_id).run()
}

export async function validateMcpAccessToken(req, requiredScope = MCP_ARTICLES_SCOPE) {
  const authorization = req.headers.get('authorization') || ''
  if (!authorization.startsWith('Bearer ')) return { ok: false, status: 401, error: 'missing_token' }
  const token = authorization.slice(7).trim()
  if (!token) return { ok: false, status: 401, error: 'invalid_token' }
  try {
    const db = getD1()
    const tokenHash = await hashOAuthToken(token)
    const row = await db.prepare('SELECT * FROM oauth_access_tokens WHERE token_hash = ?1').bind(tokenHash).first()
    if (!row || row.revoked_at || Number(row.expires_at) <= Date.now()) {
      return { ok: false, status: 401, error: 'invalid_token' }
    }
    if (row.resource !== mcpArticlesResource(oauthBaseUrl(req))) {
      return { ok: false, status: 401, error: 'invalid_token' }
    }
    if (!new Set(String(row.scope || '').split(' ')).has(requiredScope)) {
      return { ok: false, status: 403, error: 'insufficient_scope' }
    }
    return { ok: true, userId: row.user_id, clientId: row.client_id, scope: row.scope }
  } catch {
    return { ok: false, status: 503, error: 'authorization_unavailable' }
  }
}
