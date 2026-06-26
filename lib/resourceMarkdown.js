import { renderMarkdown } from './research/markdown'

const VOLUME_HEADING_RE = /^#\s+(第[一二三四五六七八]卷[：:].+)$/

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** 规范标题层级、去掉与页面重复的文首，并拉开段前空行。 */
export function prepareResourceLongformMarkdown(raw, { preludePattern } = {}) {
  let lines = String(raw || '').split(/\r?\n/)

  if (preludePattern) {
    const preludeIdx = lines.findIndex((line) => preludePattern.test(line))
    if (preludeIdx > 0) lines = lines.slice(preludeIdx)
  }

  lines = lines.map((line) => {
    if (/^#####\s+/.test(line)) return line
    if (/^####\s+/.test(line)) return line.replace(/^####/, '#####')
    if (/^###\s+/.test(line)) return line.replace(/^###/, '####')
    if (/^##\s+/.test(line)) return line.replace(/^##/, '###')
    if (VOLUME_HEADING_RE.test(line)) return line.replace(/^#\s+/, '## ')
    if (/^#\s+/.test(line)) return line.replace(/^#/, '## ')
    return line
  })

  const out = []
  for (const line of lines) {
    if (/^#{2,5}\s+/.test(line) && out.length && out[out.length - 1].trim() !== '') {
      out.push('')
    }
    if (line.trim() === '---' && out.length && out[out.length - 1].trim() !== '') {
      out.push('')
    }
    out.push(line)
    if (line.trim() === '---') {
      out.push('')
    }
  }

  return out.join('\n')
}

/** 提取 h2（卷 / 前言）与 h3（节）供目录导航。 */
export function extractResourceToc(markdown) {
  const items = []
  const lines = String(markdown || '').split(/\r?\n/)
  let inFence = false

  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const volume = /^##\s+(.+?)\s*$/.exec(line)
    const section = /^###\s+(.+?)\s*$/.exec(line)
    if (volume) {
      const text = volume[1].trim()
      const isVolume = /^第.+卷/.test(text)
      items.push({
        id: slugify(text) || `h-${items.length}`,
        text,
        depth: 2,
        kind: isVolume ? 'volume' : 'preface',
      })
      continue
    }
    if (section) {
      const text = section[1].trim()
      items.push({
        id: slugify(text) || `h-${items.length}`,
        text,
        depth: 3,
        kind: 'section',
      })
    }
  }

  return items
}

function tagVolumeHeadings(html) {
  return html.replace(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g, (full, id, inner) => {
    const plain = inner.replace(/<[^>]+>/g, '')
    if (!/^第.+卷/.test(plain)) return full
    return `<h2 id="${id}" class="resource-volume-heading">${inner}</h2>`
  })
}

export function buildResourceLongformArticle(raw, { slug, title, preludePattern } = {}) {
  const markdown = prepareResourceLongformMarkdown(raw, { preludePattern })
  const toc = extractResourceToc(markdown)
  const html = tagVolumeHeadings(renderMarkdown(markdown, { seed: `resource:${slug}`, title }))
  return { markdown, toc, html }
}

export function buildShenZhiDingNeiArticle(raw) {
  return buildResourceLongformArticle(raw, {
    slug: 'shen-zhi-ding-nei',
    title: '《置身钉内》',
    preludePattern: /^##\s+楔/,
  })
}

export function buildShenZhiDingWaiArticle(raw) {
  return buildResourceLongformArticle(raw, {
    slug: 'shen-zhi-ding-wai',
    title: '《置身钉外》',
    preludePattern: /^#\s+说在前面/,
  })
}

export function buildShenZhiTuanNeiArticle(raw) {
  return buildResourceLongformArticle(raw, {
    slug: 'shen-zhi-tuan-nei',
    title: '《置身团内》',
    // 跳过标题块与来源行，从正文首段开始（卡片已展示标题/作者/来源）
    preludePattern: /^从一个到餐基层产品的视角/,
  })
}

export function buildShenZhiMiNeiArticle(raw) {
  return buildResourceLongformArticle(raw, {
    slug: 'shen-zhi-mi-nei',
    title: '《置身米内》',
    preludePattern: /^初步地反思/,
  })
}

export function buildShenZhiDouNeiArticle(raw) {
  return buildResourceLongformArticle(raw, {
    slug: 'shen-zhi-dou-nei',
    title: '《置身 dou 内 / 置身抖内》',
    preludePattern: /^字节同事圈开始/,
  })
}
