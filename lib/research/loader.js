import fs from 'node:fs'
import path from 'node:path'

const RESEARCH_ROOT = path.join(process.cwd(), 'research')

export const RESEARCH_CATEGORIES = ['companies', 'topics']

export const CATEGORY_META = {
  companies: { label: '公司调研', short: '公司' },
  topics: { label: '事项调研', short: '事项' },
}

const FILENAME_DATE_RE = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/i

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, content: raw }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { data: {}, content: raw }
  const yaml = raw.slice(3, end).trim()
  const content = raw.slice(end + 4).replace(/^\r?\n/, '')

  const data = {}
  for (const line of yaml.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line)
    if (!match) continue
    const key = match[1]
    let value = match[2].trim()
    if (!value) continue
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      continue
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  return { data, content }
}

function fileToSlug(filename) {
  const base = filename.replace(/\.md$/i, '')
  const match = FILENAME_DATE_RE.exec(filename)
  if (match) return match[2]
  return base
}

function safeListDir(dir) {
  try {
    return fs.readdirSync(dir)
  } catch {
    return []
  }
}

function readEntry(category, filename) {
  if (!filename.toLowerCase().endsWith('.md')) return null
  if (filename.toLowerCase() === 'readme.md') return null
  const fullPath = path.join(RESEARCH_ROOT, category, filename)
  let raw
  try {
    raw = fs.readFileSync(fullPath, 'utf8')
  } catch {
    return null
  }
  const { data, content } = parseFrontmatter(raw)
  const slug = fileToSlug(filename)
  const dateFromName = FILENAME_DATE_RE.exec(filename)?.[1]
  const date = data.date || dateFromName || ''

  return {
    category,
    slug,
    filename,
    date,
    title: data.title || slug,
    summary: data.summary || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    source: data.source || '',
    model: data.model || '',
    content,
    raw,
  }
}

let cachedAll = null

function loadAllInternal() {
  if (cachedAll) return cachedAll
  const result = []
  for (const category of RESEARCH_CATEGORIES) {
    const dir = path.join(RESEARCH_ROOT, category)
    const files = safeListDir(dir)
    for (const filename of files) {
      const entry = readEntry(category, filename)
      if (entry) result.push(entry)
    }
  }
  result.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)))
  cachedAll = result
  return result
}

/** Returns all entries with metadata (no markdown body needed for list views). */
export function listResearch() {
  return loadAllInternal().map(({ content, raw, ...meta }) => meta)
}

/** Returns entries filtered by category. */
export function listResearchByCategory(category) {
  return listResearch().filter((entry) => entry.category === category)
}

/** Returns full entry (including raw markdown content) by category + slug. */
export function getResearchEntry(category, slug) {
  return loadAllInternal().find((entry) => entry.category === category && entry.slug === slug) || null
}

/** All (category, slug) pairs — for generateStaticParams. */
export function getAllResearchParams() {
  return loadAllInternal().map((entry) => ({ category: entry.category, slug: entry.slug }))
}
