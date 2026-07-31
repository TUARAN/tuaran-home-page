import fs from 'node:fs'
import path from 'node:path'

if (process.env.ADMIN_PAGES_BUILD === '1') {
  console.log('AdSense readiness audit skipped for Admin Pages build')
  process.exit(0)
}

const root = process.cwd()
const researchRoot = path.join(root, 'research')
const categories = ['companies', 'topics', 'people']
const MIN_REVIEW_READY = 15
const MAX_REVIEW_READY = 30
const MIN_SUBSTANTIVE_CHARS = 2000
const MIN_REVIEW_READY_RICH_PAGES = 8
const MAX_REVIEW_READY_RICH_PAGES = 15
const FORBIDDEN_REVIEW_READY_STYLE = [
  {
    matcher: /不是[^。；，、：:！!？?\n]{1,24}[，,]?\s*而是/,
    message: '仍含“不是 X，而是 Y”模板句',
  },
  {
    matcher: /(?:从)?本质上(?:讲)?|归根结底|说到底/,
    message: '仍含空泛的拔高式结论',
  },
  {
    matcher: /本文(?:将|会|首先|主要|旨在)|本调研|写作说明|由[^。\n]{0,30}(?:AI|大模型|Claude|GPT)[^。\n]{0,30}(?:生成|撰写|协助下成文)|我作为[^。\n]{0,24}(?:AI|大模型|语言模型|Claude|GPT)/,
    message: '仍含模型口吻、写作过程说明或无效自我指涉',
  },
]

function parseDocument(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!match) return { frontmatter: {}, body: raw }

  const frontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line)
    if (field) frontmatter[field[1]] = field[2].trim()
  }
  return { frontmatter, body: match[2] }
}

function substantiveLength(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' code ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' image ')
    .replace(/\[[^\]]+]\([^)]+\)/g, ' link ')
    .replace(/[\s#>*_|~`-]/g, '')
    .length
}

function hasEvidence(body) {
  return /https?:\/\//.test(body)
    || /```[\s\S]*?```/.test(body)
    || /!\[[^\]]*]\([^)]+\)/.test(body)
    || /\/(?:app|lib|scripts|research|api)\//.test(body)
    || /(实测|复盘|截图|提交记录|构建结果|本轮改动|踩坑)/.test(body)
}

const errors = []
const reviewReady = []

function parseReviewReadyRichPages() {
  const source = fs.readFileSync(path.join(root, 'lib/engineeringWorks.js'), 'utf8')
  const worksSource = source.split('export const ENGINEERING_WORKS = [')[1]
  if (!worksSource) return []

  return [...worksSource.matchAll(/\n  \{\n([\s\S]*?)\n  \},/g)]
    .map((match) => {
      const block = match[1]
      return {
        id: /\bid:\s*'([^']+)'/.exec(block)?.[1],
        href: /\bhref:\s*'([^']+)'/.exec(block)?.[1],
        reviewReady: /\breviewReady:\s*true\b/.test(block),
      }
    })
    .filter((work) => work.id && work.href && work.reviewReady)
}

const reviewReadyRichPages = parseReviewReadyRichPages()

function requireSource(relativePath, pattern, message) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  if (!pattern.test(source)) errors.push(`${relativePath}: ${message}`)
}

function forbidSource(relativePath, pattern, message) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
  if (pattern.test(source)) errors.push(`${relativePath}: ${message}`)
}

for (const category of categories) {
  const dir = path.join(researchRoot, category)
  for (const filename of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const file = path.join(dir, filename)
    const { frontmatter, body } = parseDocument(file)
    const ready = frontmatter.review_ready === 'true'
    const adEligible = frontmatter.ad_eligible === 'true'

    if (adEligible && !ready) {
      errors.push(`${path.relative(root, file)}: ad_eligible=true 但 review_ready 未开启`)
    }
    if (!ready) continue

    reviewReady.push(file)
    if (frontmatter.encrypted === 'true' || frontmatter.encrypted_source === 'true') {
      errors.push(`${path.relative(root, file)}: 加密内容不能进入公开复审白名单`)
    }
    if (!frontmatter.content_type) {
      errors.push(`${path.relative(root, file)}: 缺少明确 content_type`)
    }
    if (/调研/.test(frontmatter.title || '')) {
      errors.push(`${path.relative(root, file)}: 复审标题仍使用“调研”，应按实际内容改为分析、核验、实践或观察`)
    }
    if (substantiveLength(body) < MIN_SUBSTANTIVE_CHARS) {
      errors.push(`${path.relative(root, file)}: 正文实质内容不足 ${MIN_SUBSTANTIVE_CHARS} 字符`)
    }
    if (!hasEvidence(body)) {
      errors.push(`${path.relative(root, file)}: 缺少来源、代码、图片或亲历证据`)
    }
    for (const rule of FORBIDDEN_REVIEW_READY_STYLE) {
      if (rule.matcher.test(body)) {
        errors.push(`${path.relative(root, file)}: ${rule.message}`)
      }
    }
  }
}

if (reviewReady.length < MIN_REVIEW_READY) {
  errors.push(`复审白名单只有 ${reviewReady.length} 篇，至少需要 ${MIN_REVIEW_READY} 篇`)
}
if (reviewReady.length > MAX_REVIEW_READY) {
  errors.push(`复审白名单已有 ${reviewReady.length} 篇，超过 ${MAX_REVIEW_READY} 篇；请先收窄审核面`)
}
if (reviewReadyRichPages.length < MIN_REVIEW_READY_RICH_PAGES) {
  errors.push(`复审多维页面只有 ${reviewReadyRichPages.length} 个，至少需要 ${MIN_REVIEW_READY_RICH_PAGES} 个`)
}
if (reviewReadyRichPages.length > MAX_REVIEW_READY_RICH_PAGES) {
  errors.push(`复审多维页面已有 ${reviewReadyRichPages.length} 个，超过 ${MAX_REVIEW_READY_RICH_PAGES} 个`)
}

const prohibitedRichPageIds = new Set([
  'cancers-overview',
  'global-ai-governance',
  'guoqi-guodan',
  'margin-account-313m-loss-investigation',
  'network-access-guide',
  'sun-moon-motion',
  'x-mutual-aid-circle',
])
for (const work of reviewReadyRichPages) {
  if (prohibitedRichPageIds.has(work.id)) {
    errors.push(`lib/engineeringWorks.js: 页面 ${work.id} 不得进入 AdSense 复审白名单`)
  }
}

requireSource(
  'app/(site)/sitemap.js',
  /\.filter\(\(entry\) => !entry\.encrypted\)/,
  'sitemap 必须保留全部未加密公开分析',
)
forbidSource(
  'app/(site)/sitemap.js',
  /entry\.reviewReady|isAdsenseReviewPath|isPublicIndexablePath/,
  'sitemap 不得按 AdSense 复审状态收窄 SEO 收录',
)
forbidSource(
  'app/(site)/rss.xml/route.js',
  /entry\.reviewReady|isAdsenseReviewPath|isPublicIndexablePath/,
  'RSS 不得按 AdSense 复审状态收窄内容发现',
)
forbidSource(
  'app/(site)/llms.txt/route.js',
  /e\.reviewReady/,
  'llms.txt 不得按 AdSense 复审状态收窄内容发现',
)
requireSource(
  'app/(site)/components/GoogleAdsenseScript.jsx',
  /isAdsenseReviewPath\(pathname\)/,
  'AdSense 验证脚本必须使用独立复审范围，不能复用 SEO 索引策略',
)
requireSource(
  'app/(site)/articles/research/[category]/[slug]/page.jsx',
  /index: !isEncrypted/,
  '公开分析详情页必须保持可索引，加密内容除外',
)
forbidSource(
  'middleware.js',
  /X-Robots-Tag/,
  'middleware 不得按 AdSense 复审状态批量添加 noindex',
)
requireSource(
  'lib/adsenseReviewPolicy.js',
  /ADSENSE_REVIEW_PATH_SET/,
  '必须维护独立的 AdSense 复审范围',
)
requireSource(
  'lib/adsenseReviewPolicy.js',
  /CURATED_ARTICLE_PATHS = \[\s*'\/articles\/ai-project-complexity-governance',\s*'\/articles\/mcp-https-vs-stdio-architecture-design',\s*'\/articles\/openclaw-pr-anthropic-image-normalization',\s*\]/,
  '旧文章广告复审范围必须保持为三篇具有亲历证据的内容',
)
forbidSource(
  'lib/siteNav.js',
  /isReviewNavigationItem/,
  '普通访客导航不得按 AdSense 复审状态隐藏公开页面',
)
requireSource(
  'app/(site)/articles/ArticlesIndexClient.jsx',
  /const catalogItems = items/,
  '普通访客文章目录必须保留全部公开内容',
)
requireSource(
  'app/(site)/articles/page.jsx',
  /const items = buildKnowledgeItems\(\)/,
  '全部公开内容必须进入文章页服务端数据载荷',
)
forbidSource(
  'app/(site)/articles/page.jsx',
  /buildKnowledgeItems\(\)\.filter\(\(item\) => item\.reviewReady\)/,
  '文章页不得按 AdSense 复审状态收窄 SEO 内容',
)
requireSource(
  'app/(site)/articles/page.jsx',
  /fallback=\{<ArticlesIndexFallback items=\{items\} \/>}/,
  '文章索引的首次 HTML 必须提供可抓取的精选内容，不能只显示加载占位',
)
forbidSource(
  'lib/research/markdown.js',
  /shouldNofollow|isAdsenseReviewPath|isPublicIndexablePath/,
  '站内分析链接不得因 AdSense 复审状态损失 SEO 链接权重',
)

if (errors.length) {
  console.error('AdSense readiness audit failed:\n')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(
  `AdSense readiness audit passed: ${reviewReady.length} ad-review analyses, `
  + `${reviewReadyRichPages.length} ad-review rich pages; SEO discovery remains independent`,
)
reviewReady
  .map((file) => path.relative(root, file))
  .sort()
  .forEach((file) => console.log(`- ${file}`))
reviewReadyRichPages
  .map((work) => work.href)
  .sort()
  .forEach((href) => console.log(`- rich page: ${href}`))
