import fs from 'node:fs'
import path from 'node:path'

import { encryptContent } from './crypto'

const RESEARCH_ROOT = path.join(process.cwd(), 'research')

export const RESEARCH_CATEGORIES = ['companies', 'topics']

export const CATEGORY_META = {
  companies: { label: '公司调研', short: '公司' },
  topics: { label: '事项调研', short: '事项' },
}

// 公司调研二级分类（frontmatter: company_type）
export const COMPANY_TYPES = ['developer_ecosystem', 'content_community', 'enterprise_software', 'cloud_communications', 'new_energy', 'devtools']
export const COMPANY_TYPE_META = {
  developer_ecosystem: { label: '开发者生态', tone: 'blue' },
  content_community: { label: '内容社区', tone: 'rose' },
  enterprise_software: { label: '企业软件', tone: 'emerald' },
  cloud_communications: { label: '云通信', tone: 'violet' },
  new_energy: { label: '新能源', tone: 'amber' },
  devtools: { label: '开发工具', tone: 'slate' },
}

// 事项调研二级分类（frontmatter: topic_type）
// 不改目录结构、不改 URL，仅作为列表/详情页展示标签 + 后续按类型过滤
export const TOPIC_TYPES = ['industry', 'tech', 'product', 'market', 'thesis']
export const TOPIC_TYPE_META = {
  industry: { label: '行业', tone: 'sky' },
  tech: { label: '技术', tone: 'violet' },
  product: { label: '产品', tone: 'emerald' },
  market: { label: '市场', tone: 'amber' },
  thesis: { label: '观点', tone: 'rose' },
}

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

  const companyType = data.company_type && COMPANY_TYPES.includes(data.company_type) ? data.company_type : ''
  const topicType = data.topic_type && TOPIC_TYPES.includes(data.topic_type) ? data.topic_type : ''
  const isEncrypted = data.encrypted === 'true' || data.encrypted === true
  // 加密文章的 tldr 不从正文兜底，避免正文内容泄漏
  const tldr = isEncrypted
    ? data.tldr || data.summary || ''
    : data.tldr || data.summary || extractFallbackTldr(content)
  // 阅读时长在加密前用明文估算（只是一个数字，不泄漏内容）
  const readingMinutes = calcReadingMinutes(content)

  let encryptedPayload = null
  let exposedContent = content
  let exposedRaw = raw
  if (isEncrypted) {
    const password = process.env.RESEARCH_ENCRYPTION_PASSWORD
    if (!password) {
      throw new Error(
        `调研「${filename}」标记了 encrypted: true，但缺少 RESEARCH_ENCRYPTION_PASSWORD 环境变量。` +
          `请在本地 .env.local 与 Cloudflare Pages 构建环境变量中设置它。`,
      )
    }
    encryptedPayload = encryptContent(content, password)
    // 明文绝不进入页面 / 静态产物
    exposedContent = ''
    exposedRaw = ''
  }

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
    version: data.version || '',
    companyType,
    topicType,
    encrypted: isEncrypted,
    encryptedPayload,
    tldr,
    readingMinutes,
    content: exposedContent,
    raw: exposedRaw,
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
  // 列表视图不需要正文，也不需要密文 payload（体积大）
  return loadAllInternal().map(({ content, raw, encryptedPayload, ...meta }) => meta)
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
