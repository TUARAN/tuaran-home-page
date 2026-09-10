import { researchDiscoverySnapshot, applyResearchDiscovery } from './researchDiscovery'
import { listDiscoverablePosts, escapeDiscoveryXml as xmlEscape, postDiscoveryUrl, postDiscoveryDate } from './articleDiscovery'
import { readDiscoveryAsset, DISCOVERY_HEADERS } from './discoveryAssets'


export async function GET(request) {
  const [staticXml, posts, research] = await Promise.all([
    readDiscoveryAsset(request, '/rss-static.xml'),
    listDiscoverablePosts(),
    researchDiscoverySnapshot(),
  ])
  const xml = applyResearchDiscovery(staticXml, research, 'rss')
  if (!xml.includes('</channel>')) return new Response('RSS unavailable', { status: 503, headers: DISCOVERY_HEADERS })
  const additions = posts.map((post) => {
    const url = xmlEscape(postDiscoveryUrl(post))
    const date = postDiscoveryDate(post)
    return `<item><title>${xmlEscape(post.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${xmlEscape(post.summary || post.contentText?.slice(0, 160))}</description><category>精选文章</category>${date ? `<pubDate>${date.toUTCString()}</pubDate>` : ''}</item>`
  }).join('\n')
  // Keep static full text and versioned GUIDs intact. New posts appear first;
  // readers use pubDate/GUID, not XML element order, for their own sorting.
  const result = xml.replace('<item>', `${additions}\n<item>`)
  const dates = posts.map(postDiscoveryDate).filter(Boolean)
  const staticDate = Date.parse(xml.match(/<lastBuildDate>(.*?)<\/lastBuildDate>/)?.[1] || '') || 0
  const latest = Math.max(staticDate, ...dates.map((date) => date.getTime()))
  const merged = (xml.includes('<item>') ? result : xml.replace('</channel>', `${additions}</channel>`))
    .replace(/<lastBuildDate>.*?<\/lastBuildDate>/, `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>`)
  return new Response(merged, { headers: { ...DISCOVERY_HEADERS, 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
