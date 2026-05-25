// 把单个调研变体（markdown）转成可下载的 PPTX。
// 客户端按需调用，pptxgenjs 通过动态 import 懒加载，避免进入主 bundle。

const SLIDE_W = 13.333 // 16:9 默认（英寸）
const SLIDE_H = 7.5

const COLOR_TITLE = '1F2933'
const COLOR_BODY = '3B4252'
const COLOR_ACCENT = 'B7791F'
const COLOR_MUTED = '8B8680'

function stripInlineMd(text) {
  return String(text || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// 把一段 markdown 切成 [{ heading, blocks: [{type, text, level?}]}]
// heading: h2 的标题；intro 段的 heading 为空。
function parseSections(markdown) {
  const lines = String(markdown || '').split(/\r?\n/)
  const sections = []
  let current = { heading: '', blocks: [] }
  let inFence = false
  let paragraphBuffer = []

  function flushParagraph() {
    const text = paragraphBuffer.join(' ').trim()
    if (text) current.blocks.push({ type: 'p', text: stripInlineMd(text) })
    paragraphBuffer = []
  }

  function pushSection() {
    flushParagraph()
    if (current.heading || current.blocks.length) sections.push(current)
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '')
    if (/^```/.test(line)) {
      flushParagraph()
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (/^<!--/.test(line)) continue
    const h2 = /^##\s+(.+)$/.exec(line)
    if (h2) {
      pushSection()
      current = { heading: stripInlineMd(h2[1]), blocks: [] }
      continue
    }
    const h3 = /^###\s+(.+)$/.exec(line)
    if (h3) {
      flushParagraph()
      current.blocks.push({ type: 'h3', text: stripInlineMd(h3[1]) })
      continue
    }
    const h1 = /^#\s+(.+)$/.exec(line)
    if (h1) {
      flushParagraph()
      current.blocks.push({ type: 'h3', text: stripInlineMd(h1[1]) })
      continue
    }
    const li = /^(\s*)(?:[-*+]|\d+\.)\s+(.+)$/.exec(line)
    if (li) {
      flushParagraph()
      const indent = li[1].length
      const level = Math.min(2, Math.floor(indent / 2))
      current.blocks.push({ type: 'li', text: stripInlineMd(li[2]), level })
      continue
    }
    const bq = /^>\s?(.*)$/.exec(line)
    if (bq) {
      flushParagraph()
      const t = stripInlineMd(bq[1])
      if (t) current.blocks.push({ type: 'quote', text: t })
      continue
    }
    if (/^\s*\|/.test(line)) {
      // 表格行：保留原始去掉首尾管道符，作为一行普通文本（v1 简化）
      flushParagraph()
      const cells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((s) => stripInlineMd(s))
        .filter((s) => s && !/^[:\- ]+$/.test(s))
      if (cells.length) current.blocks.push({ type: 'p', text: cells.join(' · ') })
      continue
    }
    if (line.trim() === '') {
      flushParagraph()
      continue
    }
    paragraphBuffer.push(line.trim())
  }
  pushSection()
  return sections
}

// 把一个 section 的 blocks 拆成多张幻灯片用的 chunk（避免单页过长）
const MAX_BLOCKS_PER_SLIDE = 14

function chunkBlocks(blocks) {
  const chunks = []
  let current = []
  for (const block of blocks) {
    current.push(block)
    if (current.length >= MAX_BLOCKS_PER_SLIDE) {
      chunks.push(current)
      current = []
    }
  }
  if (current.length) chunks.push(current)
  if (!chunks.length) chunks.push([])
  return chunks
}

function blocksToTextRuns(blocks) {
  // pptxgenjs 接受 [{ text, options }] 数组
  const runs = []
  for (const block of blocks) {
    if (block.type === 'h3') {
      runs.push({
        text: block.text,
        options: {
          bold: true,
          color: COLOR_ACCENT,
          fontSize: 18,
          paraSpaceBefore: 8,
          paraSpaceAfter: 4,
          breakLine: true,
        },
      })
    } else if (block.type === 'li') {
      runs.push({
        text: block.text,
        options: {
          bullet: { indent: 18 },
          color: COLOR_BODY,
          fontSize: 14,
          indentLevel: block.level || 0,
          paraSpaceAfter: 2,
          breakLine: true,
        },
      })
    } else if (block.type === 'quote') {
      runs.push({
        text: block.text,
        options: {
          italic: true,
          color: COLOR_MUTED,
          fontSize: 13,
          paraSpaceBefore: 4,
          paraSpaceAfter: 4,
          breakLine: true,
        },
      })
    } else {
      runs.push({
        text: block.text,
        options: {
          color: COLOR_BODY,
          fontSize: 14,
          paraSpaceAfter: 4,
          breakLine: true,
        },
      })
    }
  }
  return runs
}

function sanitizeFileName(name) {
  return String(name || 'research')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'research'
}

async function fetchImageAsDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function preloadImages(images) {
  if (!Array.isArray(images) || images.length === 0) return []
  const results = await Promise.all(
    images.map(async (img) => {
      if (!img?.src) return null
      const data = await fetchImageAsDataUrl(img.src)
      if (!data) return null
      return { data, alt: img.alt || '', credit: img.credit || '' }
    }),
  )
  return results.filter(Boolean)
}

/**
 * @param {Object} opts
 * @param {string} opts.title 调研标题（封面）
 * @param {string} [opts.subtitle] 副标题（来源 / TL;DR / 日期等）
 * @param {string} opts.markdown 当前变体的正文 markdown
 * @param {Array<{src:string, alt?:string, credit?:string}>} [opts.images] 配图池
 * @param {string} [opts.fileName] 不带后缀
 */
export async function generateAndDownloadPptx({ title, subtitle, markdown, images, fileName }) {
  const [{ default: PptxGenJS }, loadedImages] = await Promise.all([
    import('pptxgenjs'),
    preloadImages(images),
  ])
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = title || 'Research'

  const heroImage = loadedImages[0] || null
  const sectionImages = loadedImages.length > 0 ? loadedImages : []

  // 封面：左 60% 文字 / 右 40% 图片（无图则全幅文字）
  const cover = pptx.addSlide()
  cover.background = { color: 'FBF7EF' }
  const coverTextW = heroImage ? 7.2 : SLIDE_W - 1.2
  cover.addText('RESEARCH', {
    x: 0.6,
    y: 0.8,
    w: coverTextW,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: COLOR_ACCENT,
    charSpacing: 4,
    fontFace: 'Microsoft YaHei',
  })
  cover.addText(title || 'Research', {
    x: 0.6,
    y: SLIDE_H * 0.30,
    w: coverTextW,
    h: 2.0,
    fontSize: 32,
    bold: true,
    color: COLOR_TITLE,
    fontFace: 'Microsoft YaHei',
    valign: 'top',
  })
  if (subtitle) {
    cover.addText(subtitle, {
      x: 0.6,
      y: SLIDE_H * 0.62,
      w: coverTextW,
      h: 1.8,
      fontSize: 15,
      color: COLOR_BODY,
      fontFace: 'Microsoft YaHei',
      valign: 'top',
    })
  }
  cover.addShape('rect', {
    x: 0.6,
    y: SLIDE_H - 0.85,
    w: 0.4,
    h: 0.04,
    fill: { color: COLOR_ACCENT },
    line: { color: COLOR_ACCENT, width: 0 },
  })
  cover.addText('Generated from 2aran.com', {
    x: 0.6,
    y: SLIDE_H - 0.6,
    w: coverTextW,
    h: 0.3,
    fontSize: 10,
    color: COLOR_MUTED,
    fontFace: 'Microsoft YaHei',
  })
  if (heroImage) {
    cover.addImage({
      data: heroImage.data,
      x: 8.1,
      y: 0,
      w: SLIDE_W - 8.1,
      h: SLIDE_H,
      sizing: { type: 'cover', w: SLIDE_W - 8.1, h: SLIDE_H },
    })
  }

  // 正文
  const sections = parseSections(markdown)
  let slideIdx = 0
  for (const section of sections) {
    const chunks = chunkBlocks(section.blocks)
    chunks.forEach((blocks, idx) => {
      const slide = pptx.addSlide()
      slide.background = { color: 'FFFFFF' }

      // 每页轮换一张图（如果有）
      const sectionImage = sectionImages.length
        ? sectionImages[slideIdx % sectionImages.length]
        : null
      slideIdx += 1

      const hasImage = !!sectionImage
      const textW = hasImage ? 7.6 : SLIDE_W - 1.2

      const headingText = section.heading
        ? section.heading + (chunks.length > 1 ? `（${idx + 1}/${chunks.length}）` : '')
        : '前言'

      slide.addText(headingText, {
        x: 0.6,
        y: 0.4,
        w: textW,
        h: 0.7,
        fontSize: 22,
        bold: true,
        color: COLOR_TITLE,
        fontFace: 'Microsoft YaHei',
      })
      slide.addShape('line', {
        x: 0.6,
        y: 1.15,
        w: 1.2,
        h: 0,
        line: { color: COLOR_ACCENT, width: 2 },
      })

      const runs = blocksToTextRuns(blocks)
      if (runs.length) {
        slide.addText(runs, {
          x: 0.6,
          y: 1.4,
          w: textW,
          h: SLIDE_H - 1.8,
          fontFace: 'Microsoft YaHei',
          valign: 'top',
          autoFit: true,
        })
      }

      if (hasImage) {
        const imgX = 8.5
        const imgW = SLIDE_W - imgX - 0.4
        const imgH = 3.2
        const imgY = 1.4
        slide.addImage({
          data: sectionImage.data,
          x: imgX,
          y: imgY,
          w: imgW,
          h: imgH,
          sizing: { type: 'cover', w: imgW, h: imgH },
        })
        if (sectionImage.alt) {
          slide.addText(sectionImage.alt, {
            x: imgX,
            y: imgY + imgH + 0.1,
            w: imgW,
            h: 0.6,
            fontSize: 9,
            color: COLOR_MUTED,
            italic: true,
            fontFace: 'Microsoft YaHei',
            valign: 'top',
          })
        }
      }
    })
  }

  // 结尾页：全幅图片背景 + 居中标题
  if (heroImage) {
    const closing = pptx.addSlide()
    closing.background = { color: '111821' }
    closing.addImage({
      data: heroImage.data,
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H,
      sizing: { type: 'cover', w: SLIDE_W, h: SLIDE_H },
      transparency: 55,
    })
    closing.addShape('rect', {
      x: 0,
      y: 0,
      w: SLIDE_W,
      h: SLIDE_H,
      fill: { color: '0B1220', transparency: 40 },
      line: { color: '0B1220', width: 0 },
    })
    closing.addText('Thanks · 感谢阅读', {
      x: 0.6,
      y: SLIDE_H * 0.40,
      w: SLIDE_W - 1.2,
      h: 1.2,
      fontSize: 36,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      fontFace: 'Microsoft YaHei',
    })
    closing.addText('2aran.com · 涂阿燃的网络日志', {
      x: 0.6,
      y: SLIDE_H * 0.55,
      w: SLIDE_W - 1.2,
      h: 0.6,
      fontSize: 14,
      color: 'E8DFD0',
      align: 'center',
      fontFace: 'Microsoft YaHei',
    })
  }

  const safe = sanitizeFileName(fileName || title)
  await pptx.writeFile({ fileName: `${safe}.pptx` })
}
