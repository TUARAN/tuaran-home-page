import test from 'node:test'
import assert from 'node:assert/strict'

import {
  draftToArticleContent,
  hasSourceSection,
  publishFileName,
  publishSlug,
  stripPreamble,
  validatePublishContent,
} from '../lib/aSharePublishCore.js'

const DRAFT = [
  '---',
  'title: "阿燃调研：每天一家A股上市公司 —— 四川黄金（001337）公司观察"',
  'category: companies',
  'company_type: a_share',
  'stock_code: "001337"',
  'exchange: SZSE',
  'board: main',
  'date: "2026-08-06"',
  'time: "11:30"',
  'tags: [A股, "四川黄金", "黄金"]',
  'summary: 一句话概述。',
  'tldr: 一句话总结。',
  'content_type: analysis',
  'assistance: codex',
  'model: deepseek-v4-flash',
  'research_template: a-share-company-research',
  'research_template_version: 2',
  'sources_as_of: "2026-08-06"',
  'show_assistance: false',
  'review_ready: false',
  'ad_eligible: false',
  'pv: 0',
  '---',
  '',
  '## 一、先给结论',
  '四川黄金以黄金采选为主业。',
  '',
  '## 十、信息来源与说明',
  '来源：巨潮资讯、腾讯行情、东方财富（https://data.eastmoney.com/notices/detail/001337/AN202504101654197851.html）。',
].join('\n')

test('hasSourceSection 识别来源节', () => {
  assert.equal(hasSourceSection(DRAFT), true)
  assert.equal(hasSourceSection('## 一、先给结论\n内容'), false)
})

test('draftToArticleContent 保持 review_ready: false 且保留其余内容', () => {
  const article = draftToArticleContent(DRAFT)
  assert.match(article, /^review_ready:\s*false\s*$/mu)
  assert.match(article, /^ad_eligible:\s*false\s*$/mu)
  assert.match(article, /四川黄金/)
  assert.throws(() => draftToArticleContent(article.replace(/^review_ready:\s*false\s*$/mu, 'review_ready: true')), /review_ready: false/)
})

test('stripPreamble 清除模型检索前的前置杂文', () => {
  const dirty = `我先检索一下。\n我已获得关键信息，开始撰写。\n\n${DRAFT}`
  const clean = stripPreamble(dirty)
  assert.match(clean, /^---\r?\n/)
  assert.equal(stripPreamble(DRAFT), DRAFT)
  const article = draftToArticleContent(dirty)
  assert.match(article, /^review_ready:\s*false\s*$/mu)
  assert.equal(validatePublishContent(article, { code: '001337', name: '四川黄金' }), true)
})

test('publishFileName / publishSlug 生成发布文件名与文章 slug', () => {
  const fileName = publishFileName({ draft_date: '2026-08-06', code: '001337' })
  assert.equal(fileName, '2026-08-06-a-share-001337.md')
  assert.equal(publishSlug(fileName), 'a-share-001337')
  assert.throws(() => publishFileName({ draft_date: '2026/08/06', code: '001337' }), /draft_date/)
  assert.throws(() => publishFileName({ draft_date: '2026-08-06', code: 'abc' }), /证券代码/)
})

test('validatePublishContent 通过已复核发布稿并拦截缺项', () => {
  const article = draftToArticleContent(DRAFT)
  assert.equal(validatePublishContent(article, { code: '001337', name: '四川黄金' }), true)
  assert.throws(() => validatePublishContent(article.replace(/^review_ready:\s*false\s*$/mu, 'review_ready: true'), { code: '001337', name: '四川黄金' }), /review_ready/)
  assert.throws(() => validatePublishContent(article.replace(/^ad_eligible:\s*false\s*$/mu, 'ad_eligible: true'), { code: '001337', name: '四川黄金' }), /ad_eligible/)
  assert.throws(() => validatePublishContent(article.replace('## 十、信息来源与说明', '## 十、随便写写'), { code: '001337', name: '四川黄金' }), /来源/)
  assert.throws(() => validatePublishContent(article.replaceAll('四川黄金', '另一家公司'), { code: '001337', name: '四川黄金' }), /公司名/)
  assert.throws(() => validatePublishContent(article, { code: '000001', name: '四川黄金' }), /stock_code/)
  const unclosedFrontmatter = article.replace('\n---\n\n## 一、先给结论', '\n\n## 一、先给结论')
  assert.throws(() => validatePublishContent(unclosedFrontmatter, { code: '001337', name: '四川黄金' }), /frontmatter 未闭合/)
  assert.throws(() => validatePublishContent('太短', { code: '001337', name: '四川黄金' }), /过短/)
})
