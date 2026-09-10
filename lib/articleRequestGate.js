import { getD1 } from './d1'
import { resolveResearchPath } from './researchRuntime'
import { resolveReservedArticleSlug } from './articleReservedSlugs'

// Check before the shared loading boundary starts streaming HTTP 200.
// Do not fetch body/title here or expose whether an unpublished record exists.
export async function gateArticleRequest(pathname, search = '', origin = 'https://2aran.com') {
  const researchPath = pathname.replace(/\.rsc$/, '').replace(/\/$/, '')
  if (researchPath.startsWith('/articles/research/')) {
    try {
      const route = await resolveResearchPath(researchPath)
      if (!route.found || route.status !== 'published') return unavailable(404)
      if (route.href !== researchPath) return new Response(null, { status: 307, headers: { Location: new URL(`${route.href}${search}`, origin).href, 'Cache-Control': 'no-store' } })
      return null
    } catch { return unavailable(503) }
  }
  const match = /^\/articles\/([^/]+?)(?:\.rsc)?\/?$/.exec(pathname)
  if (!match) return null
  let slug
  try { slug = decodeURIComponent(match[1]) } catch { return unavailable(404) }
  try {
    const reserved = await resolveReservedArticleSlug(slug)
    if (reserved.status && reserved.status !== 'published') return unavailable(404)
    if (reserved.redirectHref) return new Response(null, { status: 307, headers: { Location: new URL(`${reserved.redirectHref}${search}`, origin).href, 'Cache-Control': 'no-store' } })
    if (reserved.reserved) return null
    const row = await getD1().prepare("SELECT 1 AS found FROM article_posts WHERE slug = ? AND status = 'published' LIMIT 1").bind(slug).first()
    return row ? null : unavailable(404)
  } catch {
    return unavailable(503)
  }
}

function unavailable(status) {
  const label = status === 404 ? '文章未找到' : '文章暂时无法读取'
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="robots" content="noindex"><title>${label}</title><main><h1>${label}</h1><a href="/articles">返回文章目录</a></main></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}
