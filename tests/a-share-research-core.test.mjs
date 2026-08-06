import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDraftPrompt,
  classifyCompany,
  normalizeCompanies,
  parseQuote,
  pickBestCompany,
  randomIndex,
  validateDraft,
  validateSnapshot,
} from '../lib/aShareResearchCore.js'

test('classifyCompany 覆盖三大交易所板块', () => {
  assert.equal(classifyCompany('600000').exchange, 'SSE')
  assert.equal(classifyCompany('688071').board, 'star')
  assert.equal(classifyCompany('000429').board, 'main')
  assert.equal(classifyCompany('300296').board, 'chinext')
  assert.equal(classifyCompany('920001').exchange, 'BSE')
  assert.equal(classifyCompany('123456'), null)
  assert.equal(classifyCompany(''), null)
})

test('normalizeCompanies 去重并按代码排序', () => {
  const rows = [
    { f12: '000001', f14: '平安银行' },
    { f12: '600000', f14: '浦发银行' },
    { f12: '000001', f14: '平安银行' },
    { f12: '999999', f14: '未知市场' },
    { f12: '920001', f14: '-' },
  ]
  const companies = normalizeCompanies(rows)
  assert.equal(companies.length, 2)
  assert.deepEqual(companies.map((company) => company.code), ['000001', '600000'])
  assert.equal(companies[0].exchangeName, '深圳证券交易所')
})

test('validateSnapshot 拒绝数量越界或缺少交易所', () => {
  assert.throws(() => validateSnapshot([]), /安全范围/)
  assert.throws(() => validateSnapshot(Array.from({ length: 9000 }, (_, i) => ({ code: String(600000 + i), exchange: 'SSE' }))), /安全范围/)
  const onlyTwo = [
    ...Array.from({ length: 3000 }, (_, i) => ({ code: String(600000 + i), exchange: 'SSE' })),
    ...Array.from({ length: 3000 }, (_, i) => ({ code: String(300000 + i), exchange: 'SZSE' })),
  ]
  assert.throws(() => validateSnapshot(onlyTwo), /缺少 BSE/)
})

test('pickBestCompany 跳过已用代码并在空池时报错', () => {
  const companies = [
    { code: '000001', name: 'A' },
    { code: '000002', name: 'B' },
    { code: '000003', name: 'C' },
  ]
  assert.equal(pickBestCompany(companies, new Set(['000001', '000002']), () => 0).code, '000003')
  assert.throws(() => pickBestCompany(companies, new Set(companies.map((c) => c.code)), () => 0), /全部完成/)
})

test('randomIndex 落在合法区间', () => {
  for (let index = 0; index < 50; index += 1) {
    const value = randomIndex(7)
    assert.ok(value >= 0 && value < 7)
  }
  assert.equal(randomIndex(0), 0)
})

test('parseQuote 解析腾讯行情字段', () => {
  const fields = Array.from({ length: 50 }, () => '')
  fields[0] = '1'
  fields[1] = '浦发银行'
  fields[2] = '600000'
  fields[3] = '10.50'
  fields[30] = '20260806150000'
  fields[32] = '1.35%'
  fields[38] = '0.82'
  fields[39] = '7.21'
  fields[44] = '3081.23'
  fields[45] = '3081.23'
  fields[46] = '0.71'
  const quote = parseQuote(`v_sh600000="${fields.join('~')}";`)
  assert.equal(quote.code, '600000')
  assert.equal(quote.price, 10.5)
  assert.equal(quote.changePct, 1.35)
  assert.equal(quote.pe, 7.21)
  assert.equal(quote.pb, 0.71)
  assert.equal(quote.totalMarketCap, 3081.23)
  assert.equal(parseQuote('bad payload'), null)
})

test('validateDraft 校验草稿安全边界', () => {
  const good = [
    '---',
    'review_ready: false',
    'ad_eligible: false',
    '---',
    '## 一、先给结论',
    '内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容',
    '内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容',
    '内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容',
    '内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容',
    '内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容',
    '内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容',
    '## 十、信息来源与说明',
    '来源：巨潮资讯、腾讯行情',
  ].join('\n')
  assert.doesNotThrow(() => validateDraft(good))
  assert.throws(() => validateDraft('太短'), /过短/)
  assert.throws(() => validateDraft(good.replace('review_ready: false', 'review_ready: true')), /review_ready/)
  assert.throws(() => validateDraft(good.replace('## 十、信息来源与说明', '## 十、随便写写')), /来源/)
  assert.throws(() => validateDraft(good.replace('## 一、先给结论', '## 一、先给结论 {{COMPANY_NAME}}')), /占位符/)
})

test('buildDraftPrompt 包含公司信息、十个小节与风格约束', () => {
  const messages = buildDraftPrompt({
    company: { name: '浦发银行', code: '600000', exchangeName: '上海证券交易所', boardName: '沪市主板' },
    quote: { price: 10.5, totalMarketCap: 3081.23 },
    style: {
      label: '默认分析风格',
      id: 'default-research',
      principles: ['事实与研判分离'],
      badPhrases: [{ phrase: '不是 X，而是 Y', why: '禁用' }],
      goodPhrases: [{ phrase: '外部能确认的是……', why: '边界' }],
    },
  })
  const system = messages[0]
  const user = messages[1]
  assert.match(system.content, /不要编造/)
  assert.match(user.content, /浦发银行/)
  assert.match(user.content, /600000/)
  assert.match(user.content, /## 九、未能验证/)
  assert.match(user.content, /review_ready: false/)
  assert.match(user.content, /不是 X，而是 Y/)
  assert.match(user.content, /3081.23/)
})
