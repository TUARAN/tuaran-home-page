export const RSS_PARSE_MAX_ENTRIES = 8
export const RSS_SUMMARY_MAX = 180
const ENTRY_HEAD_CHARS = 16000

function decodeEntities(input) {
  return String(input || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&')
}

function safeCodePoint(n) {
  try {
    return String.fromCodePoint(n)
  } catch {
    return ''
  }
}

function stripTags(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstTag(block, tag) {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
  return m ? m[1] : ''
}

function atomLink(block) {
  const links = [...block.matchAll(/<link\b([^>]*?)\/?>/gi)].map((m) => m[1])
  let fallback = ''
  for (const attrs of links) {
    const href = (/href="([^"]+)"/i.exec(attrs) || [])[1]
    if (!href) continue
    if (!fallback) fallback = href
    const rel = (/rel="([^"]+)"/i.exec(attrs) || [])[1] || 'alternate'
    const type = (/type="([^"]+)"/i.exec(attrs) || [])[1] || ''
    if (rel === 'alternate' && (!type || type.includes('html'))) return href
  }
  return fallback
}

function toDateLabel(raw) {
  const s = String(raw || '').trim()
  if (!s) return ''
  const t = Date.parse(s)
  if (Number.isNaN(t)) return ''
  const d = new Date(t)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function collectEntryHeads(xml, maxEntries) {
  const text = String(xml || '')
  const isAtom = /<entry[\s>]/i.test(text)
  const startRe = isAtom ? /<entry[\s>]/gi : /<item[\s>]/gi
  const heads = []
  let match = startRe.exec(text)
  while (match && heads.length < maxEntries) {
    heads.push(text.slice(match.index, match.index + ENTRY_HEAD_CHARS))
    match = startRe.exec(text)
  }
  return { isAtom, heads }
}

export function parseFeed(xml, { maxEntries = RSS_PARSE_MAX_ENTRIES, includeSummary = true } = {}) {
  const { isAtom, heads } = collectEntryHeads(xml, maxEntries)
  const entries = []

  for (const block of heads) {
    const title = decodeEntities(firstTag(block, 'title')).trim()
    const link = isAtom ? atomLink(block) : decodeEntities(firstTag(block, 'link')).trim()
    const dateRaw = isAtom
      ? firstTag(block, 'updated') || firstTag(block, 'published')
      : firstTag(block, 'pubDate')
    const guidRaw = isAtom ? firstTag(block, 'id') : firstTag(block, 'guid')
    const guid = decodeEntities(guidRaw || link || title).trim()
    const publishedAt = Date.parse(String(dateRaw || '').trim())
    let summary = ''
    if (includeSummary) {
      const rawSummary = isAtom
        ? firstTag(block, 'content') || firstTag(block, 'summary')
        : firstTag(block, 'content:encoded') || firstTag(block, 'description')
      summary = stripTags(decodeEntities(rawSummary))
      if (summary.length > RSS_SUMMARY_MAX) summary = `${summary.slice(0, RSS_SUMMARY_MAX)}…`
    }
    if (!title && !link && !guid) continue
    entries.push({
      title: title || '(无标题)',
      link,
      guid,
      date: toDateLabel(dateRaw),
      publishedAt: Number.isNaN(publishedAt) ? 0 : publishedAt,
      summary,
    })
  }

  return entries
}
