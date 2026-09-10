import { researchDiscoverySnapshot, applyResearchDiscovery } from './researchDiscovery'
import { listDiscoverablePosts, escapeDiscoveryXml, postDiscoveryUrl, postDiscoveryDate } from './articleDiscovery'
import { readDiscoveryAsset, DISCOVERY_HEADERS } from './discoveryAssets'


export async function GET(request) {
  const [staticXml, posts, research] = await Promise.all([
    readDiscoveryAsset(request, '/sitemap-static/sitemap.xml'),
    listDiscoverablePosts(),
    researchDiscoverySnapshot(),
  ])
  const xml = applyResearchDiscovery(staticXml, research, 'sitemap')
  if (!xml.includes('</urlset>')) return new Response('Sitemap unavailable', { status: 503, headers: DISCOVERY_HEADERS })
  const additions = posts.map((post) => {
    const date = postDiscoveryDate({ ...post, publishedAt: post.updatedAt || post.publishedAt })
    return `<url><loc>${escapeDiscoveryXml(postDiscoveryUrl(post))}</loc>${date ? `<lastmod>${date.toISOString()}</lastmod>` : ''}</url>`
  }).join('\n')
  return new Response(xml.replace('</urlset>', `${additions}</urlset>`), {
    headers: { ...DISCOVERY_HEADERS, 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
