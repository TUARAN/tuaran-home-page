import assert from 'node:assert/strict'
import test from 'node:test'

import { extractFinancialView, parseFinancialAmount } from '../lib/longCompass/finance.js'

function record(title, content) {
  return { kind: 'snapshot', plain: { title, content } }
}

test('financial overview keeps household and personal account sources separate', () => {
  const data = extractFinancialView([
    record('示例家庭账户', `| 时点 | 估算资产 | 说明 |
| --- | --- | --- |
| 2026.1 | 20w | 示例 |

## 资金来源四象限

| 类型 | 估算（万元） | 性质 |
| --- | --- | --- |
| 固定注入 | 10 | 示例 |`),
    record('示例个人流动性', `## 流动性梯队

| 资产 | 金额 | 流动性 |
| --- | --- | --- |
| 活期账户 | 2w | 高 |
| 长期账户 | 8w | 低 |
| 已清空账户 | 0元 | — |`),
    record('示例收入与年终奖', `| 年份 | 年终金额 |
| --- | --- |
| 2025 | 3w |`),
  ])

  assert.equal(data.householdAssets.at(-1).value, 200000)
  assert.equal(data.householdFlows.length, 1)
  assert.deepEqual(data.liquidity.map((item) => item.value), [20000, 80000])
  assert.doesNotMatch(data.liquidity.map((item) => item.label).join(','), /已清空账户/)
  assert.equal(data.bonus.at(-1).value, 30000)
})

test('financial amount parser preserves explicit units and leaves missing placeholders empty', () => {
  assert.equal(parseFinancialAmount('20.3w'), 203000)
  assert.equal(parseFinancialAmount('2', { defaultUnit: '万' }), 20000)
  assert.equal(parseFinancialAmount('待补录'), null)
})
