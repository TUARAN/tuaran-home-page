// 分发前 Markdown 整理：去重标题、列出外链图，供任务存储与智能体核对。

import { SITE_ORIGIN } from './harness.js'

function cleanCompareText(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[：:·•·\-—–|｜]/g, '')
    .toLowerCase()
}

function titlesMatch(heading, title) {
  const a = cleanCompareText(heading)
  const b = cleanCompareText(title)
  if (!a || !b) return false
  return a === b || a.startsWith(b) || b.startsWith(a)
}

/** 平台编辑器已有标题框时，去掉正文开头与 title 相同的首条 H1。 */
export function stripDuplicateTitleHeading(markdown, title) {
  const body = String(markdown || '').trimStart()
  const normalizedTitle = String(title || '').trim()
  if (!body || !normalizedTitle) return body
  const match = body.match(/^(#{1,2})\s+(.+?)(?:\n|$)/)
  if (!match) return body
  if (!titlesMatch(match[2], normalizedTitle)) return body
  return body.slice(match[0].length).trimStart()
}

const IMAGE_MARKDOWN = /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

export function listMarkdownImageUrls(markdown, siteOrigin = SITE_ORIGIN) {
  const origin = String(siteOrigin || SITE_ORIGIN).replace(/\/+$/, '')
  const urls = []
  for (const match of String(markdown || '').matchAll(IMAGE_MARKDOWN)) {
    const url = String(match[2] || '').trim()
    if (url) urls.push(url)
  }
  return [...new Set(urls)].map((url) => {
    try {
      const parsed = new URL(url, origin)
      const onSite = parsed.origin === new URL(origin).origin
      return { url: parsed.href, onSite }
    } catch {
      return { url, onSite: false }
    }
  })
}

export function containsInlineSvgOrHtmlFigure(markdown) {
  return /<figure[\s>]|<svg[\s>]/i.test(String(markdown || ''))
}

/** 建任务入库前：去重标题；相对图片链接由 absolutizeMarkdownUrls 处理。 */
export function prepareDistributionMarkdown(markdown, { title } = {}) {
  return stripDuplicateTitleHeading(String(markdown || '').trim(), title)
}