const baseUrl = new URL(process.argv[2] || 'http://127.0.0.1:3000')
const publicHost = '2aran.com'

const utilityPaths = new Set([
  '/account',
  '/ads.txt',
  '/llms.txt',
  '/login',
  '/register',
  '/robots.txt',
  '/rss.xml',
  '/sitemap.xml',
  '/web-llm/embed',
])

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
}

function normalizePathname(pathname) {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}

function isAssetPath(pathname) {
  return pathname.startsWith('/_next/')
    || pathname.startsWith('/images/')
    || /\.(?:avif|css|gif|ico|jpe?g|js|json|mp3|mp4|pdf|png|svg|webm|webp|woff2?)$/i.test(pathname)
}

async function fetchText(pathname) {
  const url = new URL(pathname, baseUrl)
  const response = await fetch(url, {
    headers: {
      'user-agent': '2aran-adsense-readiness-audit/1.0',
    },
  })
  return {
    response,
    text: await response.text(),
  }
}

const sitemap = await fetchText('/sitemap.xml')
if (!sitemap.response.ok) {
  console.error(`AdSense link audit failed: sitemap returned ${sitemap.response.status}`)
  process.exit(1)
}

const publicUrls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const allowedPaths = new Set(
  publicUrls.map((value) => normalizePathname(new URL(value).pathname)),
)
const internalTargets = new Map()
const pageErrors = []

for (const publicUrl of publicUrls) {
  const publicPage = new URL(publicUrl)
  const sourcePath = normalizePathname(publicPage.pathname)
  const { response, text } = await fetchText(`${publicPage.pathname}${publicPage.search}`)

  if (!response.ok) {
    pageErrors.push(`${sourcePath}: HTTP ${response.status}`)
    continue
  }
  if (response.redirected) {
    const finalPath = normalizePathname(new URL(response.url).pathname)
    if (finalPath !== sourcePath) {
      pageErrors.push(`${sourcePath}: sitemap 页面重定向到 ${finalPath}`)
    }
  }
  const robotsHeader = response.headers.get('x-robots-tag') || ''
  if (/noindex/i.test(robotsHeader)) {
    pageErrors.push(`${sourcePath}: sitemap 页面返回 X-Robots-Tag: ${robotsHeader}`)
  }
  const robotsMeta = [...text.matchAll(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .join(', ')
  if (/noindex/i.test(robotsMeta)) {
    pageErrors.push(`${sourcePath}: sitemap 页面含 noindex 元标签`)
  }

  for (const match of text.matchAll(/<a\b([^>]+)>/gi)) {
    const attributes = match[1]
    const hrefMatch = /\bhref=["']([^"'#][^"']*)["']/i.exec(attributes)
    if (!hrefMatch || /\brel=["'][^"']*\bnofollow\b/i.test(attributes)) continue
    const rawHref = decodeHtml(hrefMatch[1]).trim()
    if (!rawHref || /^(?:mailto:|tel:|javascript:)/i.test(rawHref)) continue

    let target
    try {
      target = new URL(rawHref, publicUrl)
    } catch {
      continue
    }
    if (target.hostname !== publicHost && target.hostname !== baseUrl.hostname) continue

    const targetPath = normalizePathname(target.pathname)
    if (isAssetPath(targetPath) || targetPath.startsWith('/api/')) continue
    if (!internalTargets.has(targetPath)) internalTargets.set(targetPath, new Set())
    internalTargets.get(targetPath).add(sourcePath)
  }
}

const targetErrors = []
const targetsToCheck = [...internalTargets.keys()]
  .filter((targetPath) => !allowedPaths.has(targetPath) && !utilityPaths.has(targetPath))

for (let index = 0; index < targetsToCheck.length; index += 12) {
  const batch = targetsToCheck.slice(index, index + 12)
  const results = await Promise.all(batch.map(async (targetPath) => {
    try {
      const { response } = await fetchText(targetPath)
      return { targetPath, status: response.status }
    } catch (error) {
      return { targetPath, error: error instanceof Error ? error.message : String(error) }
    }
  }))
  for (const result of results) {
    if (!result.error && result.status < 400) continue
    const sources = [...(internalTargets.get(result.targetPath) || [])].slice(0, 3)
    const suffix = result.error ? result.error : `HTTP ${result.status}`
    targetErrors.push(`${sources.join(', ')} -> ${result.targetPath}: ${suffix}`)
  }
}

if (pageErrors.length || targetErrors.length) {
  console.error('AdSense link audit failed:\n')
  pageErrors.forEach((error) => console.error(`- ${error}`))
  targetErrors.slice(0, 100).forEach((error) => console.error(`- ${error}`))
  if (targetErrors.length > 100) console.error(`- 另有 ${targetErrors.length - 100} 项未显示`)
  process.exit(1)
}

console.log(
  `AdSense link audit passed: ${publicUrls.length} sitemap pages are indexable; `
  + `${internalTargets.size} unique internal link targets resolve successfully`,
)
