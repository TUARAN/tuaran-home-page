import { GET as sitemap } from '../../../../lib/discoverySitemap'
import { GET as rss } from '../../../../lib/discoveryRss'
import { GET as html } from '../../../../lib/discoveryHtml'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// One Pages function for all discovery formats avoids duplicating the Next
// route runtime and publication policy in three separate Worker bundles.
export async function GET(request, { params }) {
  const { format } = await params
  if (format === 'sitemap') return sitemap(request)
  if (format === 'rss') return rss(request)
  if (format === 'articles') return html(request)
  return new Response('Not found', { status: 404 })
}
