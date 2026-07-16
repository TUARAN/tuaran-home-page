import {
  MCP_ARTICLES_SCOPE,
  oauthBaseUrl,
} from '../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET(req) {
  const issuer = oauthBaseUrl(req)
  return Response.json({
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    revocation_endpoint: `${issuer}/api/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [MCP_ARTICLES_SCOPE],
    service_documentation: `${issuer}/mcp-center`,
  }, {
    headers: { 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' },
  })
}
