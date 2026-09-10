import { entryFromResearchSource } from './source.js'
export { VARIANT_LABELS, MODEL_LABELS, getResearchAssistanceDisplayLabel } from './source.js'
import fs from 'node:fs'
import path from 'node:path'

import {
  CATEGORY_META,
  CONTENT_TYPE_META,
  CONTENT_TYPES,
  COMPANY_TYPE_META,
  COMPANY_TYPES,
  PEOPLE_TYPE_META,
  PEOPLE_TYPES,
  RESEARCH_CATEGORIES,
  TECH_TYPE_META,
  TECH_TYPES,
  TOPIC_TYPE_META,
  TOPIC_TYPES,
  getCompanyTypeFilters,
  getPeopleTypeFilters,
  getTechTypeFilters,
  getTopicTypeFilters,
  inferContentType,
} from './categories.js'
import { encryptContent } from './crypto.js'
import {
  compareSortKeyDesc,
  formatResearchDateLabel,
  resolveResearchDates,
  researchSortKey,
} from './datetime.js'
import { getResearchImages } from './images.js'

// 透传：让现有 `import ... from 'lib/research/loader'` 的代码继续可用，
// 但分类的"真理源"在 lib/research/categories.js，加 / 改 / 删分类只动那里。
export {
  CATEGORY_META,
  CONTENT_TYPE_META,
  CONTENT_TYPES,
  COMPANY_TYPE_META,
  COMPANY_TYPES,
  PEOPLE_TYPE_META,
  PEOPLE_TYPES,
  RESEARCH_CATEGORIES,
  TECH_TYPE_META,
  TECH_TYPES,
  TOPIC_TYPE_META,
  TOPIC_TYPES,
  getCompanyTypeFilters,
  getPeopleTypeFilters,
  getTechTypeFilters,
  getTopicTypeFilters,
  inferContentType,
}

const RESEARCH_ROOT = path.join(process.cwd(), 'research')

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
  return entryFromResearchSource(category, filename, raw, { encrypt: encryptContent, encryptionPassword: process.env.RESEARCH_ENCRYPTION_PASSWORD })
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
  result.sort((a, b) => compareSortKeyDesc(a.sortKey, b.sortKey, a.slug, b.slug))
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
