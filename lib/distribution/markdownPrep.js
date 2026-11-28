// 分发前 Markdown 整理：去重标题、边界说明挪文末、列出外链图，供任务存储与智能体核对。

import { COLLAPSIBLE_NOTE_LABEL_RE } from '../research/markdown.js'
import { AUTHOR_INTRO_MARKDOWN, headSectionLacksAuthorIntro } from '../site/authorIntroMarkdown.js'
import { SITE_ORIGIN } from './harness.js'

const SOURCES_HEADING_RE = /^##\s+信息来源/

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

function blockquoteFirstPlainLine(block) {
  for (const line of String(block || '').split(/\r?\n/)) {
    const text = line.replace(/^>\s?/, '').trim()
    if (text) return text
  }
  return ''
}

function isBoundaryNoteBlockquote(block) {
  return COLLAPSIBLE_NOTE_LABEL_RE.test(blockquoteFirstPlainLine(block))
}

/** 文首（第一个 ## 之前）的边界说明引用块挪到文末，优先贴在「## 信息来源」前。与站内 research 渲染口径一致。 */
export function relocateBoundaryNotesToEnd(markdown) {
  const text = String(markdown || '').trim()
  if (!text) return text

  const firstHeading = text.search(/^##\s+/m)
  const intro = firstHeading < 0 ? text : text.slice(0, firstHeading)
  const rest = firstHeading < 0 ? '' : text.slice(firstHeading).trimStart()
  if (!intro.trim()) return text

  const lines = intro.split(/\r?\n/)
  const kept = []
  const boundaryBlocks = []
  let i = 0

  while (i < lines.length) {
    while (i < lines.length && !lines[i].trim()) {
      kept.push(lines[i])
      i += 1
    }
    if (i >= lines.length) break
    if (!lines[i].startsWith('>')) {
      kept.push(...lines.slice(i))
      break
    }
    const start = i
    while (i < lines.length && lines[i].startsWith('>')) {
      i += 1
    }
    const block = lines.slice(start, i).join('\n').replace(/\s+$/, '')
    if (isBoundaryNoteBlockquote(block)) boundaryBlocks.push(block)
    else kept.push(block)
  }

  if (!boundaryBlocks.length) return text

  const introOut = kept
    .join('\n')
    .replace(/(\n){3,}/g, '\n\n')
    .trimEnd()
  const notes = boundaryBlocks.join('\n\n')
  let body = rest
  if (!body) body = ''
  else body = body.trimStart()

  const sourcesIdx = body.search(/^##\s+信息来源/m)
  if (sourcesIdx >= 0) {
    body = `${body.slice(0, sourcesIdx).trimEnd()}\n\n${notes}\n\n${body.slice(sourcesIdx).trimStart()}`
  } else if (body) {
    body = `${body.trimEnd()}\n\n${notes}`
  } else {
    body = notes
  }

  return introOut ? `${introOut}\n\n${body}`.trim() : body.trim()
}

/** 文首连续 `>` 行之间补空行，避免掘金等编辑器把多行引用粘成一段。 */
export function expandIntroBlockquoteParagraphs(markdown) {
  const text = String(markdown || '').trim()
  if (!text) return text

  const firstHeading = text.search(/^##\s+/m)
  const intro = firstHeading < 0 ? text : text.slice(0, firstHeading)
  const rest = firstHeading < 0 ? '' : text.slice(firstHeading)
  if (!/^>/m.test(intro)) return text

  const lines = intro.split(/\r?\n/)
  const out = []
  for (const line of lines) {
    const prev = out[out.length - 1]
    if (line.startsWith('>') && prev?.startsWith('>') && prev.trim()) out.push('')
    out.push(line)
  }

  const introOut = out.join('\n').replace(/(\n){3,}/g, '\n\n').trimEnd()
  if (!rest) return introOut
  return `${introOut}\n\n${rest.trimStart()}`.trim()
}

/** 建任务入库前：边界说明挪文末、去重标题；相对图片链接由 absolutizeMarkdownUrls 处理。 */
export function prepareDistributionMarkdown(markdown, { title } = {}) {
  let text = String(markdown || '').trim()
  if (headSectionLacksAuthorIntro(text)) {
    text = `${AUTHOR_INTRO_MARKDOWN}\n\n${text}`
  }
  const stepped = relocateBoundaryNotesToEnd(text)
  const normalized = expandIntroBlockquoteParagraphs(stepped)
  return stripDuplicateTitleHeading(normalized, title)
}