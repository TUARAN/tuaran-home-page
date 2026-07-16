import {
  MCP_ARTICLES_SCOPE,
  mcpArticlesResource,
  oauthBaseUrl,
} from '../../../../../../lib/oauthServer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export function GET(req) {
  const baseUrl = oauthBaseUrl(req)
  return Response.json({
    resource: mcpArticlesResource(baseUrl),
    resource_name: '涂阿燃文章 MCP',
    resource_documentation: `${baseUrl}/mcp-center`,
    authorization_servers: [baseUrl],
    scopes_supported: [MCP_ARTICLES_SCOPE],
    bearer_methods_supported: ['header'],
  }, {
    headers: { 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' },
  })
}
