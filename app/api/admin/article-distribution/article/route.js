import { getOwnerOrReject } from '../../../../../lib/adminAuth'
import { ADMIN_HOST, CANONICAL_HOST } from '../../../../../lib/adminRoutes'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function resolveArticleUrl(req, href) {
  const normalized = String(href || '').trim()
  if (!/^\/articles\/[a-z0-9][a-z0-9/_-]*$/i.test(normalized) || normalized.length > 500) return null
  const requestUrl = new URL(req.url)
  const origin = requestUrl.hostname === ADMIN_HOST
    ? `https://${CANONICAL_HOST}`
    : requestUrl.origin
  return new URL(normalized, origin)
}
export async function GET(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const target = resolveArticleUrl(req, new URL(req.url).searchParams.get('href'))
  if (!target) return Response.json({ error: 'INVALID_ARTICLE_HREF' }, { status: 400 })

  try {
    const response = await fetch(target, {
      headers: { accept: 'text/html' },
      redirect: 'follow',
      cache: 'no-store',
    })
    if (!response.ok) {
      return Response.json({ error: 'ARTICLE_FETCH_FAILED', status: response.status }, { status: 502 })
    }
    const html = await response.text()
    if (!html || html.length > 3_000_000) {
      return Response.json({ error: 'ARTICLE_HTML_INVALID' }, { status: 502 })
    }
    return Response.json({ status: 'ok', sourceUrl: target.href, html })
  } catch (error) {
    return Response.json({ error: 'ARTICLE_FETCH_FAILED', detail: String(error?.message || error) }, { status: 502 })
  }
}
