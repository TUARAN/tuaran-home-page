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

/**
 * @param {Object} opts
 * @param {string} opts.title 调研标题（封面）
 * @param {string} [opts.subtitle] 副标题（来源 / TL;DR / 日期等）
 * @param {string} opts.markdown 当前变体的正文 markdown
 * @param {string} [opts.fileName] 不带后缀
 */
export async function generateAndDownloadPptx({ title, subtitle, markdown, fileName }) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = title || 'Research'

  // 封面
  const cover = pptx.addSlide()
  cover.background = { color: 'FBF7EF' }
  cover.addText(title || 'Research', {
    x: 0.6,
    y: SLIDE_H * 0.35,
    w: SLIDE_W - 1.2,
    h: 1.6,
    fontSize: 36,
    bold: true,
    color: COLOR_TITLE,
    fontFace: 'Microsoft YaHei',
  })
  if (subtitle) {
    cover.addText(subtitle, {
      x: 0.6,
      y: SLIDE_H * 0.55,
      w: SLIDE_W - 1.2,
      h: 1.2,
      fontSize: 16,
      color: COLOR_MUTED,
      fontFace: 'Microsoft YaHei',
    })
  }
  cover.addText('Generated from 2aran.com', {
    x: 0.6,
    y: SLIDE_H - 0.6,
    w: SLIDE_W - 1.2,
    h: 0.3,
    fontSize: 10,
    color: COLOR_MUTED,
    fontFace: 'Microsoft YaHei',
  })

  // 正文
  const sections = parseSections(markdown)
  for (const section of sections) {
    const chunks = chunkBlocks(section.blocks)
    chunks.forEach((blocks, idx) => {
      const slide = pptx.addSlide()
      slide.background = { color: 'FFFFFF' }

      const headingText = section.heading
        ? section.heading + (chunks.length > 1 ? `（${idx + 1}/${chunks.length}）` : '')
        : '前言'

      slide.addText(headingText, {
        x: 0.6,
        y: 0.4,
        w: SLIDE_W - 1.2,
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
          w: SLIDE_W - 1.2,
          h: SLIDE_H - 1.8,
          fontFace: 'Microsoft YaHei',
          valign: 'top',
          autoFit: true,
        })
      }
    })
  }

  const safe = sanitizeFileName(fileName || title)
  await pptx.writeFile({ fileName: `${safe}.pptx` })
}
