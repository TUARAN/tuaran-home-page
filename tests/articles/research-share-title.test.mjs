import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildResearchShareTitle,
  isAShareCompanyObservation,
} from '../../lib/research/shareTitle.js'

test('A股公司观察使用统一分享标题', () => {
  const entry = {
    category: 'companies',
    companyType: 'a_share',
    title: '北汽蓝谷（600733）公司观察',
  }

  assert.equal(isAShareCompanyObservation(entry), true)
  assert.equal(
    buildResearchShareTitle(entry),
    '深度调研：每天一家A股上市公司 —— 北汽蓝谷（600733）公司观察',
  )
})

test('普通公司调研保留原分享标题', () => {
  const entry = {
    category: 'companies',
    companyType: 'private',
    title: '示例公司观察',
  }

  assert.equal(isAShareCompanyObservation(entry), false)
  assert.equal(buildResearchShareTitle(entry), '示例公司观察')
})

test('A股公司名单不套用公司观察分享格式', () => {
  const entry = {
    category: 'companies',
    companyType: 'a_share_pool',
    title: 'A股上市公司名单',
  }

  assert.equal(isAShareCompanyObservation(entry), false)
  assert.equal(buildResearchShareTitle(entry), 'A股上市公司名单')
})
