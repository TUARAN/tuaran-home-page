import { Marked } from 'marked'

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildMarked() {
  const m = new Marked({ gfm: true, breaks: false })
  m.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const plain = tokens.map((t) => ('text' in t ? t.text : '')).join('')
        const id = slugify(plain) || `h-${depth}`
        return `<h${depth} id="${id}">${text}</h${depth}>\n`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const isExternal = /^https?:\/\//i.test(href || '')
        const titleAttr = title ? ` title="${title}"` : ''
        const extra = isExternal ? ' target="_blank" rel="noreferrer"' : ''
        return `<a href="${href}"${titleAttr}${extra}>${text}</a>`
      },
    },
  })
  return m
}

const marked = buildMarked()

function hash(input) {
  let value = 0
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0
  }
  return value
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderFigure(image, title, index) {
  const alt = image.alt || `${title || '调研'} 配图 ${index + 1}`
  return [
    `<figure class="research-inline-image">`,
    `<img src="${escapeHtml(image.src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`,
    `</figure>`,
  ].join('')
}

function escapeMarkdownAlt(value) {
  return String(value || '').replace(/[\[\]\n\r]/g, ' ').replace(/\s+/g, ' ').trim()
}

function renderMarkdownImage(image, title, index) {
  const alt = escapeMarkdownAlt(image.alt || `${title || '调研'} 配图 ${index + 1}`)
  return `![${alt}](${image.src})`
}

function insertResearchImages(markdown, images, options = {}, renderImage = renderFigure) {
  if (!Array.isArray(images) || images.length === 0) return markdown || ''

  const lines = String(markdown || '').split(/\r?\n/)
  const headingIndexes = []
  let inFence = false
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (/^```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (/^##\s+/.test(line)) headingIndexes.push(i)
  }

  const seed = `${options.seed || ''}:${options.title || ''}`
  const imageCount = Math.min(images.length, Math.max(1, images.length))
  const insertionMap = new Map()

  if (headingIndexes.length > 0) {
    const usable = headingIndexes.slice(1)
    const targets = usable.length ? usable : headingIndexes
    const offset = hash(seed) % targets.length
    for (let i = 0; i < imageCount; i += 1) {
      const headingIndex = targets[(offset + i * 2) % targets.length]
      let insertAt = headingIndex + 1
      while (insertAt < lines.length && lines[insertAt].trim() === '') insertAt += 1
      let paragraphBreaks = 0
      while (insertAt < lines.length) {
        const line = lines[insertAt]
        if (/^##\s+/.test(line)) break
        if (line.trim() === '') {
          paragraphBreaks += 1
          if (paragraphBreaks >= 2) {
            insertAt += 1
            break
          }
        }
        insertAt += 1
      }
      const existing = insertionMap.get(insertAt) || []
      existing.push(images[i])
      insertionMap.set(insertAt, existing)
    }
  } else {
    const paragraphBreaks = []
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].trim() === '') paragraphBreaks.push(i + 1)
    }
    const fallbackAt = paragraphBreaks[Math.min(2, Math.max(0, paragraphBreaks.length - 1))] || lines.length
    insertionMap.set(fallbackAt, images.slice(0, imageCount))
  }

  const out = []
  for (let i = 0; i <= lines.length; i += 1) {
    if (insertionMap.has(i)) {
      const figures = insertionMap.get(i)
      out.push(...figures.map((image, index) => renderImage(image, options.title, index)))
      out.push('')
    }
    if (i < lines.length) out.push(lines[i])
  }
  return out.join('\n')
}

/** Extract H2 sections as TOC items. */
export function extractToc(markdown) {
  const items = []
  const lines = markdown.split(/\r?\n/)
  let inFence = false
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^##\s+(.+?)\s*$/.exec(line)
    if (m) {
      const text = m[1].trim()
      items.push({ id: slugify(text) || `h-${items.length}`, text })
    }
  }
  return items
}

/** Render a markdown string to HTML (sync). */
export function renderMarkdown(markdown, options = {}) {
  const withImages = insertResearchImages(markdown, options.images, options)
  const html = marked.parse(withImages || '', { async: false })
  // 用可横向滚动的容器包裹表格，避免宽表格在 H5 下撑破布局
  return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>')
}

export function buildResearchMarkdownDocument(markdown, options = {}) {
  const body = insertResearchImages(markdown, options.images, options, renderMarkdownImage)
  const title = String(options.title || '').trim()
  return title ? `# ${title}\n\n${body}` : body
}
