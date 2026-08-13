import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  CONTENT_GROUP_KEYS,
  CONTENT_GROUP_META,
  CONTENT_KIND_KEYS,
  COMPANY_INDUSTRY_KEYS,
  COMPANY_ROLE_KEYS,
  DELIVERY_KEYS,
  ENTITY_TYPE_KEYS,
  SUBJECT_KEYS,
  assertCompleteContentTaxonomy,
  getDisplaySubject,
  getContentGroup,
  isEntityTypeRedundant,
  taxonomyForArticle,
  taxonomyForInteractive,
  taxonomyForResearch,
  taxonomyForResource,
  validateTaxonomyRecord,
} from '../../lib/contentTaxonomy.js'
import {
  SUBJECT_GOVERNANCE_LIST,
  TAXONOMY_DIMENSIONS,
  TAXONOMY_GOVERNANCE_RULES,
} from '../../lib/contentTaxonomyGovernance.js'
import { ENGINEERING_WORKS } from '../../lib/engineeringWorks.js'
import { HOME_RESOURCE_ITEMS } from '../../lib/homeResourceItems.js'
import { RESEARCH_ENTRY_META } from '../../lib/research/catalog.js'

test('taxonomy uses one hierarchy and orthogonal controlled facets', () => {
  assert.deepEqual(CONTENT_GROUP_KEYS, ['all', 'article', 'analysis', 'practice', 'interactive', 'resource'])
  assert.deepEqual(
    CONTENT_GROUP_KEYS.filter((key) => key !== 'all').map((key) => CONTENT_GROUP_META[key].label),
    ['精选', '分析', '实践', '互动', '资源'],
  )
  assert.equal(CONTENT_GROUP_META.article.label, '精选')
  assert.ok(CONTENT_KIND_KEYS.includes('interactive'))
  assert.ok(SUBJECT_KEYS.includes('ai_dev'))
  assert.ok(SUBJECT_KEYS.includes('product_experience'))
  assert.ok(SUBJECT_KEYS.includes('business_market'))
  assert.ok(SUBJECT_KEYS.includes('company_research'))
  assert.ok(SUBJECT_KEYS.includes('people_profiles'))
  assert.ok(!SUBJECT_KEYS.includes('product_business'))
  assert.ok(ENTITY_TYPE_KEYS.includes('company'))
  assert.ok(COMPANY_INDUSTRY_KEYS.includes('software_development'))
  assert.ok(COMPANY_ROLE_KEYS.includes('ecosystem_platform'))
  assert.ok(DELIVERY_KEYS.includes('subscribe'))
  assert.equal(getContentGroup('profile'), 'analysis')
  assert.equal(getContentGroup('guide'), 'practice')
  assert.equal(getContentGroup('interactive'), 'interactive')
})

test('people research has a dedicated reader-facing subject', () => {
  assert.deepEqual(
    taxonomyForResearch({ category: 'people' }).subjects,
    ['people_profiles'],
  )
  assert.equal(
    validateTaxonomyRecord(taxonomyForResearch({ category: 'people' })).length,
    0,
  )
})

test('A股系列使用商业市场主题，不占用公司调研主题', () => {
  const taxonomy = taxonomyForResearch({
    category: 'companies',
    slug: 'a-share-603679',
    contentType: 'analysis',
  })
  assert.deepEqual(taxonomy.subjects, ['business_market'])
  assert.equal(taxonomy.series, 'a_share_research')
})

test('legacy content sources map to complete reader-facing taxonomy records', () => {
  const records = [
    taxonomyForArticle({ category: '工程化', slug: 'hello-world' }),
    taxonomyForResearch({
      category: 'companies',
      contentType: 'profile',
      topicType: 'market',
      companyType: 'developer_ecosystem',
    }),
    taxonomyForResearch({
      category: 'topics',
      contentType: 'engineering_case',
      topicType: 'tech',
      techType: 'agents_automation',
    }),
    taxonomyForResource({ resourceType: 'rss' }),
    taxonomyForInteractive({ category: 'ai-engineering', title: 'Agent 工程地图' }),
  ]

  for (const record of records) {
    assert.deepEqual(validateTaxonomyRecord(record), [])
  }
  assert.equal(records[1].entityType, 'company')
  assert.equal(records[1].companyIndustry, 'software_development')
  assert.equal(records[1].companyRole, 'ecosystem_platform')
  assert.deepEqual(records[1].subjects, ['company_research'])
  assert.equal(records[3].delivery, 'subscribe')
  assert.equal(records[4].contentKind, 'interactive')
})

test('every research, interactive, and resource entry resolves to exactly one theme and one type', () => {
  const records = [
    ...Object.values(RESEARCH_ENTRY_META).map((entry) => ({ ...entry, ...taxonomyForResearch(entry) })),
    ...ENGINEERING_WORKS.map((entry) => ({ ...entry, ...taxonomyForInteractive(entry) })),
    ...HOME_RESOURCE_ITEMS.map((entry) => ({ ...entry, ...taxonomyForResource(entry) })),
  ]

  assert.ok(records.length > 0)
  assert.equal(assertCompleteContentTaxonomy(records), records)
  for (const record of records) {
    assert.equal(record.subjects.length, 1, record.title)
    assert.ok(record.contentKind, record.title)
  }
})

test('product and business subjects have separate inference rules', () => {
  assert.deepEqual(
    taxonomyForResearch({ category: 'topics', topicType: 'product' }).subjects,
    ['product_experience'],
  )
  assert.deepEqual(
    taxonomyForResearch({ category: 'topics', topicType: 'market' }).subjects,
    ['business_market'],
  )
  assert.deepEqual(
    taxonomyForInteractive({ title: '产品体验与用户需求地图' }).subjects,
    ['product_experience'],
  )
  assert.deepEqual(
    taxonomyForInteractive({ title: '公司市场增长地图' }).subjects,
    ['business_market'],
  )
})

test('explicit subjects override legacy inference and normalize to one theme', () => {
  assert.deepEqual(
    taxonomyForInteractive({
      category: 'data-visualization',
      title: 'X 值不值得做？创作者经营情报',
      subjects: ['content_creation', 'business_market'],
    }).subjects,
    ['content_creation'],
  )
  assert.deepEqual(
    taxonomyForResearch({
      category: 'topics',
      topicType: 'thesis',
      subjects: ['ai_dev', 'business_market'],
    }).subjects,
    ['ai_dev'],
  )
  assert.deepEqual(
    taxonomyForResource({
      resourceType: 'humanities-politics',
      subjects: ['ai_dev', 'business_market'],
    }).subjects,
    ['ai_dev'],
  )
})

test('directory labels reflect the selected subject and suppress redundant entity labels', () => {
  assert.equal(
    getDisplaySubject(['web_cloud', 'content_creation'], 'content_creation'),
    'content_creation',
  )
  assert.equal(
    getDisplaySubject(['business_market', 'content_creation'], 'all'),
    'business_market',
  )
  assert.equal(isEntityTypeRedundant('company', ['company_research']), true)
  assert.equal(isEntityTypeRedundant('product', ['product_experience', 'business_market']), true)
  assert.equal(isEntityTypeRedundant('person', ['people_profiles']), true)
  assert.equal(isEntityTypeRedundant('technology', ['ai_dev']), true)
  assert.equal(isEntityTypeRedundant('technology', ['web_cloud']), true)
  assert.equal(isEntityTypeRedundant('industry', ['business_market']), false)
})

test('taxonomy validation rejects overloaded or incomplete records', () => {
  assert.deepEqual(
    validateTaxonomyRecord({
      contentKind: '国外资源',
      subjects: [],
      entityType: '公司分类',
      delivery: '内容资源',
    }),
    [
      'contentKind 必须是受控单选值',
      'subjects 必须且只能包含 1 个主题',
      'entityType 包含未知对象类型',
      'delivery 必须是受控单选值',
    ],
  )
  assert.throws(
    () => assertCompleteContentTaxonomy([{
      id: 'bad-record',
      contentKind: 'article',
      subjects: ['ai_dev', 'web_cloud'],
      delivery: 'read',
    }]),
    /内容分类审计失败.*bad-record/s,
  )
})

test('every reader-facing subject has a governed definition and stable id', () => {
  assert.deepEqual(
    SUBJECT_GOVERNANCE_LIST.map((subject) => subject.id),
    SUBJECT_KEYS,
  )
  for (const subject of SUBJECT_GOVERNANCE_LIST) {
    assert.equal(subject.status, 'active')
    assert.ok(subject.definition.length > 10)
    assert.ok(subject.includes.length >= 2)
    assert.ok(subject.excludes.length >= 2)
    assert.ok(subject.aliases.length >= 1)
  }
  assert.deepEqual(
    TAXONOMY_DIMENSIONS.map((dimension) => dimension.id),
    ['contentKind', 'subjects', 'entityType', 'delivery', 'series'],
  )
  assert.ok(TAXONOMY_GOVERNANCE_RULES.length >= 5)
})

test('taxonomy manager is registered in the content center', async () => {
  const [contentCenter, adminRoutes, adminPage] = await Promise.all([
    readFile(new URL('../../app/(admin)/admin/content/ContentCenter.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../lib/adminRoutes.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(admin)/admin/content-taxonomy/ContentTaxonomyClient.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(contentCenter, /\/admin\/content-taxonomy/)
  assert.match(adminRoutes, /\/admin\/content-taxonomy/)
  assert.match(adminPage, /存量内容审计/)
  assert.match(adminPage, /系统推断/)
})
