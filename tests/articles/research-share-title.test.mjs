import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildResearchShareTitle,
  isAShareCompanyObservation,
} from '../../lib/research/shareTitle.js'

test('A股公司观察的短标题补成统一标题', () => {
  const entry = {
    category: 'companies',
    companyType: 'a_share',
    title: '北汽蓝谷（600733）公司观察',
  }

  assert.equal(isAShareCompanyObservation(entry), true)
  assert.equal(
    buildResearchShareTitle(entry),
    '阿燃调研：每天一家A股上市公司 —— 北汽蓝谷（600733）公司观察',
  )
})

test('A股公司观察的统一标题不会重复添加前缀', () => {
  const entry = {
    category: 'companies',
    companyType: 'a_share',
    title: '阿燃调研：每天一家A股上市公司 —— 粤高速A（000429）公司观察',
  }

  assert.equal(
    buildResearchShareTitle(entry),
    '阿燃调研：每天一家A股上市公司 —— 粤高速A（000429）公司观察',
  )
})

test('A股公司观察的过渡标题会迁移到统一标题', () => {
  const entry = {
    category: 'companies',
    companyType: 'a_share',
    title: '东尼调研：每天一家A股上市公司 —— 粤高速A（000429）公司观察',
  }

  assert.equal(
    buildResearchShareTitle(entry),
    '阿燃调研：每天一家A股上市公司 —— 粤高速A（000429）公司观察',
  )
})

test('A股公司观察的旧分享前缀会迁移到统一标题', () => {
  const entry = {
    category: 'companies',
    companyType: 'a_share',
    title: '深度调研：每天一家A股上市公司 —— 利亚德（300296）公司观察',
  }

  assert.equal(
    buildResearchShareTitle(entry),
    '阿燃调研：每天一家A股上市公司 —— 利亚德（300296）公司观察',
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
