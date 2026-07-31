import assert from 'node:assert/strict'
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
  getDisplaySubject,
  getContentGroup,
  isEntityTypeRedundant,
  taxonomyForArticle,
  taxonomyForInteractive,
  taxonomyForResearch,
  taxonomyForResource,
  validateTaxonomyRecord,
} from '../../lib/contentTaxonomy.js'

test('taxonomy uses one hierarchy and orthogonal controlled facets', () => {
  assert.deepEqual(CONTENT_GROUP_KEYS, ['all', 'article', 'analysis', 'practice', 'resource'])
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

test('explicit subjects override legacy inference and preserve primary-subject order', () => {
  assert.deepEqual(
    taxonomyForInteractive({
      category: 'data-visualization',
      title: 'X 值不值得做？创作者经营情报',
      subjects: ['content_creation', 'business_market'],
    }).subjects,
    ['content_creation', 'business_market'],
  )
  assert.deepEqual(
    taxonomyForResearch({
      category: 'topics',
      topicType: 'thesis',
      subjects: ['ai_dev', 'business_market'],
    }).subjects,
    ['ai_dev', 'business_market'],
  )
  assert.deepEqual(
    taxonomyForResource({
      resourceType: 'humanities-politics',
      subjects: ['ai_dev', 'business_market'],
    }).subjects,
    ['ai_dev', 'business_market'],
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
      'subjects 必须包含 1–3 个主题',
      'entityType 包含未知对象类型',
      'delivery 必须是受控单选值',
    ],
  )
})
