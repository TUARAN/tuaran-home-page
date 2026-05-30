import fs from 'node:fs'
import path from 'node:path'

import {
  CATEGORY_META,
  COMPANY_TYPE_META,
  COMPANY_TYPES,
  RESEARCH_CATEGORIES,
  TOPIC_TYPE_META,
  TOPIC_TYPES,
  getCompanyTypeFilters,
  getTopicTypeFilters,
} from './categories'
import { encryptContent } from './crypto'
import { getResearchImages } from './images'

// 透传：让现有 `import ... from 'lib/research/loader'` 的代码继续可用，
// 但分类的"真理源"在 lib/research/categories.js，加 / 改 / 删分类只动那里。
export {
  CATEGORY_META,
  COMPANY_TYPE_META,
  COMPANY_TYPES,
  RESEARCH_CATEGORIES,
  TOPIC_TYPE_META,
  TOPIC_TYPES,
  getCompanyTypeFilters,
  getTopicTypeFilters,
}

const RESEARCH_ROOT = path.join(process.cwd(), 'research')

/**
 * 按 300 字/分钟、中文按字符计 估算阅读时长。
 * 1 分钟向下截断到 1 分钟，避免显示 "0 分钟"。
 */
function calcReadingMinutes(content) {
  if (typeof content !== 'string') return 1
  // 中文字符按 1 字符算，英文按词算（粗略）
  const cnCount = (content.match(/[一-龥]/g) || []).length
  const enWords = content
    .replace(/[一-龥]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  const minutes = Math.ceil((cnCount + enWords * 2) / 300)
  return Math.max(1, minutes)
}

/**
 * 从正文里抽一句 TL;DR 作为 fallback：取第一段非标题/非引用/非空的内容，截断 80 字。
 */
function extractFallbackTldr(content) {
  if (typeof content !== 'string') return ''
  const paragraphs = content.split(/\n\s*\n/)
  for (const p of paragraphs) {
    const line = p.trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('>') || line.startsWith('---')) continue
    if (line.startsWith('|') || line.startsWith('-') || line.startsWith('*')) continue
    const cleaned = line.replace(/[*_`]/g, '').replace(/\s+/g, ' ')
    if (cleaned.length < 8) continue
    return cleaned.length > 80 ? cleaned.slice(0, 80) + '…' : cleaned
  }
  return ''
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

// 协助工具标签：以 <!-- variant:xxx --> 为分隔符将正文切分成多个版本。
// 默认（分隔符之前）是 source 指定的协助工具，否则 claude-code。
export const VARIANT_LABELS = {
  'claude-code': 'Opus 4.7',
  cursor: 'Composer 2.5',
  doubao: '豆包协助',
  codex: 'GPT5.5',
  gemini: 'Gemini 协助',
  gpt: 'GPT 协助',
  manual: '手写',
}

const VARIANT_MARKER_RE = /^\s*<!--\s*variant\s*:\s*([a-z0-9_-]+)\s*-->\s*$/i

function getResearchAssistanceLabel(assistance) {
  const id = String(assistance || '').toLowerCase()
  if (id === 'manual') return 'TUARAN'
  return VARIANT_LABELS[id] || (id ? `${id} 协助` : '大模型协助')
}

function splitVariants(content, defaultId) {
  const baseId = defaultId || 'claude-code'
  const lines = String(content || '').split(/\r?\n/)
  const segments = []
  let currentId = baseId
  let currentLines = []
  for (const line of lines) {
    const m = VARIANT_MARKER_RE.exec(line)
    if (m) {
      segments.push({ id: currentId, content: currentLines.join('\n').trim() })
      currentId = m[1].toLowerCase()
      currentLines = []
      continue
    }
    currentLines.push(line)
  }
  segments.push({ id: currentId, content: currentLines.join('\n').trim() })
  const nonEmpty = segments.filter((s) => s.content.length > 0)
  const result = nonEmpty.length > 0 ? nonEmpty : [{ id: baseId, content: '' }]
  return result.map((s) => ({
    id: s.id,
    label: VARIANT_LABELS[s.id] || s.id,
    content: s.content,
  }))
}

function parseNonNegativeInteger(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
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

  // 不在白名单的 type 会被静默丢弃——开发环境下打个警告，避免再出现 seo / dashboard 这种孤儿类型
  if (process.env.NODE_ENV === 'development') {
    if (data.company_type && !COMPANY_TYPES.includes(data.company_type)) {
      console.warn(`[research] ${filename}: company_type "${data.company_type}" 不在 COMPANY_TYPES 白名单，将被忽略`)
    }
    if (data.topic_type && !TOPIC_TYPES.includes(data.topic_type)) {
      console.warn(`[research] ${filename}: topic_type "${data.topic_type}" 不在 TOPIC_TYPES 白名单，将被忽略`)
    }
  }
  const companyType = data.company_type && COMPANY_TYPES.includes(data.company_type) ? data.company_type : ''
  const topicType = data.topic_type && TOPIC_TYPES.includes(data.topic_type) ? data.topic_type : ''
  const isEncrypted = data.encrypted === 'true' || data.encrypted === true
  const isSourceEncrypted = data.encrypted_source === 'true' || data.encrypted_source === true
  // 加密文章的 tldr 不从正文兜底，避免正文内容泄漏
  const tldr = isEncrypted
    ? data.tldr || data.summary || ''
    : data.tldr || data.summary || extractFallbackTldr(content)
  // 阅读时长在加密前用明文估算（只是一个数字，不泄漏内容）
  const readingMinutes = isSourceEncrypted && data.reading_minutes
    ? Math.max(1, Number(data.reading_minutes) || 1)
    : calcReadingMinutes(content)

  let encryptedPayload = null
  let exposedContent = content
  let exposedRaw = raw
  if (isEncrypted) {
    if (isSourceEncrypted) {
      try {
        encryptedPayload = JSON.parse(content)
      } catch {
        throw new Error(`调研「${filename}」标记了 encrypted_source: true，但正文不是合法的加密 payload JSON。`)
      }
    } else {
      const password = process.env.RESEARCH_ENCRYPTION_PASSWORD
      if (!password) {
        throw new Error(
          `调研「${filename}」标记了 encrypted: true，但缺少 RESEARCH_ENCRYPTION_PASSWORD 环境变量。` +
            `请在本地 .env.local 与 Cloudflare Pages 构建环境变量中设置它。`,
        )
      }
      encryptedPayload = encryptContent(content, password)
    }
    // 明文绝不进入页面 / 静态产物
    exposedContent = ''
    exposedRaw = ''
  }

  const assistance = data.assistance || ''
  const defaultVariantId = (assistance || 'claude-code').toLowerCase()
  const variants = isEncrypted ? [] : splitVariants(exposedContent, defaultVariantId)

  const entry = {
    category,
    slug,
    filename,
    date,
    title: data.title || slug,
    summary: data.summary || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    assistance,
    assistanceLabel: getResearchAssistanceLabel(assistance),
    // 兼容老的消费方：source/sourceLabel 仍可读取，等所有调用方都改完再删
    source: assistance,
    sourceLabel: getResearchAssistanceLabel(assistance),
    version: data.version || '',
    pv: parseNonNegativeInteger(data.pv),
    companyType,
    topicType,
    encrypted: isEncrypted,
    encryptedPayload,
    tldr,
    readingMinutes,
    content: exposedContent,
    raw: exposedRaw,
    variants,
  }
  return {
    ...entry,
    images: getResearchImages(entry),
  }
}

let cachedAll = null

function loadAllInternal() {
  const shouldUseCache = process.env.NODE_ENV !== 'development'
  if (shouldUseCache && cachedAll) return cachedAll
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
  if (shouldUseCache) cachedAll = result
  return result
}

/** Returns all entries with metadata (no markdown body needed for list views). */
export function listResearch() {
  // 列表视图不需要正文，也不需要密文 payload（体积大）
  return loadAllInternal().map(({ content, raw, encryptedPayload, variants, ...meta }) => meta)
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
