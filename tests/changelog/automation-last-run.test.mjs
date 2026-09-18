import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatAutomationLastRun,
  lastRunSettingKey,
  pickLatestAlertByWorkflow,
  resolveRegistryLastRun,
  workflowIdFromAlertKey,
  workflowIdFromEntry,
} from '../../lib/automationLastRun.js'

test('workflow ids are parsed from Actions URLs and alert keys', () => {
  assert.equal(
    workflowIdFromEntry('https://github.com/TUARAN/tuaran-home-page/actions/workflows/changelog-update.yml'),
    'changelog-update',
  )
  assert.equal(workflowIdFromAlertKey('system:automation:changelog-update:35045758542'), 'changelog-update')
  assert.equal(lastRunSettingKey('changelog-update'), 'automation:last-run:changelog-update')
})

test('latest automation alerts are kept per workflow', () => {
  const latest = pickLatestAlertByWorkflow([
    {
      article_key: 'system:automation:changelog-update:2',
      message_excerpt: 'DeepSeek 更新日志 运行失败\n空响应',
      created_at: Date.parse('2026-09-16T01:52:11Z'),
    },
    {
      article_key: 'system:automation:changelog-update:1',
      message_excerpt: 'DeepSeek 更新日志 运行失败\n旧错误',
      created_at: Date.parse('2026-09-12T01:48:41Z'),
    },
  ])
  assert.equal(latest['changelog-update'].article_key, 'system:automation:changelog-update:2')
})

test('registry lastRun prefers stored success over older failure alerts', () => {
  const item = {
    entry: 'https://github.com/TUARAN/tuaran-home-page/actions/workflows/changelog-update.yml',
    lastRun: '待首次运行',
  }
  const fromAlert = resolveRegistryLastRun(item, {
    alertsByWorkflow: {
      'changelog-update': {
        message_excerpt: 'DeepSeek 更新日志 运行失败\nDeepSeek 空响应',
        created_at: Date.parse('2026-09-16T01:52:11Z'),
      },
    },
  })
  assert.match(fromAlert, /失败/)
  assert.doesNotMatch(fromAlert, /待首次运行/)

  const fromSetting = resolveRegistryLastRun(item, {
    lastRuns: {
      'changelog-update': { ok: true, at: Date.parse('2026-09-19T01:37:00Z') },
    },
    alertsByWorkflow: {
      'changelog-update': {
        message_excerpt: 'DeepSeek 更新日志 运行失败',
        created_at: Date.parse('2026-09-16T01:52:11Z'),
      },
    },
  })
  assert.match(fromSetting, /成功/)
  assert.equal(formatAutomationLastRun({ ok: true, at: Date.parse('2026-09-16T01:52:11Z') }), '2026/09/16 09:52 成功')
})
