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

// data URL 只允许出现在 Markdown 图片里。它用于私密/加密正文的内嵌图片：
// 文件本身跟随正文进入密文，解锁前浏览器拿不到可展示的图片地址。
// 链接仍然走 sanitizeUrl，绝不能放开 data:，否则会扩大 XSS 攻击面。
function sanitizeImageUrl(raw) {
  const value = String(raw || '').trim()
  if (/^data:image\/(?:avif|gif|jpe?g|png|webp);base64,[a-z0-9+/]+=*$/i.test(value)) {
    return value
  }
  return sanitizeUrl(value)
}

function renderImageTag(src, alt, title) {
  const safeSrc = sanitizeImageUrl(src)
  if (!safeSrc) return escapeHtml(alt || '')
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ''
  return [
    `<figure class="research-inline-image">`,
    `<img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(alt || '')}"${titleAttr} loading="lazy" decoding="async" data-research-lightbox="true" role="button" tabindex="0" />`,
    `</figure>`,
  ].join('')
}

const SAFE_DIAGRAM_TAGS = new Set([
  'circle',
  'defs',
  'ellipse',
  'figcaption',
  'figure',
  'g',
  'line',
  'marker',
  'path',
  'polyline',
  'rect',
  'svg',
  'text',
])

const SAFE_DIAGRAM_ATTRS = new Set([
  'aria-hidden',
  'aria-label',
  'class',
  'cx',
  'cy',
  'd',
  'fill',
  'font-size',
  'font-weight',
  'height',
  'id',
  'marker-end',
  'markerheight',
  'markerwidth',
  'opacity',
  'orient',
  'r',
  'refx',
  'refy',
  'role',
  'rx',
  'ry',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-width',
  'text-anchor',
  'viewbox',
  'width',
  'x',
  'x1',
  'x2',
  'y',
  'y1',
  'y2',
])

function readAttributeValue(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const quote = value[0]
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) return value.slice(1, -1)
  return value
}

function isSafeResearchDiagram(html) {
  const source = String(html || '').trim()
  if (!/^<figure\b/i.test(source) || !/<\/figure>$/i.test(source)) return false
  if (!/<figure\b[^>]*\bclass=(["'])research-inline-diagram\1[^>]*>/i.test(source)) return false
  if (!/<svg\b/i.test(source) || !/<\/svg>/i.test(source)) return false
  if (/<!--|<\?|<!\[CDATA\[|<!DOCTYPE/i.test(source)) return false
  if (/\b(?:on[a-z]+|style|href|xlink:href|src)\s*=/i.test(source)) return false
  if (/(?:javascript|data|vbscript):/i.test(source)) return false

  const tagRe = /<\/?([a-zA-Z][\w:-]*)([^>]*)>/g
  let match
  while ((match = tagRe.exec(source))) {
    const tag = match[1].toLowerCase()
    if (!SAFE_DIAGRAM_TAGS.has(tag)) return false
    const isClose = match[0].startsWith('</')
    if (isClose) continue

    const attrs = match[2] || ''
    const attrRe = /([:@A-Za-z_][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g
    let consumed = ''
    let attrMatch
    while ((attrMatch = attrRe.exec(attrs))) {
      consumed += attrMatch[0]
      const name = attrMatch[1].toLowerCase()
      if (!SAFE_DIAGRAM_ATTRS.has(name)) return false
      const value = readAttributeValue(attrMatch[2])
      if (/[<>`]/.test(value) || /(?:javascript|data|vbscript):/i.test(value)) return false
    }
    const rest = attrs.replace(/\s+/g, '').replace(/\/$/, '')
    if (rest !== consumed.replace(/\s+/g, '')) return false
  }
  return true
}

function makeDiagramZoomable(html) {
  return html.replace(
    /^<figure\b([^>]*)>/i,
    '<figure$1 data-research-lightbox="true" role="button" tabindex="0">'
  )
}

function renderHtmlBlock(html) {
  if (isSafeResearchDiagram(html)) return makeDiagramZoomable(html)
  return escapeHtml(html)
}

function isInsideFence(markdown, index) {
  const before = String(markdown || '').slice(0, index).split(/\r?\n/)
  let inFence = false
  for (const line of before) {
    if (/^```/.test(line)) inFence = !inFence
  }
  return inFence
}

function extractTrustedHtmlBlocks(markdown) {
  const blocks = []
  const content = String(markdown || '').replace(
    /<figure\b[^>]*\bclass=(["'])research-inline-diagram\1[^>]*>[\s\S]*?<\/figure>/gi,
    (html, _quote, offset, full) => {
      if (isInsideFence(full, offset) || !isSafeResearchDiagram(html)) return html
      const token = `TUARANTRUSTEDHTML${blocks.length}TOKEN`
      blocks.push({ token, html: makeDiagramZoomable(html) })
      return `\n\n${token}\n\n`
    }
  )
  return { content, blocks }
}

function buildMarked(options = {}) {
  const m = new Marked({ gfm: true, breaks: Boolean(options.breaks) })
  m.use({
    extensions: [
      {
        name: 'cjkStrong',
        level: 'inline',
        start(src) {
          return src.indexOf('**')
        },
        tokenizer(src) {
          // CommonMark's delimiter rules reject several natural Chinese forms,
          // such as `**标签：**正文` and `中文**“短语”**，后文`.
          // Treat an explicit pair of double asterisks as strong emphasis while
          // leaving triple-star emphasis and code spans to Marked's tokenizers.
          const match = /^\*\*(?!\*)(?=\S)([^\n]*?\S)\*\*(?!\*)/u.exec(src)
          if (!match) return undefined
          return {
            type: 'cjkStrong',
            raw: match[0],
            tokens: this.lexer.inlineTokens(match[1]),
          }
        },
        renderer(token) {
          return `<strong>${this.parser.parseInline(token.tokens)}</strong>`
        },
      },
    ],
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
        const extra = isExternal
          ? ' target="_blank" rel="noreferrer"'
          : ''
        const extractAttrs = extractCode
          ? ` data-extract-code="${escapeAttribute(extractCode)}" style="color:#8b5a1f;font-weight:650;text-decoration-line:underline;text-decoration-style:dotted;text-decoration-color:#b8925a;text-underline-offset:4px"`
          : ''
        return `<a href="${escapeAttribute(safeHref)}"${titleAttr}${extra}${extractAttrs}>${text}</a>`
      },
      image({ href, title, text }) {
        return renderImageTag(href, text, title)
      },
      code({ text, lang }) {
        const language = String(lang || '').trim().split(/\s+/, 1)[0].toLowerCase()
        if (language !== 'mermaid') return false
        return `<figure class="mermaid-diagram" data-mermaid-diagram aria-label="Mermaid 图表"><pre class="mermaid-diagram__source"><code>${escapeHtml(text)}</code></pre></figure>\n`
      },
      html({ text }) {
        return renderHtmlBlock(text)
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

const ORGANIC_PV_PLATFORM_RANGES = [
  { name: '抖音', cost: [0.02, 0.05], value: [0.01, 0.03] },
  { name: '小红书', cost: [0.01, 0.03], value: [0.008, 0.02] },
  { name: '微信视频号', cost: [0.015, 0.04], value: [0.01, 0.025] },
  { name: '微信公众号', cost: [0.02, 0.05], value: [0.01, 0.03] },
  { name: 'B 站', cost: [0.01, 0.03], value: [0.008, 0.02] },
  { name: '知乎', cost: [0.015, 0.04], value: [0.01, 0.025] },
  { name: '淘宝搜索', cost: [0.03, 0.08], value: [0.02, 0.06] },
  { name: '京东搜索', cost: [0.04, 0.1], value: [0.03, 0.08] },
  { name: 'Google 搜索', cost: [0.05, 0.15], value: [0.04, 0.12] },
]

const ORGANIC_PV_INDUSTRY_RANGES = [
  { name: '金融 / 法律 / 医疗', value: [0.08, 0.2] },
  { name: '3C 数码 / 家电', value: [0.05, 0.12] },
  { name: '美妆护肤', value: [0.04, 0.1] },
  { name: '母婴用品', value: [0.03, 0.08] },
  { name: '本地生活', value: [0.03, 0.08] },
  { name: '知识付费 / 教育', value: [0.03, 0.06] },
  { name: '服饰鞋包', value: [0.02, 0.06] },
  { name: '食品饮料', value: [0.01, 0.04] },
  { name: '工业品 / 机械', value: [0.01, 0.03] },
  { name: '泛娱乐 / 搞笑', value: [0.005, 0.01] },
]

function formatPvValue(value) {
  return Number(value).toFixed(value < 0.01 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '')
}

function renderRangeSegment(range, max, color, top, height = 5) {
  const left = Math.max(0, Math.min(100, (range[0] / max) * 100))
  const right = Math.max(left, Math.min(100, (range[1] / max) * 100))
  const width = Math.max(2, right - left)
  return `<span aria-hidden="true" style="position:absolute;left:${left.toFixed(2)}%;top:${top}px;width:${width.toFixed(2)}%;height:${height}px;border-radius:999px;background:${color};box-shadow:0 1px 4px ${color}55"></span>`
}

function renderOrganicPvPlatformRow(item) {
  return [
    '<div style="display:grid;grid-template-columns:minmax(82px,112px) minmax(0,1fr);gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(117,139,157,.16)">',
    `<div style="color:#1f2f3b;font-size:12px;font-weight:700;line-height:1.35">${escapeHtml(item.name)}</div>`,
    '<div>',
    '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:5px;color:#647380;font-size:10px;line-height:1.4">',
    `<span>成本 ${formatPvValue(item.cost[0])}—${formatPvValue(item.cost[1])}</span>`,
    `<span>变现 ${formatPvValue(item.value[0])}—${formatPvValue(item.value[1])}</span>`,
    '</div>',
    `<div role="img" aria-label="${escapeAttribute(item.name)}：等效付费成本 ${formatPvValue(item.cost[0])} 到 ${formatPvValue(item.cost[1])} 元每 PV，变现价值 ${formatPvValue(item.value[0])} 到 ${formatPvValue(item.value[1])} 元每 PV" style="position:relative;height:13px;border-radius:999px;background:linear-gradient(90deg,rgba(16,94,132,.07),rgba(16,94,132,.015));overflow:hidden">`,
    renderRangeSegment(item.cost, 0.15, '#176F94', 1),
    renderRangeSegment(item.value, 0.15, '#E28A2C', 7),
    '</div>',
    '</div>',
    '</div>',
  ].join('')
}

function renderOrganicPvIndustryRow(item) {
  const midpoint = (item.value[0] + item.value[1]) / 2
  const width = Math.max(3, Math.min(100, (midpoint / 0.14) * 100))
  return [
    '<div style="display:grid;grid-template-columns:minmax(105px,145px) minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid rgba(117,139,157,.16)">',
    `<div style="color:#1f2f3b;font-size:12px;font-weight:700;line-height:1.35">${escapeHtml(item.name)}</div>`,
    `<div role="img" aria-label="${escapeAttribute(item.name)}：变现价值 ${formatPvValue(item.value[0])} 到 ${formatPvValue(item.value[1])} 元每 PV" style="height:8px;border-radius:999px;background:rgba(226,138,44,.12);overflow:hidden"><span aria-hidden="true" style="display:block;width:${width.toFixed(2)}%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#F0B45B,#D87326)"></span></div>`,
    `<div style="min-width:72px;text-align:right;color:#8A4B18;font-size:10px;font-variant-numeric:tabular-nums">${formatPvValue(item.value[0])}—${formatPvValue(item.value[1])}</div>`,
    '</div>',
  ].join('')
}

function renderOrganicPvVisualization() {
  return [
    '<section class="not-prose" aria-labelledby="organic-pv-viz-title" style="margin:26px 0 34px;padding:22px;border:1px solid rgba(89,122,145,.24);border-radius:18px;background:linear-gradient(145deg,#f5fbff 0%,#fffdf8 58%,#fff7e8 100%);box-shadow:0 14px 36px rgba(35,69,92,.10)">',
    '<div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px">',
    '<div>',
    '<div style="margin-bottom:5px;color:#176f94;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase">PV VALUE MAP</div>',
    '<h3 id="organic-pv-viz-title" style="margin:0;color:#172a38;font-family:serif;font-size:21px;line-height:1.35">平台与行业的单 PV 价值区间</h3>',
    '<p style="margin:7px 0 0;max-width:620px;color:#647380;font-size:12px;line-height:1.7">蓝色表示等效付费成本，橙色表示平均变现价值。区间来自更新版工作簿，适合预算初筛，不代表平台报价或收益承诺。</p>',
    '</div>',
    '<div style="display:flex;gap:8px">',
    '<span style="padding:7px 10px;border-radius:999px;background:#e5f2f7;color:#176f94;font-size:10px;font-weight:750">9 个平台</span>',
    '<span style="padding:7px 10px;border-radius:999px;background:#fff0da;color:#a95b17;font-size:10px;font-weight:750">10 个行业</span>',
    '</div>',
    '</div>',
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:22px">',
    '<div style="padding:16px;border:1px solid rgba(23,111,148,.16);border-radius:14px;background:rgba(255,255,255,.72)">',
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px">',
    '<h4 style="margin:0;color:#17384c;font-size:14px;font-weight:800">平台通用区间</h4>',
    '<div style="display:flex;gap:10px;color:#647380;font-size:9px"><span><i style="display:inline-block;width:8px;height:4px;margin-right:4px;border-radius:9px;background:#176f94"></i>成本</span><span><i style="display:inline-block;width:8px;height:4px;margin-right:4px;border-radius:9px;background:#e28a2c"></i>变现</span></div>',
    '</div>',
    ORGANIC_PV_PLATFORM_RANGES.map(renderOrganicPvPlatformRow).join(''),
    '<div style="display:flex;justify-content:space-between;margin-top:7px;color:#89939c;font-size:9px"><span>0</span><span>0.05</span><span>0.10</span><span>0.15 元 / PV</span></div>',
    '</div>',
    '<div style="padding:16px;border:1px solid rgba(226,138,44,.18);border-radius:14px;background:rgba(255,255,255,.72)">',
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px">',
    '<h4 style="margin:0;color:#17384c;font-size:14px;font-weight:800">行业变现区间</h4>',
    '<span style="color:#8a4b18;font-size:9px">按区间中位值排序</span>',
    '</div>',
    ORGANIC_PV_INDUSTRY_RANGES.map(renderOrganicPvIndustryRow).join(''),
    '</div>',
    '</div>',
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:16px">',
    '<div style="padding:12px 14px;border-radius:12px;background:#eaf4f8"><strong style="display:block;color:#176f94;font-size:12px">搜索意图溢价</strong><span style="display:block;margin-top:4px;color:#5d6b76;font-size:10px;line-height:1.6">Google、京东和淘宝更靠近决策环节，通用区间整体更高。</span></div>',
    '<div style="padding:12px 14px;border-radius:12px;background:#fff1dc"><strong style="display:block;color:#a95b17;font-size:12px">高客单不等于高利润</strong><span style="display:block;margin-top:4px;color:#6f6257;font-size:10px;line-height:1.6">金融、法律、医疗还要扣除无效线索、长归因与合规成本。</span></div>',
    '<div style="padding:12px 14px;border-radius:12px;background:#eef1f3"><strong style="display:block;color:#44535f;font-size:12px">先统一 PV 定义</strong><span style="display:block;margin-top:4px;color:#65727b;font-size:10px;line-height:1.6">页面浏览、播放、曝光和广告展示不能直接横向比较。</span></div>',
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
  const organicPvToken = 'TUARANORGANICPVVISUALIZATIONTOKEN'
  const hasTrend = decisionContent.includes('[!timeline-trend]')
  const hasOrganicPvVisualization = decisionContent.includes('[!organic-pv-visualization]')
  let prepared = hasTrend ? decisionContent.replace('[!timeline-trend]', trendToken) : decisionContent
  if (hasOrganicPvVisualization) {
    prepared = prepared.replace('[!organic-pv-visualization]', organicPvToken)
  }
  const renderer = options.breaks ? markedWithBreaks : marked
  const { content: trustedContent, blocks: trustedBlocks } = extractTrustedHtmlBlocks(prepared)
  let html = renderer.parse(trustedContent, { async: false })
  for (const { token, html: blockHtml } of trustedBlocks) {
    html = html.replace(`<p>${token}</p>`, blockHtml).replaceAll(token, blockHtml)
  }
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
  if (hasOrganicPvVisualization) {
    html = html.replace(`<p>${organicPvToken}</p>`, renderOrganicPvVisualization())
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
