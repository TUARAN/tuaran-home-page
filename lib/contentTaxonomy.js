/**
 * 公开内容的信息架构契约。
 *
 * 规则：
 * - contentKind：内部单选形态；公开“类型”严格使用它映射到的五个 group。
 * - subjects：长度固定为 1 的数组，说明内容的唯一主题。
 * - entityType：可选，说明主要研究对象。
 * - delivery：单选，说明读者如何使用。
 * - series：可选，只用于持续更新且有固定名称的系列。
 *
 * 旧的 category / topicType / resourceType 继续作为内容源字段存在，
 * 但不能再直接充当前台同一级导航。
 */

export const CONTENT_KIND_META = {
  article: { label: '精选', group: 'article' },
  analysis: { label: '分析', group: 'analysis' },
  practice: { label: '实践', group: 'practice' },
  guide: { label: '实践', group: 'practice' },
  profile: { label: '分析', group: 'analysis' },
  fact_check: { label: '分析', group: 'analysis' },
  archive: { label: '资源', group: 'resource' },
  interactive: { label: '互动', group: 'interactive' },
  resource: { label: '资源', group: 'resource' },
}

export const CONTENT_GROUP_META = {
  all: { label: '全部' },
  article: { label: '精选' },
  analysis: { label: '分析' },
  practice: { label: '实践' },
  interactive: { label: '互动' },
  resource: { label: '资源' },
}

export const SUBJECT_META = {
  ai_dev: { label: 'AI 与开发' },
  web_cloud: { label: 'Web 与云' },
  product_experience: { label: '产品与体验' },
  business_market: { label: '商业与市场' },
  company_research: { label: '公司调研' },
  people_profiles: { label: '人物观察' },
  content_creation: { label: '内容创作' },
  workplace_org: { label: '职场与组织' },
  humanities_history: { label: '人文与历史' },
  life_family: { label: '生活与家庭' },
}

export const ENTITY_TYPE_META = {
  company: { label: '公司' },
  person: { label: '人物' },
  product: { label: '产品' },
  technology: { label: '技术' },
  industry: { label: '行业' },
}

export const COMPANY_INDUSTRY_META = {
  software_development: { label: '开发者与软件' },
  enterprise_software: { label: '企业软件' },
  creator_economy: { label: '内容与创作者经济' },
  communications: { label: '云通信' },
  new_energy: { label: '新能源' },
  logistics: { label: '物流' },
}

export const COMPANY_ROLE_META = {
  ecosystem_platform: { label: '生态平台' },
  community: { label: '社区' },
  software_vendor: { label: '软件与工具厂商' },
  infrastructure: { label: '基础设施' },
  independent_business: { label: '个人业务' },
  operating_company: { label: '产业公司' },
}

export const DELIVERY_META = {
  read: { label: '阅读' },
  interact: { label: '交互' },
  download: { label: '下载' },
  subscribe: { label: '订阅' },
  watch_listen: { label: '观看 / 收听' },
  external: { label: '外部访问' },
}

export const SERIES_META = {
  frontend_weekly: { label: '前端周看' },
  a_share_research: { label: 'A股调研' },
  crypto_research: { label: '加密调研' },
  dad_stack: { label: 'Dad Stack' },
  monthly_retrospective: { label: '月度回顾' },
}

export const CONTENT_KIND_KEYS = Object.keys(CONTENT_KIND_META)
export const CONTENT_GROUP_KEYS = Object.keys(CONTENT_GROUP_META)
export const SUBJECT_KEYS = Object.keys(SUBJECT_META)
export const ENTITY_TYPE_KEYS = Object.keys(ENTITY_TYPE_META)
export const COMPANY_INDUSTRY_KEYS = Object.keys(COMPANY_INDUSTRY_META)
export const COMPANY_ROLE_KEYS = Object.keys(COMPANY_ROLE_META)
export const DELIVERY_KEYS = Object.keys(DELIVERY_META)
export const SERIES_KEYS = Object.keys(SERIES_META)

const CONTENT_TYPE_TO_KIND = {
  opinion: 'analysis',
  analysis: 'analysis',
  engineering_case: 'practice',
  build_log: 'practice',
  practice: 'practice',
  guide: 'guide',
  fact_check: 'fact_check',
  profile: 'profile',
  archive: 'archive',
  research: 'analysis',
}

const TECH_TYPE_TO_SUBJECT = {
  models_compute: 'ai_dev',
  agents_automation: 'ai_dev',
  ai_coding: 'ai_dev',
  web_cloud: 'web_cloud',
  architecture: 'web_cloud',
  security_identity: 'web_cloud',
  networking: 'web_cloud',
  data_algorithms: 'ai_dev',
}

const TOPIC_TYPE_TO_SUBJECT = {
  industry: 'business_market',
  tech: 'ai_dev',
  product: 'product_experience',
  market: 'business_market',
  parenting: 'life_family',
  thesis: 'humanities_history',
  writing: 'content_creation',
  workplace: 'workplace_org',
}

const ARTICLE_CATEGORY_TO_SUBJECT = {
  AI: 'ai_dev',
  'AI 工程': 'ai_dev',
  工程化: 'web_cloud',
  开源贡献: 'ai_dev',
  创作: 'content_creation',
  社区: 'workplace_org',
  随笔: 'life_family',
}

const ARTICLE_SLUG_TO_SUBJECT = {
  'ocr-comparison-paddleocr-vl': 'ai_dev',
  'content-os-blogger-matrix-alliance': 'content_creation',
  'blogger-future-community': 'workplace_org',
  'diary-self-reflection': 'life_family',
}

const RESOURCE_TYPE_TO_SUBJECT = {
  'ai-dev': 'ai_dev',
  'ai-music': 'content_creation',
  'humanities-politics': 'humanities_history',
  rss: 'content_creation',
  twitter: 'content_creation',
  youtube: 'humanities_history',
  workplace: 'workplace_org',
  'visual-assets': 'content_creation',
  'film-media': 'humanities_history',
  other: 'content_creation',
}

const RESOURCE_TYPE_TO_DELIVERY = {
  rss: 'subscribe',
  twitter: 'external',
  youtube: 'watch_listen',
  'ai-music': 'watch_listen',
  'visual-assets': 'download',
  'film-media': 'watch_listen',
}

const COMPANY_TYPE_TO_INDUSTRY = {
  developer_ecosystem: 'software_development',
  developer_community: 'software_development',
  content_community: 'creator_economy',
  enterprise_software: 'enterprise_software',
  cloud_communications: 'communications',
  new_energy: 'new_energy',
  devtools: 'software_development',
  knowledge_paywall_solo: 'creator_economy',
  logistics: 'logistics',
}

const COMPANY_TYPE_TO_ROLE = {
  developer_ecosystem: 'ecosystem_platform',
  developer_community: 'community',
  content_community: 'community',
  enterprise_software: 'software_vendor',
  cloud_communications: 'infrastructure',
  new_energy: 'operating_company',
  devtools: 'software_vendor',
  knowledge_paywall_solo: 'independent_business',
  logistics: 'operating_company',
}

export function companyFacetsForLegacyType(companyType) {
  return {
    companyIndustry: COMPANY_TYPE_TO_INDUSTRY[companyType] || '',
    companyRole: COMPANY_TYPE_TO_ROLE[companyType] || '',
  }
}

function uniqueKnown(values, knownKeys, fallback) {
  const known = new Set(knownKeys)
  const result = [...new Set((Array.isArray(values) ? values : [values]).filter((value) => known.has(value)))]
  if (!result.length && fallback) return [fallback]
  return result.slice(0, 1)
}

function inferSeries({ slug = '', href = '', title = '' } = {}) {
  const haystack = `${slug} ${href} ${title}`.toLowerCase()
  if (haystack.includes('frontend-weekly') || haystack.includes('前端周看')) return 'frontend_weekly'
  if (/a-share-\d{6}/.test(haystack) || haystack.includes('/a-share-research') || haystack.includes('每天一家a股')) return 'a_share_research'
  if (/crypto-[a-z0-9-]+/.test(haystack) || haystack.includes('/crypto-research') || haystack.includes('每天一个加密资产')) return 'crypto_research'
  if (haystack.includes('dad-stack')) return 'dad_stack'
  if (haystack.includes('site-retrospective') || haystack.includes('月度回顾')) return 'monthly_retrospective'
  return ''
}

export function getContentGroup(contentKind) {
  return CONTENT_KIND_META[contentKind]?.group || 'article'
}

export function getDisplaySubject(subjects = [], selectedSubject = 'all') {
  const knownSubjects = Array.isArray(subjects)
    ? subjects.filter((subject) => SUBJECT_KEYS.includes(subject))
    : []
  if (selectedSubject !== 'all' && knownSubjects.includes(selectedSubject)) return selectedSubject
  return knownSubjects[0] || ''
}

const SUBJECT_ENTITY_REDUNDANCIES = {
  ai_dev: 'technology',
  web_cloud: 'technology',
  company_research: 'company',
  people_profiles: 'person',
  product_experience: 'product',
}

export function isEntityTypeRedundant(entityType, subjects = []) {
  if (!entityType || !Array.isArray(subjects)) return false
  return subjects.some((subject) => SUBJECT_ENTITY_REDUNDANCIES[subject] === entityType)
}

export function taxonomyForArticle({ category, slug, href, title } = {}) {
  return {
    contentKind: 'article',
    subjects: uniqueKnown(
      [ARTICLE_SLUG_TO_SUBJECT[slug], ARTICLE_CATEGORY_TO_SUBJECT[category]],
      SUBJECT_KEYS,
      'web_cloud',
    ),
    entityType: '',
    delivery: 'read',
    series: inferSeries({ slug, href, title }),
  }
}

export function taxonomyForResearch(entry = {}) {
  const companyFacets = companyFacetsForLegacyType(entry.companyType)
  const explicitSubjects = uniqueKnown(entry.subjects, SUBJECT_KEYS)
  const isAShareResearch = entry.category === 'companies'
    && (entry.companyType === 'a_share' || /^a-share-\d{6}$/.test(String(entry.slug || '')))
  const subjects = (
    explicitSubjects.length
      ? explicitSubjects
      : uniqueKnown(
          [
            TECH_TYPE_TO_SUBJECT[entry.techType],
            entry.category === 'companies' ? '' : TOPIC_TYPE_TO_SUBJECT[entry.topicType],
            isAShareResearch ? 'business_market' : entry.category === 'companies' ? 'company_research' : '',
            entry.category === 'people' ? 'people_profiles' : '',
          ],
          SUBJECT_KEYS,
          'humanities_history',
        )
    ).slice(0, 1)

  const entityType =
    entry.category === 'companies'
      ? 'company'
      : entry.category === 'people'
        ? 'person'
        : entry.topicType === 'industry'
          ? 'industry'
          : entry.topicType === 'product'
            ? 'product'
            : entry.topicType === 'tech'
              ? 'technology'
              : ''

  return {
    contentKind: CONTENT_TYPE_TO_KIND[entry.contentType] || 'analysis',
    subjects,
    entityType,
    delivery: 'read',
    series: inferSeries(entry),
    companyIndustry: entry.category === 'companies' ? companyFacets.companyIndustry : '',
    companyRole: entry.category === 'companies' ? companyFacets.companyRole : '',
  }
}

export function taxonomyForResource(resource = {}) {
  const explicitSubjects = uniqueKnown(resource.subjects, SUBJECT_KEYS)
  return {
    contentKind: 'resource',
    subjects: (
      explicitSubjects.length
        ? explicitSubjects
        : uniqueKnown([RESOURCE_TYPE_TO_SUBJECT[resource.resourceType]], SUBJECT_KEYS, 'content_creation')
    ).slice(0, 1),
    entityType: '',
    delivery: RESOURCE_TYPE_TO_DELIVERY[resource.resourceType] || 'read',
    series: inferSeries(resource),
    sourceChannel: ['rss', 'twitter', 'youtube'].includes(resource.resourceType)
      ? resource.resourceType
      : '',
  }
}

export function taxonomyForInteractive(work = {}) {
  const explicitSubjects = uniqueKnown(work.subjects, SUBJECT_KEYS)
  const text = `${work.category || ''} ${work.kind || ''} ${work.title || ''} ${work.summary || ''}`.toLowerCase()
  const subjects = []
  if (/ai|agent|模型|skill|智能/.test(text)) subjects.push('ai_dev')
  if (/工程|web|cloudflare|网络|架构|开发/.test(text)) subjects.push('web_cloud')
  if (/产品|体验|设计|用户|需求/.test(text)) subjects.push('product_experience')
  if (/商业|投资|公司|行业|市场|增长/.test(text)) subjects.push('business_market')
  if (/内容|写作|创作|视觉|宣发/.test(text)) subjects.push('content_creation')
  if (/职场|组织|社群/.test(text)) subjects.push('workplace_org')
  if (/历史|政治|人文/.test(text)) subjects.push('humanities_history')
  if (/生活|育儿|父亲|家庭/.test(text)) subjects.push('life_family')

  return {
    contentKind: 'interactive',
    subjects: (
      explicitSubjects.length
        ? explicitSubjects
        : uniqueKnown(subjects, SUBJECT_KEYS, 'web_cloud')
    ).slice(0, 1),
    entityType: '',
    delivery: 'interact',
    series: inferSeries(work),
  }
}

export function taxonomyForManualEntry(entry = {}) {
  if (entry.type === 'resource') return taxonomyForResource({ ...entry, resourceType: entry.resourceType || 'other' })
  if (entry.type === 'research') {
    return taxonomyForResearch({
      ...entry,
      contentType: entry.contentType || 'analysis',
      topicType: entry.topicType || '',
      techType: entry.techType || '',
    })
  }
  return taxonomyForArticle(entry)
}

export function validateTaxonomyRecord(record = {}) {
  const errors = []
  if (!CONTENT_KIND_KEYS.includes(record.contentKind)) errors.push('contentKind 必须是受控单选值')
  if (!Array.isArray(record.subjects) || record.subjects.length !== 1) {
    errors.push('subjects 必须且只能包含 1 个主题')
  } else if (record.subjects.some((subject) => !SUBJECT_KEYS.includes(subject))) {
    errors.push('subjects 包含未知主题')
  }
  if (record.entityType && !ENTITY_TYPE_KEYS.includes(record.entityType)) errors.push('entityType 包含未知对象类型')
  if (record.companyIndustry && !COMPANY_INDUSTRY_KEYS.includes(record.companyIndustry)) {
    errors.push('companyIndustry 包含未知行业')
  }
  if (record.companyRole && !COMPANY_ROLE_KEYS.includes(record.companyRole)) errors.push('companyRole 包含未知角色')
  if (!DELIVERY_KEYS.includes(record.delivery)) errors.push('delivery 必须是受控单选值')
  if (record.series && !SERIES_KEYS.includes(record.series)) errors.push('series 包含未知系列')
  return errors
}

export function assertCompleteContentTaxonomy(records = []) {
  const failures = records.flatMap((record, index) => {
    const errors = validateTaxonomyRecord(record)
    return errors.length
      ? [{ id: record?.id || record?.href || `record-${index}`, title: record?.title || '', errors }]
      : []
  })
  if (failures.length) {
    const detail = failures
      .slice(0, 12)
      .map((failure) => `${failure.id}: ${failure.errors.join('；')}`)
      .join('\n')
    throw new Error(`内容分类审计失败（${failures.length} 条）\n${detail}`)
  }
  return records
}
