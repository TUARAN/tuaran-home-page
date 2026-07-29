import fs from 'node:fs'
import path from 'node:path'

const baseUrl = new URL(process.argv[2] || 'http://127.0.0.1:3000')
const root = process.cwd()
const publicHost = '2aran.com'
const MIN_CONTENT_CHARS = 800
const MIN_ARTICLES_HUB_CHARS = 1000
const MAX_CONTENT_SIMILARITY = 0.82

const curatedArticlePaths = [
  '/articles/ai-project-complexity-governance',
  '/articles/mcp-https-vs-stdio-architecture-design',
  '/articles/openclaw-pr-anthropic-image-normalization',
]

function parseReviewResearchPaths() {
  const source = fs.readFileSync(path.join(root, 'lib/research/catalog.js'), 'utf8')
  const block = /export const RESEARCH_REVIEW_READY_PATHS = \[([\s\S]*?)\n\]/.exec(source)?.[1] || ''
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1])
}

function parseReviewRichPagePaths() {
  const source = fs.readFileSync(path.join(root, 'lib/engineeringWorks.js'), 'utf8')
  const worksSource = source.split('export const ENGINEERING_WORKS = [')[1] || ''
  return [...worksSource.matchAll(/\n  \{\n([\s\S]*?)\n  \},/g)]
    .map((match) => match[1])
    .filter((block) => /\breviewReady:\s*true\b/.test(block))
    .map((block) => /\bhref:\s*'([^']+)'/.exec(block)?.[1])
    .filter(Boolean)
}

const adReviewPaths = new Set([
  '/',
  ...curatedArticlePaths,
  ...parseReviewResearchPaths(),
  ...parseReviewRichPagePaths(),
])

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

function extractMain(html) {
  return /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] || ''
}

function visibleText(html) {
  return decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style|svg|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim()
}

function substantiveLength(text) {
  return text.replace(/\s+/g, '').length
}

function textShingles(text, width = 8) {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
  const shingles = new Set()
  for (let index = 0; index <= normalized.length - width; index += 1) {
    shingles.add(normalized.slice(index, index + width))
  }
  return shingles
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0
  let intersection = 0
  for (const value of left) {
    if (right.has(value)) intersection += 1
  }
  return intersection / (left.size + right.size - intersection)
}

async function fetchPage(pathname) {
  const response = await fetch(new URL(pathname, baseUrl), {
    headers: {
      'user-agent': '2aran-adsense-rendered-content-audit/1.0',
    },
  })
  return {
    response,
    html: await response.text(),
  }
}

const sitemap = await fetchPage('/sitemap.xml')
if (!sitemap.response.ok) {
  console.error(`AdSense rendered-content audit failed: sitemap returned ${sitemap.response.status}`)
  process.exit(1)
}

const publicUrls = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const publicPaths = new Set(publicUrls.map((value) => new URL(value).pathname))
const rows = []
const errors = []

for (const pathname of adReviewPaths) {
  if (!publicPaths.has(pathname)) {
    errors.push(`${pathname}: AdSense 复审页面缺少 sitemap 发现入口`)
  }
}

const auditPaths = new Set(['/articles', ...adReviewPaths])
for (const pathname of auditPaths) {
  const publicUrl = new URL(pathname, baseUrl).toString()
  const { response, html } = await fetchPage(pathname)
  if (!response.ok) {
    errors.push(`${pathname}: HTTP ${response.status}`)
    continue
  }

  const main = extractMain(html)
  const text = visibleText(main)
  const chars = substantiveLength(text)
  const headings = [...main.matchAll(/<h[1-6]\b/gi)].length
  const externalLinks = [...main.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)]
    .filter((match) => {
      try {
        const target = new URL(decodeHtml(match[1]), publicUrl)
        return /^https?:$/.test(target.protocol)
          && ![publicHost, baseUrl.hostname].includes(target.hostname)
      } catch {
        return false
      }
    }).length
  const isContent = adReviewPaths.has(pathname)

  if (!main) errors.push(`${pathname}: 缺少可直接读取的 <main> 内容`)
  if (pathname === '/articles' && chars < MIN_ARTICLES_HUB_CHARS) {
    errors.push(`${pathname}: 首次 HTML 只有 ${chars} 个正文字符，文章入口仍像加载占位页`)
  }
  if (isContent && chars < MIN_CONTENT_CHARS) {
    errors.push(`${pathname}: 首次 HTML 只有 ${chars} 个正文字符，低于内容页门槛 ${MIN_CONTENT_CHARS}`)
  }
  if (isContent && headings < 3) {
    errors.push(`${pathname}: 只有 ${headings} 个正文标题，缺少可辨识的信息结构`)
  }

  rows.push({
    pathname,
    chars,
    headings,
    externalLinks,
    isContent,
    shingles: textShingles(text),
  })
}

const contentRows = rows.filter((row) => row.isContent)
for (let leftIndex = 0; leftIndex < contentRows.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < contentRows.length; rightIndex += 1) {
    const left = contentRows[leftIndex]
    const right = contentRows[rightIndex]
    const similarity = jaccard(left.shingles, right.shingles)
    if (similarity > MAX_CONTENT_SIMILARITY) {
      errors.push(
        `${left.pathname} 与 ${right.pathname}: 正文相似度 ${similarity.toFixed(2)}，疑似模板重复`,
      )
    }
  }
}

if (errors.length) {
  console.error('AdSense rendered-content audit failed:\n')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

const weakestContent = [...contentRows]
  .sort((left, right) => left.chars - right.chars)
  .slice(0, 5)

console.log(
  `AdSense rendered-content audit passed: ${publicUrls.length} sitemap pages, `
  + `${contentRows.length} substantive ad-review pages; SEO discovery remains broader`,
)
weakestContent.forEach((row) => {
  console.log(
    `- ${row.pathname}: ${row.chars} chars, ${row.headings} headings, `
    + `${row.externalLinks} external references`,
  )
})
