import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyCompany,
  normalizeCompanies,
  renderListArticle,
  selectNextCompany,
  validateSnapshotChange,
} from './manage-a-share-research.mjs'

test('classifies the supported A-share boards', () => {
  assert.equal(classifyCompany('600000').boardName, '沪市主板')
  assert.equal(classifyCompany('688001').boardName, '科创板')
  assert.equal(classifyCompany('000001').boardName, '深市主板')
  assert.equal(classifyCompany('300001').boardName, '创业板')
  assert.equal(classifyCompany('302001').boardName, '创业板')
  assert.equal(classifyCompany('920001').boardName, '北交所')
  assert.equal(classifyCompany('830001'), null)
  assert.equal(classifyCompany('900901'), null)
})

test('normalizes, filters, deduplicates and sorts market rows', () => {
  const companies = normalizeCompanies([
    { f12: '300001', f14: '特锐德' },
    { f12: '600000', f14: '浦发银行' },
    { f12: '300001', f14: '特锐德' },
    { f12: '900901', f14: '云赛 B 股' },
    { f12: 'bad', f14: '错误数据' },
  ])
  assert.deepEqual(companies.map(({ code }) => code), ['300001', '600000'])
})

test('reuses pending work before drawing a new company', () => {
  const companies = normalizeCompanies([
    { code: '600000', name: '浦发银行' },
    { code: '600001', name: '邯郸钢铁' },
  ])
  const state = {
    selections: [{ code: '600001', status: 'selected', outputPath: 'pending.md' }],
  }
  const result = selectNextCompany(companies, state, new Set(), () => 0)
  assert.equal(result.company.code, '600001')
  assert.equal(result.resumed, true)
})

test('excludes researched and completed companies from a new draw', () => {
  const companies = normalizeCompanies([
    { code: '600000', name: '浦发银行' },
    { code: '600001', name: '邯郸钢铁' },
    { code: '600002', name: '齐鲁石化' },
  ])
  const state = { selections: [{ code: '600001', status: 'completed' }] }
  const result = selectNextCompany(companies, state, new Set(['600000']), () => 0)
  assert.equal(result.company.code, '600002')
})

test('renders every company into the public list article', () => {
  const companies = normalizeCompanies([
    { code: '600000', name: '浦发银行' },
    { code: '000001', name: '平安银行' },
    { code: '920001', name: '北交样本' },
  ])
  const article = renderListArticle({
    generatedAt: '2026-07-31T00:00:00.000Z',
    snapshotDate: '2026-07-31',
    snapshotTime: '08:00',
    count: companies.length,
    companies,
  })
  assert.match(article, /共 3 家/)
  assert.match(article, /\| 600000 \| 浦发银行 \|/)
  assert.match(article, /\| 000001 \| 平安银行 \|/)
  assert.match(article, /\| 920001 \| 北交样本 \|/)
})

test('rejects an implausibly large daily snapshot change', () => {
  const previous = {
    companies: Array.from({ length: 100 }, (_, index) => ({
      code: String(600000 + index),
      exchange: 'SSE',
    })),
  }
  const current = previous.companies.slice(0, 90)
  assert.throws(() => validateSnapshotChange(current, previous), /超过 2% 安全阈值/)
})
