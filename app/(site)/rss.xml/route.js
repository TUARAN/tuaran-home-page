import { articles } from '../articles/articlesData'
import { researchDateTimeIso } from '../../../lib/research/datetime'
import { CATEGORY_META, getResearchEntry, listResearch } from '../../../lib/research/loader'
import { renderMarkdown } from '../../../lib/research/markdown'

export const dynamic = 'force-static'
export const revalidate = 3600

const SITE_URL = 'https://2aran.com'
const SITE_TITLE = '涂阿燃（tuaran）的网络日志'
const SITE_DESC =
  '涂阿燃（安东尼）：前端与 AI 工程化 Agent 工程师；主理博主联盟与前端周看。个人网络日志，记录工程实践、技术情报与创作者增长。'
const AUTHOR_EMAIL = 'chaosdefense1@gmail.com'
const AUTHOR_NAME = '涂阿燃'

function isExternal(href) {
  return typeof href === 'string' && href.startsWith('http')
}

function escapeXml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(dateString) {
  const t = dateString ? Date.parse(dateString) : Date.now()
  return new Date(Number.isNaN(t) ? Date.now() : t).toUTCString()
}

// 把正文里的站内相对链接 / 图片补成绝对地址，方便 RSS 阅读器正确加载
function absolutize(html) {
  return String(html || '').replace(/(href|src)="\/(?!\/)/g, `$1="${SITE_URL}/`)
}

// content:encoded 走 CDATA，正文里若出现 ]]> 需转义，避免提前闭合 CDATA
function cdata(html) {
  return String(html || '').replace(/]]>/g, ']]]]><![CDATA[>')
}

// 精选文章（articlesData 内链型）正文：content 数组里字符串=段落、对象=小标题
function postContentHtml(article) {
  if (!Array.isArray(article.content)) return ''
  const parts = []
  for (const block of article.content) {
    if (typeof block === 'string') {
      const text = block.trim()
      if (text) parts.push(`<p>${escapeXml(text)}</p>`)
    } else if (block && typeof block === 'object' && block.label) {
      parts.push(`<h3>${escapeXml(block.label)}</h3>`)
    }
  }
  return parts.join('\n')
}

// 调研全文 HTML：加密文章 content 为空串（明文绝不进静态产物）→ 自然只输出摘要
function researchContentHtml(category, slug, title) {
  const full = getResearchEntry(category, slug)
  if (!full || full.encrypted) return ''
  const md = (full.variants && full.variants[0]?.content) || full.content || ''
  if (!md.trim()) return ''
  try {
    return absolutize(renderMarkdown(md, { seed: `${category}/${slug}`, title }))
  } catch {
    return ''
  }
}

function buildItems() {
  // 1. 精选文章（剔除外链型）
  const postItems = articles
    .filter((a) => !isExternal(a.href))
    .map((a) => {
      const path = a.slug === 'diary-self-reflection' ? '/diary' : `/articles/${a.slug}`
      return {
        title: a.title,
        link: `${SITE_URL}${path}`,
        description: a.summary,
        pubDate: toRfc822(a.date),
        category: '精选文章',
        contentHtml: absolutize(postContentHtml(a)),
      }
    })

  // 2. 公司 / 事项调研（全文走 content:encoded；加密文章只出摘要）
  const researchItems = listResearch().map((entry) => ({
    title: entry.title,
    link: `${SITE_URL}/articles/research/${entry.category}/${entry.slug}`,
    description: entry.summary || `${CATEGORY_META[entry.category]?.label || entry.category}：${entry.title}`,
    pubDate: toRfc822(researchDateTimeIso(entry.date, entry.time) || entry.date),
    category: CATEGORY_META[entry.category]?.label || entry.category,
    contentHtml: researchContentHtml(entry.category, entry.slug, entry.title),
  }))

  return [...postItems, ...researchItems].sort((a, b) => {
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  })
}

export function GET() {
  const items = buildItems()
  const lastBuildDate = items[0]?.pubDate || new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>zh-CN</language>
    <copyright>© 2025-2026 ${escapeXml(AUTHOR_NAME)}</copyright>
    <managingEditor>${AUTHOR_EMAIL} (${escapeXml(AUTHOR_NAME)})</managingEditor>
    <webMaster>${AUTHOR_EMAIL} (${escapeXml(AUTHOR_NAME)})</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items
  .map(
    (it) => `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${it.link}</link>
      <guid isPermaLink="true">${it.link}</guid>
      <description>${escapeXml(it.description || '')}</description>
${it.contentHtml ? `      <content:encoded><![CDATA[${cdata(it.contentHtml)}]]></content:encoded>\n` : ''}      <category>${escapeXml(it.category)}</category>
      <pubDate>${it.pubDate}</pubDate>
      <dc:creator>${escapeXml(AUTHOR_NAME)}</dc:creator>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
