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
        const extractCode = /^extract-code:\s*([a-z0-9]+)$/i.exec(String(title || ''))?.[1] || ''
        const titleAttr = extractCode
          ? ` title="打开附件并复制提取码 ${escapeAttribute(extractCode)}"`
          : title
            ? ` title="${escapeAttribute(title)}"`
            : ''
        const extra = isExternal ? ' target="_blank" rel="noreferrer"' : ''
        const extractAttrs = extractCode
          ? ` data-extract-code="${escapeAttribute(extractCode)}" style="color:#8b5a1f;font-weight:650;text-decoration-line:underline;text-decoration-style:dotted;text-decoration-color:#b8925a;text-underline-offset:4px"`
          : ''
        return `<a href="${escapeAttribute(safeHref)}"${titleAttr}${extra}${extractAttrs}>${text}</a>`
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

function extractRedHighlights(markdown) {
  const highlights = []
  const content = String(markdown || '').replace(/\[!red\]([^\n]*?)\[\/!red\]/g, (_, text) => {
    const token = `TUARANREDHIGHLIGHT${highlights.length}TOKEN`
    highlights.push({ token, text })
    return token
  })
  return { content, highlights }
}

function extractDecisionSummaries(markdown) {
  const blocks = []
  const content = String(markdown || '').replace(
    /\[!decision-summary\]\s*\n([\s\S]*?)\n\[\/!decision-summary\]/g,
    (_, body) => {
      const token = `TUARANDECISIONSUMMARY${blocks.length}TOKEN`
      blocks.push({ token, body: body.trim() })
      return token
    }
  )
  return { content, blocks }
}

function renderDecisionSummary(body, renderer) {
  const heading = /^##\s+(.+?)\s*\n/.exec(body)
  const title = heading?.[1] || '总结分析：这段婚姻是否还要继续？'
  const content = heading ? body.slice(heading[0].length).trim() : body
  const inner = renderer.parse(content, { async: false })
  return [
    '<details style="margin:32px 0 8px;border:1px solid #e7b4b4;border-left:6px solid #dc2626;border-radius:14px;background:linear-gradient(145deg,#fff8f7 0%,#fffdf8 58%,#f7f1e7 100%);box-shadow:0 10px 30px rgba(91,45,35,.10);overflow:hidden">',
    `<summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 22px;color:#7f1d1d;font-family:serif;font-size:18px;font-weight:750;list-style:none"><span>${escapeHtml(title)}</span><span style="flex:none;font-family:system-ui;font-size:11px;font-weight:650;color:#9f4c45">展开查看</span></summary>`,
    '<div style="padding:0 22px 20px;border-top:1px solid #efd0cd">',
    inner,
    '</div>',
    '</details>',
  ].join('')
}

function renderTimelineTrend(markdown) {
  const monthlyCounts = new Map()
  for (const line of String(markdown || '').split(/\r?\n/)) {
    const cell = /^\|\s*(\d{4})\.(\d{2})\.(\d{2})(?:—(\d{2}))?\s*\|/.exec(line)
    if (!cell) continue
    const year = Number(cell[1])
    const month = Number(cell[2])
    const startDay = Number(cell[3])
    const endDay = Number(cell[4] || cell[3])
    const count = Math.max(1, endDay - startDay + 1)
    const key = `${year}-${month}`
    monthlyCounts.set(key, (monthlyCounts.get(key) || 0) + count)
  }
  if (monthlyCounts.size === 0) return ''

  const points = [...monthlyCounts.entries()].map(([key, count]) => {
    const [year, month] = key.split('-').map(Number)
    return { year, month, count }
  })
  const year = points[0].year
  const firstMonth = Math.min(...points.map((point) => point.month))
  const lastMonth = Math.max(...points.map((point) => point.month))
  const months = []
  for (let month = firstMonth; month <= lastMonth; month += 1) {
    months.push({ month, count: monthlyCounts.get(`${year}-${month}`) || 0 })
  }
  const max = Math.max(...months.map((point) => point.count), 1)
  const chartLeft = 68
  const chartRight = 632
  const baseline = 206
  const plotHeight = 132
  const step = months.length > 1 ? (chartRight - chartLeft) / (months.length - 1) : 0
  const chartPoints = months.map(({ month, count }, index) => {
    const x = chartLeft + step * index
    const height = count === 0 ? 3 : Math.max(14, (count / max) * plotHeight)
    return { month, count, x, y: baseline - height, height }
  })
  const linePath = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const bars = chartPoints
    .map((point) => {
      const fill = point.count === max ? '#dc2626' : '#a37b3c'
      return [
        `<rect x="${point.x - 24}" y="${point.y}" width="48" height="${point.height}" rx="7" fill="${fill}" opacity="0.82" />`,
        `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#fff" stroke="${fill}" stroke-width="3" />`,
        `<text x="${point.x}" y="${Math.max(28, point.y - 12)}" text-anchor="middle" fill="#34352f" font-size="15" font-weight="700">${point.count}</text>`,
        `<text x="${point.x}" y="236" text-anchor="middle" fill="#66685f" font-size="14">${point.month}月</text>`,
      ].join('')
    })
    .join('')

  return [
    '<section class="not-prose" style="margin:24px 0;padding:20px;border:1px solid #d8d9d1;border-radius:14px;background:linear-gradient(180deg,#fffdf8 0%,#f7f3ea 100%);box-shadow:0 8px 24px rgba(64,53,34,.08)">',
    '<div style="margin-bottom:12px">',
    '<h3 style="margin:0;color:#24251f;font-family:serif;font-size:18px;font-weight:700">记录密度趋势</h3>',
    '<p style="margin:6px 0 0;color:#6f7168;font-size:12px;line-height:1.7">按时间线中有记录的自然日统计；柱形表示每月记录天数，折线呈现变化趋势。频次不代表事件严重程度。</p>',
    '</div>',
    '<div style="width:100%;overflow-x:auto">',
    `<svg viewBox="0 0 700 255" role="img" aria-label="${year} 年每月记录自然日数量趋势" style="display:block;width:100%;min-width:560px;height:auto">`,
    '<line x1="52" y1="74" x2="650" y2="74" stroke="#d8d1c3" stroke-width="1" stroke-dasharray="5 6" />',
    '<line x1="52" y1="140" x2="650" y2="140" stroke="#ded8cc" stroke-width="1" stroke-dasharray="5 6" />',
    '<line x1="52" y1="206" x2="650" y2="206" stroke="#bdb6aa" stroke-width="1.5" />',
    `<path d="${linePath}" fill="none" stroke="#6f5328" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`,
    bars,
    '</svg>',
    '</div>',
    '</section>',
  ].join('')
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
  const { content, highlights } = extractRedHighlights(withImages)
  const { content: decisionContent, blocks: decisionBlocks } = extractDecisionSummaries(content)
  const trendToken = 'TUARANTIMELINETRENDTOKEN'
  const hasTrend = decisionContent.includes('[!timeline-trend]')
  const prepared = hasTrend ? decisionContent.replace('[!timeline-trend]', trendToken) : decisionContent
  const renderer = options.breaks ? markedWithBreaks : marked
  let html = renderer.parse(prepared, { async: false })
  for (const { token, body } of decisionBlocks) {
    html = html.replace(`<p>${token}</p>`, renderDecisionSummary(body, renderer))
  }
  for (const { token, text } of highlights) {
    html = html.replaceAll(
      token,
      `<span style="color:#dc2626;font-weight:650">${escapeHtml(text)}</span>`
    )
  }
  if (hasTrend) {
    html = html.replace(`<p>${trendToken}</p>`, renderTimelineTrend(withImages))
  }
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
