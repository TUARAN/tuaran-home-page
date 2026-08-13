import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTOMATION_REGISTRY,
  automationScheduleStatus,
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
