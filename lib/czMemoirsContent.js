import fs from 'node:fs'
import path from 'node:path'

import { Marked } from 'marked'

import { CZ_MEMOIR_COVER, getCzMemoirChapter } from './czMemoirs.js'

function escapeAttribute(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function slugifyHeading(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[\s　]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function stripFrontmatter(raw) {
  return String(raw || '').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
}

function buildOutline(markdown) {
  const seen = new Map()
  return [...markdown.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => {
    const title = match[1].replace(/[*_`]/g, '').trim()
    const base = slugifyHeading(title) || 'section'
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    return { title, id: count ? `${base}-${count + 1}` : base }
  })
}

function createRenderer() {
  const seen = new Map()
  const marked = new Marked({ gfm: true })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const text = tokens.map((token) => ('text' in token ? token.text : '')).join('')
        const base = slugifyHeading(text) || `heading-${depth}`
        const count = seen.get(base) || 0
        seen.set(base, count + 1)
        const id = count ? `${base}-${count + 1}` : base
        return `<h${depth} id="${id}">${html}</h${depth}>\n`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const value = String(href || '')
        const safeHref = /^(?:https?:\/\/|mailto:|#|\/)/i.test(value) ? escapeAttribute(value) : '#'
        const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ''
        const external = /^https?:\/\//i.test(value)
        return `<a href="${safeHref}"${titleAttr}${external ? ' target="_blank" rel="noreferrer"' : ''}>${text}</a>`
      },
      image({ href, title, text }) {
        const source = String(href || '').replace(/^\/images\//, CZ_MEMOIR_COVER.replace('/cover.jpg', '/'))
        const titleAttr = title ? ` title="${escapeAttribute(title)}"` : ''
        return `<figure><img src="${escapeAttribute(source)}" alt="${escapeAttribute(text)}"${titleAttr} loading="lazy" decoding="async" /></figure>`
      },
    },
  })

  return marked
}

export function readCzMemoirChapter(slug) {
  const chapter = getCzMemoirChapter(slug)
  if (!chapter) return null

  const file = path.join(process.cwd(), 'content', 'resources', 'cz-memoirs', 'chapters', `${chapter.slug}.md`)
  const raw = stripFrontmatter(fs.readFileSync(file, 'utf8'))
  const markdown = raw
    .replace(/src=(['"])\/images\//g, 'src=$1/images/cz-memoirs/')
    .replace(/\[\^(\d+)\]/g, '<sup class="memoir-footnote">$1</sup>')

  return {
    ...chapter,
    outline: buildOutline(raw),
    // 章节来自当前仓库内受版本控制的可信内容；番外需要保留其推文卡片 HTML。
    html: createRenderer().parse(markdown),
  }
}
