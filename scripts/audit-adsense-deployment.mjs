const baseUrl = new URL(process.argv[2] || 'https://2aran.com')
const MIN_SITEMAP_URLS = 200
const MIN_RESEARCH_URLS = 140
const MIN_RSS_ITEMS = 180
const EXPECTED_ADS_TXT = 'google.com, pub-7037125126940820, DIRECT, f08c47fec0942fa0'
const MIN_ARTICLES_MAIN_CHARS = 1000

const requiredIndexPaths = [
  '/',
  '/about',
  '/articles',
  '/help',
  '/community',
  '/sun-moon-motion',
  '/tools',
  '/articles/openclaw-pr-anthropic-image-normalization',
  '/articles/research/topics/qwen3-5-edge-deployment',
  '/articles/research/topics/mcp-2026-07-28-stateless-protocol',
]

const requiredArticleIndexTitles = [
  '技术社区已死',
  '开发者博主联盟',
  'OCR的新高度',
  '月亏3.13亿',
  '5 次被 OpenClaw 合并',
  'MCP 2026-07-28',
]

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
}

function visibleText(html) {
  return decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|svg|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim()
}

async function fetchText(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: {
      'cache-control': 'no-cache',
      'user-agent': '2aran-adsense-deployment-audit/1.0',
    },
  })
  return {
    response,
    text: await response.text(),
  }
}

const errors = []
const [sitemap, rss, settingsResponse, adsTxt, articles] = await Promise.all([
  fetchText('/sitemap.xml'),
  fetchText('/rss.xml'),
  fetchText('/api/site-settings'),
  fetchText('/ads.txt'),
  fetchText('/articles'),
])

for (const [label, result] of [
  ['sitemap.xml', sitemap],
  ['rss.xml', rss],
  ['site settings', settingsResponse],
  ['ads.txt', adsTxt],
  ['/articles', articles],
]) {
  if (!result.response.ok) errors.push(`${label}: HTTP ${result.response.status}`)
}

const sitemapUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const sitemapPaths = new Set(sitemapUrls.map((value) => new URL(value).pathname))
const researchUrls = sitemapUrls.filter((value) => {
  return new URL(value).pathname.startsWith('/articles/research/')
})
const rssItems = (rss.text.match(/<item>/g) || []).length

if (sitemapUrls.length < MIN_SITEMAP_URLS) {
  errors.push(`sitemap.xml: 至少应保留 ${MIN_SITEMAP_URLS} 个公开 URL，实际 ${sitemapUrls.length}`)
}
if (researchUrls.length < MIN_RESEARCH_URLS) {
  errors.push(`sitemap.xml: 至少应保留 ${MIN_RESEARCH_URLS} 篇公开分析，实际 ${researchUrls.length}`)
}
if (rssItems < MIN_RSS_ITEMS) {
  errors.push(`rss.xml: 至少应保留 ${MIN_RSS_ITEMS} 条内容，实际 ${rssItems}`)
}

for (const pathname of requiredIndexPaths) {
  if (!sitemapPaths.has(pathname)) errors.push(`sitemap.xml: 缺少必要页面 ${pathname}`)
}

let settings = null
try {
  settings = JSON.parse(settingsResponse.text)
} catch {
  errors.push('site settings: 返回内容不是合法 JSON')
}
const adsSettings = settings?.settings?.ads || settings?.ads
if (adsSettings?.scriptEnabled !== true) {
  errors.push('site settings: ads.scriptEnabled 必须为 true')
}
if (adsSettings?.manualSlotsEnabled !== false) {
  errors.push('site settings: ads.manualSlotsEnabled 必须为 false')
}
if (adsSettings?.reviewMode !== true) {
  errors.push('site settings: ads.reviewMode 必须为 true')
}

if (adsTxt.text.trim() !== EXPECTED_ADS_TXT) {
  errors.push('ads.txt: 发布商记录不正确')
}

const articlesMain = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(articles.text)?.[1] || ''
const articlesMainChars = visibleText(articlesMain).replace(/\s+/g, '').length
if (articlesMainChars < MIN_ARTICLES_MAIN_CHARS) {
  errors.push(
    `/articles: 首次 HTML 主区域只有 ${articlesMainChars} 个正文字符，`
    + `低于 ${MIN_ARTICLES_MAIN_CHARS}`,
  )
}
for (const title of requiredArticleIndexTitles) {
  if (!articles.text.includes(title)) errors.push(`/articles: 缺少公开内容“${title}”`)
}

for (const pathname of requiredIndexPaths) {
  const result = await fetchText(pathname)
  const robotsHeader = result.response.headers.get('x-robots-tag') || ''
  const robotsMeta = [...result.text.matchAll(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
  )].map((match) => match[1]).join(', ')
  if (/noindex/i.test(`${robotsHeader},${robotsMeta}`)) {
    errors.push(`${pathname}: 必要页面意外返回 noindex`)
  }
}

if (errors.length) {
  console.error(`AdSense deployment audit failed for ${baseUrl.origin}:\n`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(
  `AdSense deployment audit passed for ${baseUrl.origin}: `
  + `${sitemapUrls.length} sitemap URLs, ${researchUrls.length} public analyses, `
  + `${rssItems} RSS items; SEO discovery preserved`,
)
