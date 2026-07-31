import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CONTENT_GROUP_KEYS,
  CONTENT_KIND_KEYS,
  COMPANY_INDUSTRY_KEYS,
  COMPANY_ROLE_KEYS,
  DELIVERY_KEYS,
  ENTITY_TYPE_KEYS,
  SUBJECT_KEYS,
  getContentGroup,
  taxonomyForArticle,
  taxonomyForInteractive,
  taxonomyForResearch,
  taxonomyForResource,
  validateTaxonomyRecord,
} from '../../lib/contentTaxonomy.js'

test('taxonomy uses one hierarchy and orthogonal controlled facets', () => {
  assert.deepEqual(CONTENT_GROUP_KEYS, ['all', 'article', 'analysis', 'practice', 'resource'])
  assert.ok(CONTENT_KIND_KEYS.includes('interactive'))
  assert.ok(SUBJECT_KEYS.includes('ai_dev'))
  assert.ok(ENTITY_TYPE_KEYS.includes('company'))
  assert.ok(COMPANY_INDUSTRY_KEYS.includes('software_development'))
  assert.ok(COMPANY_ROLE_KEYS.includes('ecosystem_platform'))
  assert.ok(DELIVERY_KEYS.includes('subscribe'))
  assert.equal(getContentGroup('profile'), 'analysis')
  assert.equal(getContentGroup('guide'), 'practice')
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
  assert.equal(records[3].delivery, 'subscribe')
  assert.equal(records[4].contentKind, 'interactive')
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
