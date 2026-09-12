import { CONTENT_GROUP_KEYS, SUBJECT_KEYS, getContentGroup } from './contentTaxonomy.js'

const LEGACY_TAB_TO_GROUP = {
  column: 'article',
  posts: 'article',
  research: 'analysis',
  companies: 'analysis',
  people: 'analysis',
  topics: 'analysis',
  tech: 'analysis',
  business: 'analysis',
  other: 'analysis',
  'engineering-cases': 'practice',
  'build-logs': 'practice',
  works: 'interactive',
  resources: 'resource',
}

const LEGACY_RESOURCE_TO_FACETS = {
  'ai-dev': { subject: 'ai_dev' },
  'ai-music': { subject: 'content_creation' },
  'humanities-politics': { subject: 'humanities_history' },
  workplace: { subject: 'workplace_org' },
}

export const EMPTY_DIRECTORY_FILTERS = Object.freeze({
  group: 'all',
  subject: 'all',
  query: '',
})

function normalizeEnum(value, keys, fallback = 'all') {
  return keys.includes(value) ? value : fallback
}

export function toUrlSearchParams(value) {
  if (value instanceof URLSearchParams) return value
  if (value && typeof value.get === 'function') return value

  const params = new URLSearchParams()
  if (!value || typeof value !== 'object') return params

  for (const [key, raw] of Object.entries(value)) {
    const values = Array.isArray(raw) ? raw : [raw]
    for (const entry of values) {
      if (entry == null || entry === '') continue
      params.append(key, String(entry))
    }
  }
  return params
}

export function filtersFromParams(params) {
  const search = toUrlSearchParams(params)
  const legacyTab = search.get('tab') || ''
  const legacyResource = LEGACY_RESOURCE_TO_FACETS[search.get('resource_type')] || {}
  const groupFromLegacy = LEGACY_TAB_TO_GROUP[legacyTab] || ''
  const kind = search.get('kind')
  const entity = search.get('entity') || search.get('company_type') || search.get('people_type')
  const delivery = search.get('delivery')
  const inferredGroup = kind
    ? getContentGroup(kind)
    : entity || search.get('company_industry') || search.get('company_role')
      ? 'analysis'
      : ['subscribe', 'download', 'watch_listen', 'external'].includes(delivery)
        ? 'resource'
        : delivery === 'interact'
          ? 'interactive'
          : search.get('resource_type')
            ? 'resource'
            : ''
  const group = normalizeEnum(
    search.get('group') || groupFromLegacy || inferredGroup,
    CONTENT_GROUP_KEYS,
  )
  const subjectParam = search.get('subject')
  const subjectFromLegacy = subjectParam === 'product_business' ? 'business_market' : subjectParam

  return {
    group,
    subject: normalizeEnum(subjectFromLegacy || legacyResource.subject, ['all', ...SUBJECT_KEYS]),
    query: search.get('q') || '',
  }
}

export function buildDirectoryUrl(filters) {
  const params = new URLSearchParams()
  if (filters.group !== 'all') params.set('group', filters.group)
  if (filters.subject !== 'all') params.set('subject', filters.subject)
  const query = String(filters.query || '').trim()
  if (query) params.set('q', query)
  const suffix = params.toString()
  return suffix ? `/articles?${suffix}` : '/articles'
}

export function sameDirectoryFilters(left, right) {
  return left.group === right.group && left.subject === right.subject && left.query === right.query
}
