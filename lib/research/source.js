import { COMPANY_TYPES, TOPIC_TYPES, PEOPLE_TYPES, TECH_TYPES, CONTENT_TYPES, CONTENT_TYPE_META, inferContentType } from './categories.js'
import { resolveResearchDates, formatResearchDateLabel, researchSortKey } from './datetime.js'
import { getResearchImages } from './images.js'

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
  claude: 'Opus 4.7',
  cursor: 'Composer 2.5',
  doubao: '豆包协助',
  codex: 'Codex 协助',
  workbuddy: 'WorkBuddy 协助',
  gemini: 'Gemini 协助',
  gpt: 'GPT 协助',
  manual: '手写',
}

// frontmatter model 优先于 assistance 默认标签；未列出的 ID 原样展示。
export const MODEL_LABELS = {
  fable5: 'Fable 5',
  'claude-opus-4-8': 'Opus 4.8',
  'claude-opus-4-7': 'Opus 4.7',
  'composer-2.5': 'Composer 2.5',
  'gpt-5': 'GPT-5',
  'gpt-5.5': 'GPT-5.5',
  'gpt-5.6': 'GPT-5.6',
}

const VARIANT_MARKER_RE = /^\s*<!--\s*variant\s*:\s*([a-z0-9_-]+)\s*-->\s*$/i

function getResearchAssistanceLabel(assistance) {
  const id = String(assistance || '').toLowerCase()
  if (id === 'manual') return 'TUARAN'
  return VARIANT_LABELS[id] || (id ? `${id} 协助` : '大模型协助')
}

export function getResearchAssistanceDisplayLabel(assistance, model) {
  const modelId = String(model || '').trim().toLowerCase()
  if (modelId) return MODEL_LABELS[modelId] || modelId
  return getResearchAssistanceLabel(assistance)
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

function parseBoolean(value, fallback = false) {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return fallback
}

function normalizePublicTitle(value, fallback) {
  return String(value || fallback || '')
    .replace(/公司调研/g, '公司观察')
    .replace(/人物调研/g, '人物观察')
    .replace(/事项调研/g, '专题分析')
}

function fileToSlug(filename) {
  const base = filename.replace(/\.md$/i, '')
  const match = FILENAME_DATE_RE.exec(filename)
  if (match) return match[2]
  return base
}

export function entryFromResearchSource(category, filename, raw, { encrypt, encryptionPassword } = {}) {
  const { data, content } = parseFrontmatter(raw)
  const slug = fileToSlug(filename)
  const dateFromName = FILENAME_DATE_RE.exec(filename)?.[1]
  const { date, time, dateTimeIso, publishedTime, updated, modifiedTime } = resolveResearchDates(data, dateFromName)
  const dateLabel = formatResearchDateLabel(date, time)
  const sortKey = researchSortKey(date, time)

  // 不在白名单的 type 会被静默丢弃——开发环境下打个警告，避免再出现 seo / dashboard 这种孤儿类型
  if (process.env.NODE_ENV === 'development') {
    if (data.company_type && !COMPANY_TYPES.includes(data.company_type)) {
      console.warn(`[research] ${filename}: company_type "${data.company_type}" 不在 COMPANY_TYPES 白名单，将被忽略`)
    }
    if (data.topic_type && !TOPIC_TYPES.includes(data.topic_type)) {
      console.warn(`[research] ${filename}: topic_type "${data.topic_type}" 不在 TOPIC_TYPES 白名单，将被忽略`)
    }
    if (data.people_type && !PEOPLE_TYPES.includes(data.people_type)) {
      console.warn(`[research] ${filename}: people_type "${data.people_type}" 不在 PEOPLE_TYPES 白名单，将被忽略`)
    }
    if (data.tech_type && !TECH_TYPES.includes(data.tech_type)) {
      console.warn(`[research] ${filename}: tech_type "${data.tech_type}" 不在 TECH_TYPES 白名单，将被忽略`)
    }
  }
  const companyType = data.company_type && COMPANY_TYPES.includes(data.company_type) ? data.company_type : ''
  const topicType = data.topic_type && TOPIC_TYPES.includes(data.topic_type) ? data.topic_type : ''
  const peopleType = data.people_type && PEOPLE_TYPES.includes(data.people_type) ? data.people_type : ''
  const techType = data.tech_type && TECH_TYPES.includes(data.tech_type) ? data.tech_type : ''
  const cryptoType = String(data.crypto_type || '').trim()
  const coinId = String(data.coin_id || '').trim()
  const symbol = String(data.symbol || '').trim()
  const marketCapRank = Number.isInteger(Number(data.market_cap_rank)) ? Number(data.market_cap_rank) : null
  const isEncrypted = data.encrypted === 'true' || data.encrypted === true
  const isSourceEncrypted = data.encrypted_source === 'true' || data.encrypted_source === true
  const hasAssessment = data.assessment === 'true' || data.assessment === true || data.has_assessment === 'true' || data.has_assessment === true
  const requestedContentType = String(data.content_type || '').trim().toLowerCase()
  const contentType = CONTENT_TYPES.includes(requestedContentType)
    ? requestedContentType
    : inferContentType({ category, topicType, hasAssessment })
  const contentTypeLabel = CONTENT_TYPE_META[contentType]?.label || '分析'
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
      const password = encryptionPassword
      if (!password) {
        throw new Error(
          `调研「${filename}」标记了 encrypted: true，但缺少 RESEARCH_ENCRYPTION_PASSWORD 环境变量。` +
            `请在本地 .env.local 与 Cloudflare Pages 构建环境变量中设置它。`,
        )
      }
      encryptedPayload = encrypt(content, password)
    }
    // 明文绝不进入页面 / 静态产物
    exposedContent = ''
    exposedRaw = ''
  }

  const assistance = data.assistance || ''
  const model = data.model || ''
  const defaultVariantId = (assistance || 'claude-code').toLowerCase()
  const variants = isEncrypted ? [] : splitVariants(exposedContent, defaultVariantId)
  const assistanceDisplayLabel = getResearchAssistanceDisplayLabel(assistance, model)
  const showAssistance = parseBoolean(data.show_assistance, variants.length > 1)
  const reviewReady = parseBoolean(data.review_ready, false)
  const adEligible = parseBoolean(data.ad_eligible, false)

  const entry = {
    category,
    slug,
    filename,
    date,
    time,
    dateLabel,
    sortKey,
    dateTimeIso,
    publishedTime,
    updated,
    modifiedTime,
    title: normalizePublicTitle(data.title, slug),
    summary: data.summary || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    subjects: Array.isArray(data.subjects) ? data.subjects : [],
    assistance,
    model,
    showAssistance,
    assistanceLabel: assistanceDisplayLabel,
    // 兼容老的消费方：source/sourceLabel 仍可读取，等所有调用方都改完再删
    source: assistance,
    sourceLabel: assistanceDisplayLabel,
    version: data.version || '',
    contentType,
    contentTypeLabel,
    reviewReady,
    adEligible,
    pv: parseNonNegativeInteger(data.pv),
    companyType,
    topicType,
    peopleType,
    techType,
    cryptoType,
    coinId,
    symbol,
    marketCapRank,
    hasAssessment,
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
