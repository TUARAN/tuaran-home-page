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
export function renderMarkdown(markdown) {
  return marked.parse(markdown || '', { async: false })
}
