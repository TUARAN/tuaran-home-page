import { Marked } from 'marked'

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#39;')
}

function sanitizeUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  if (/[\u0000-\u001F\u007F]/.test(value)) return ''
  const compact = value.replace(/\s+/g, '')
  if (/^(?:javascript|data|vbscript):/i.test(compact)) return ''
  if (value.startsWith('#') || value.startsWith('/')) return value
  if (/^(?:\.\.?\/)(?!\/)/.test(value)) return value
  if (/^[a-z][a-z0-9+.-]*:/i.test(compact)) {
    try {
      const url = new URL(compact)
      return SAFE_URL_PROTOCOLS.has(url.protocol) ? value : ''
    } catch {
      return ''
    }
  }
  return value
}

function renderImageTag(src, alt, title) {
  const safeSrc = sanitizeUrl(src)
  if (!safeSrc) return escapeHtml(alt || '')
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ''
  return [
    `<figure class="research-inline-image">`,
    `<img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(alt || '')}"${titleAttr} loading="lazy" decoding="async" />`,
    `</figure>`,
  ].join('')
}

function buildMarked(options = {}) {
  const m = new Marked({ gfm: true, breaks: Boolean(options.breaks) })
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
        const safeHref = sanitizeUrl(href)
        if (!safeHref) return text
        const isExternal = /^https?:\/\//i.test(safeHref)
        const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ''
        const extra = isExternal ? ' target="_blank" rel="noreferrer"' : ''
        return `<a href="${escapeAttribute(safeHref)}"${titleAttr}${extra}>${text}</a>`
      },
      image({ href, title, text }) {
        return renderImageTag(href, text, title)
      },
      html({ text }) {
        return escapeHtml(text)
      },
    },
  })
  return m
}

const marked = buildMarked()
const markedWithBreaks = buildMarked({ breaks: true })

function hash(input) {
  let value = 0
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) >>> 0
  }
  return value
}

function renderFigure(image, title, index) {
  const alt = image.alt || `${title || '调研'} 配图 ${index + 1}`
  return renderMarkdownImage({ ...image, alt }, title, index)
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
    // 在不同标题之间均匀铺开（而不是固定隔一个），并对已用标题去重，
    // 避免标题数较少时多张图落到同一节、挤成一坨。
    const step = Math.max(1, Math.floor(targets.length / imageCount))
    const usedTargets = new Set()
    for (let i = 0; i < imageCount; i += 1) {
      let ti = (offset + i * step) % targets.length
      while (usedTargets.has(ti) && usedTargets.size < targets.length) {
        ti = (ti + 1) % targets.length
      }
      usedTargets.add(ti)
      const headingIndex = targets[ti]
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
    // 无 ## 标题的随笔/观点类长文：把图片均匀分散到正文的段落空隙之间，
    // 与文字穿插，而不是全部堆在某一处。
    const paragraphBreaks = []
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i].trim() === '') paragraphBreaks.push(i + 1)
    }
    const usableBreaks = paragraphBreaks.filter((idx) => idx > 1)
    const points = usableBreaks.length ? usableBreaks : paragraphBreaks
    if (points.length === 0) {
      insertionMap.set(lines.length, images.slice(0, imageCount))
    } else {
      const span = points.length / (imageCount + 1)
      const usedPoints = new Set()
      for (let i = 0; i < imageCount; i += 1) {
        let pi = Math.min(points.length - 1, Math.round(span * (i + 1)))
        while (usedPoints.has(pi) && pi < points.length - 1) pi += 1
        usedPoints.add(pi)
        const at = points[pi]
        const existing = insertionMap.get(at) || []
        existing.push(images[i])
        insertionMap.set(at, existing)
      }
    }
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
  const renderer = options.breaks ? markedWithBreaks : marked
  const html = renderer.parse(withImages || '', { async: false })
  // 用可横向滚动的容器包裹表格，避免宽表格在 H5 下撑破布局
  return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>')
}

export function buildResearchMarkdownDocument(markdown, options = {}) {
  const body = insertResearchImages(markdown, options.images, options, renderMarkdownImage)
  const title = String(options.title || '').trim()
  const intro = String(options.intro || '').trim()
  const parts = []
  if (title) parts.push(`# ${title}`)
  if (intro) parts.push(intro)
  parts.push(body)
  return parts.join('\n\n')
}
