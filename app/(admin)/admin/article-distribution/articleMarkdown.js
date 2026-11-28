// 把站内文章页 HTML 转成分发用 Markdown（浏览器端，依赖 DOMParser）。
// 表格输出 GFM 管道表格，代码块保留 language-xx 语言标记，图片和链接转成绝对地址。

import { prepareDistributionMarkdown } from '../../../../lib/distribution/markdownPrep.js'

const SOURCE_SELECTORS = [
  'article.prose-tuaran',
  'article.article-post-body',
  'main article',
  '.prose-tuaran',
]

const EXCLUDE_SELECTOR = [
  'script',
  'style',
  'nav',
  'footer',
  'aside',
  'button',
  'form',
  'iframe',
  '.not-prose',
  '.toc-scroll-panel',
  '[data-toc-item-id]',
  '[data-toc-subitem-id]',
  '[data-x-article-exclude]',
].join(',')

function cleanText(value) {
  return String(value || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

function absoluteUrl(value, sourceUrl) {
  try {
    const parsed = new URL(String(value || ''), sourceUrl)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

function codeLanguage(pre) {
  const holder = pre.querySelector('code[class*="language-"]') || pre
  const match = String(holder.getAttribute('class') || '').match(/language-([\w+#-]+)/)
  return match ? match[1] : ''
}

function tableCell(cell, sourceUrl, depth) {
  const content = Array.from(cell.childNodes).map((child) => markdownFromNode(child, sourceUrl, depth + 1)).join('')
  return cleanText(content).replace(/\n+/g, ' ').replace(/\|/g, '\\|')
}

function tableMarkdown(table, sourceUrl, depth) {
  const rows = Array.from(table.querySelectorAll('tr'))
    .map((row) => Array.from(row.querySelectorAll(':scope > th, :scope > td')).map((cell) => tableCell(cell, sourceUrl, depth)))
    .filter((cells) => cells.some(Boolean))
  if (!rows.length) return ''
  const width = Math.max(...rows.map((cells) => cells.length))
  const pad = (cells) => [...cells, ...Array(width - cells.length).fill('')]
  const lines = [pad(rows[0]), Array(width).fill('---'), ...rows.slice(1).map(pad)]
  return `\n\n${lines.map((cells) => `| ${cells.join(' | ')} |`).join('\n')}\n\n`
}

export function markdownFromNode(node, sourceUrl, depth = 0) {
  if (!node || depth > 30) return ''
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const tag = node.tagName.toLowerCase()
  const children = () => Array.from(node.childNodes)
    .map((child) => markdownFromNode(child, sourceUrl, depth + 1))
    .join('')

  if (tag === 'br') return '\n'
  if (tag === 'hr') return '\n\n---\n\n'
  if (tag === 'img') {
    const src = absoluteUrl(node.getAttribute('src') || node.getAttribute('data-src'), sourceUrl)
    return src ? `![${cleanText(node.getAttribute('alt'))}](${src})` : ''
  }
  if (tag === 'a') {
    const label = cleanText(children())
    const href = absoluteUrl(node.getAttribute('href'), sourceUrl)
    return href && label ? `[${label}](${href})` : label
  }
  if (['strong', 'b'].includes(tag)) return `**${cleanText(children())}**`
  if (['em', 'i'].includes(tag)) return `*${cleanText(children())}*`
  if (['del', 's'].includes(tag)) return `~~${cleanText(children())}~~`
  if (tag === 'code' && node.parentElement?.tagName !== 'PRE') return `\`${cleanText(children())}\``
  if (tag === 'pre') return `\n\n\`\`\`${codeLanguage(node)}\n${String(node.textContent || '').replace(/\n+$/, '')}\n\`\`\`\n\n`
  if (tag === 'table') return tableMarkdown(node, sourceUrl, depth)
  if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag.slice(1)))} ${cleanText(children())}\n\n`
  if (tag === 'blockquote') {
    const paragraphs = Array.from(node.querySelectorAll(':scope > p'))
    const content = paragraphs.length
      ? paragraphs.map((para) => `> ${cleanText(para.textContent || '')}`).join('\n\n')
      : cleanText(children()).split('\n').filter(Boolean).map((line) => `> ${line}`).join('\n\n')
    return content ? `\n\n${content}\n\n` : ''
  }
  if (tag === 'li') {
    const ordered = node.parentElement?.tagName === 'OL'
    const index = ordered ? Array.from(node.parentElement.children).indexOf(node) + 1 : 0
    return `\n${ordered ? `${index}.` : '-'} ${cleanText(children())}`
  }
  if (['ul', 'ol'].includes(tag)) return `\n${children()}\n\n`
  if (['p', 'div', 'figure', 'figcaption', 'section'].includes(tag)) return `\n\n${children()}\n\n`
  return children()
}

// 代码块内的空行要原样保留，只压缩代码块以外的多余空行。
function tidyMarkdown(markdown) {
  return markdown
    .split(/(```[\s\S]*?```)/)
    .map((part, index) => (index % 2 ? part : part.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')))
    .join('')
    .trim()
}

export function articleFromHtml(html, sourceUrl, fallbackTitle = '') {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const source = SOURCE_SELECTORS.map((selector) => doc.querySelector(selector)).find(Boolean)
  if (!source) throw new Error('没有识别到文章正文区域。')
  const clone = source.cloneNode(true)
  clone.querySelectorAll(EXCLUDE_SELECTOR).forEach((node) => node.remove())

  const title = cleanText(fallbackTitle || doc.querySelector('h1')?.textContent || doc.title).slice(0, 200)
  const pageHeading = clone.querySelector('h1')
  if (pageHeading && !prepareDistributionMarkdown(`# ${cleanText(pageHeading.textContent)}\n`, { title })) {
    pageHeading.remove()
  }
  const markdown = prepareDistributionMarkdown(tidyMarkdown(markdownFromNode(clone, sourceUrl)), { title })
  const summary = cleanText(
    doc.querySelector('meta[name="description"]')?.getAttribute('content')
      || clone.querySelector('p')?.textContent
      || '',
  ).slice(0, 300)
  const tags = Array.from(doc.querySelectorAll('meta[property="article:tag"]'))
    .map((node) => cleanText(node.getAttribute('content')))
    .filter(Boolean)
    .slice(0, 10)
  if (!title || !markdown) throw new Error('文章标题或正文为空。')
  return { title, markdown, summary, tags, url: sourceUrl }
}
