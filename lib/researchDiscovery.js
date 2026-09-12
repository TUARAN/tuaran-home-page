import { listResearchOverrides } from './researchRuntime'
import { escapeDiscoveryXml } from './articleDiscovery'
import { researchPublicSummary } from './researchPublicSummary'

export async function researchDiscoverySnapshot() {
  return (await listResearchOverrides()).map((row) => ({
    ...JSON.parse(row.metadata_json), status: row.status,
  }))
}

export function applyResearchDiscovery(xml, entries, kind) {
  const urls = new Set(entries.map((entry) => `https://2aran.com/articles/research/${entry.category}/${entry.slug}`))
  const tag = kind === 'rss' ? 'item' : 'url'
  const linkTag = kind === 'rss' ? 'link' : 'loc'
  const filtered = xml.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g'), (block) => {
    const url = block.match(new RegExp(`<${linkTag}>([^<]*)<\\/${linkTag}>`))?.[1]?.split('?')[0]
    return urls.has(url) ? '' : block
  })
  const additions = entries.filter((entry) => entry.status === 'published' && !entry.encrypted).map((entry) => {
    const url = escapeDiscoveryXml(`https://2aran.com/articles/research/${entry.category}/${entry.slug}`)
    const date = new Date(entry.modifiedTime || entry.publishedTime || entry.date)
    const validDate = Number.isFinite(date.getTime())
    if (kind === 'rss') return `<item><title>${escapeDiscoveryXml(entry.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${escapeDiscoveryXml(researchPublicSummary(entry))}</description>${validDate ? `<pubDate>${date.toUTCString()}</pubDate>` : ''}</item>`
    return `<url><loc>${url}</loc>${validDate ? `<lastmod>${date.toISOString()}</lastmod>` : ''}</url>`
  }).join('\n')
  return filtered.replace(kind === 'rss' ? '</channel>' : '</urlset>', `${additions}${kind === 'rss' ? '</channel>' : '</urlset>'}`)
}
