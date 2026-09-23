import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTOMATION_REGISTRY,
  automationItemMatches,
  automationScheduleStatus,
  countAutomationFacet,
  filterAutomationRegistry,
  registryEntryText,
} from '../../lib/adminOpsRegistry.js'

test('自动执行任务显示为已启用，不会因缺少实时回写显示为未运行', () => {
  const scheduled = AUTOMATION_REGISTRY.filter((item) => item.autoRun)

  assert.ok(scheduled.length > 0)
  for (const item of scheduled) {
    assert.equal(automationScheduleStatus(item), 'active', item.id)
  }
})

test('手动任务显示为按需运行', () => {
  const manual = AUTOMATION_REGISTRY.filter((item) => !item.autoRun)

  assert.ok(manual.length > 0)
  for (const item of manual) {
    assert.equal(automationScheduleStatus(item), 'on_demand', item.id)
  }
})

test('明确的动态状态优先于注册表推导状态', () => {
  assert.equal(automationScheduleStatus({ autoRun: true, status: 'paused' }), 'paused')
  assert.equal(automationScheduleStatus({ autoRun: true, status: 'running' }), 'running')
})

test('复制任务字段包含推导后的调度状态', () => {
  const item = AUTOMATION_REGISTRY.find((entry) => entry.id === 'autopilot-security-scan')
  const copied = JSON.parse(registryEntryText(item))

  assert.equal(copied.status, 'active')
})

test('Pages 部署失败告警登记为已启用的云端自动任务', () => {
  const item = AUTOMATION_REGISTRY.find((entry) => entry.id === 'pages-deploy-alert')
  assert.ok(item)
  assert.equal(item.autoRun, true)
  assert.equal(automationScheduleStatus(item), 'active')
  assert.match(item.entry, /pages-deploy-alert\.yml/)
})

test('台账筛选可以按环境、调度、风险和审核组合', () => {
  const filters = { scope: 'cloud', schedule: 'active', risk: 'high', review: 'required' }
  const matched = filterAutomationRegistry(AUTOMATION_REGISTRY, filters)

  assert.ok(matched.length > 0)
  for (const item of matched) {
    assert.equal(item.scope, 'cloud')
    assert.equal(automationScheduleStatus(item), 'active')
    assert.equal(item.riskLevel, 'high')
    assert.equal(item.reviewRequired, true)
  }
  assert.equal(
    countAutomationFacet(AUTOMATION_REGISTRY, filters, 'risk', (item) => item.riskLevel === 'low'),
    filterAutomationRegistry(AUTOMATION_REGISTRY, { ...filters, risk: 'low' }).length,
  )
  assert.equal(automationItemMatches(matched[0], { review: 'open' }), false)
  assert.equal(automationItemMatches({ autoRun: false, status: 'paused', reviewRequired: false }, { schedule: 'paused' }), true)
})

test('更新日志自动归纳不再显示待首次运行', () => {
  const item = AUTOMATION_REGISTRY.find((entry) => entry.id === 'changelog-deepseek-update')
  assert.ok(item)
  assert.equal(item.autoRun, true)
  assert.doesNotMatch(item.lastRun, /待首次运行/)
  assert.match(item.entry, /changelog-update\.yml/)
})
