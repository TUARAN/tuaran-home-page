import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../lib/adminAuth'
import { buildXArticlePost, getXCredentials, publishXPost } from '../../../../lib/xDistribution'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function resolveArticleUrl(value, requestUrl) {
  let url
  try {
    url = new URL(String(value || '').trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const requestHost = new URL(requestUrl).hostname.toLowerCase()
  const allowedHosts = new Set(['2aran.com', 'www.2aran.com', requestHost])
  if (!allowedHosts.has(url.hostname.toLowerCase())) return null
  url.hash = ''
  return url.toString()
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 })
  }

  const url = resolveArticleUrl(body?.url, req.url)
  const text = buildXArticlePost({
    title: body?.title,
    summary: body?.summary,
    url,
  })
  if (!url || !text) {
    return Response.json({ ok: false, error: 'INVALID_ARTICLE' }, { status: 400 })
  }

  const cloudflareEnv = getOptionalRequestContext()?.env || {}
  const result = await publishXPost(text, { credentials: getXCredentials(cloudflareEnv) })
  if (!result.ok) return Response.json(result, { status: result.status })
  return Response.json(result, { status: 201 })
}
