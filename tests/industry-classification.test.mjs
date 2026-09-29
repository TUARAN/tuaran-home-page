import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CHINA_SECTORS,
  CLASSIFICATION_SYSTEMS,
  findChinaSectors,
  getPrimaryActivity,
} from '../app/(site)/industry-classification/data.js'

test('中国门类包含 A 到 T 共 20 个不重复代码', () => {
  assert.equal(CHINA_SECTORS.length, 20)
  assert.equal(new Set(CHINA_SECTORS.map((sector) => sector.code)).size, 20)
  assert.deepEqual(CHINA_SECTORS.map((sector) => sector.code), 'ABCDEFGHIJKLMNOPQRST'.split(''))
})

test('中国标准层级数量与现行口径一致', () => {
  const china = CLASSIFICATION_SYSTEMS.find((system) => system.id === 'china')
  assert.deepEqual(china.levels.map((level) => level.count), [20, 97, 473, 1382])
})

test('门类搜索同时匹配名称、示例和关键词', () => {
  assert.deepEqual(findChinaSectors('云计算').map((sector) => sector.code), ['I'])
  assert.deepEqual(findChinaSectors('咖啡馆').map((sector) => sector.code), ['H'])
  assert.equal(findChinaSectors('', '第二产业').length, 4)
})

test('主要活动按输入数值降序并计算份额', () => {
  const result = getPrimaryActivity([
    { name: '软件开发', value: 620 },
    { name: '硬件销售', value: 260 },
    { name: '技术咨询', value: 120 },
  ])
  assert.equal(result.primary.name, '软件开发')
  assert.equal(result.total, 1000)
  assert.equal(result.ranked[0].share, 0.62)
})
