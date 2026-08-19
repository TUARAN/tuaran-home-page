import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { localLlmTaskId, normalizeLocalLlmSyncPayload } from '../lib/localLlmSync.js'

test('Mac 本地调用同步记录规范化 Token、耗时与摘要', () => {
  const result = normalizeLocalLlmSyncPayload({
    deviceId: 'mac-1',
    deviceName: 'MacBook-Pro',
    localCallId: 7,
    status: 'succeeded',
    model: 'qwen3.5:9b',
    inputSummary: `  ${'问'.repeat(1300)}  `,
    resultSummary: '回答',
    promptTokens: 18,
    completionTokens: 4,
    durationMs: 5286.6,
    startedAt: 1000,
    finishedAt: 2000,
  }, 3000)

  assert.equal(result.ok, true)
  assert.equal(result.record.deviceName, 'MacBook-Pro')
  assert.equal(result.record.inputSummary.length, 1200)
  assert.equal(result.record.totalTokens, 22)
  assert.equal(result.record.durationMs, 5286.6)
})

test('Mac 本地调用同步拒绝缺少身份或非法状态的记录', () => {
  assert.deepEqual(
    normalizeLocalLlmSyncPayload({ deviceId: '', localCallId: 1, status: 'running', model: '' }),
    { ok: false, error: 'INVALID_LOCAL_LLM_RECORD' },
  )
})

test('相同设备与本地记录生成稳定幂等任务 ID', async () => {
  const first = await localLlmTaskId('mac-1', '7')
  const second = await localLlmTaskId('mac-1', '7')
  const other = await localLlmTaskId('mac-1', '8')
  assert.equal(first, second)
  assert.notEqual(first, other)
  assert.match(first, /^local-[a-f0-9]{32}$/)
})

test('模型调用管理展示云调用、本地调用与 Mac 专用入口', async () => {
  const client = await readFile(
    new URL('../app/(admin)/admin/deepseek-tasks/DeepSeekTasksClient.jsx', import.meta.url),
    'utf8',
  )
  const ollamaPanel = await readFile(
    new URL('../app/(admin)/admin/deepseek-tasks/OllamaProvidersPanel.jsx', import.meta.url),
    'utf8',
  )
  const route = await readFile(
    new URL('../app/api/admin/deepseek-tasks/route.js', import.meta.url),
    'utf8',
  )
  const migration = await readFile(
    new URL('../migrations/0073_deepseek_task_execution_scope.sql', import.meta.url),
    'utf8',
  )

  assert.match(client, /Mac 发起的 NAS Qwen/)
  assert.match(client, /云调用/)
  assert.match(client, /本地调用/)
  assert.match(client, /DeepSeek 密钥/)
  assert.match(client, /NAS · Ollama/)
  assert.match(ollamaPanel, /NAS · Ollama 使用场景/)
  assert.match(ollamaPanel, /X AI 资讯草稿/)
  assert.match(ollamaPanel, /Mac 本地聊天/)
  assert.match(ollamaPanel, /item\.scope === 'local'/)
  assert.match(route, /params\.get\('scope'\)/)
  assert.match(route, /execution_scope = \?/)
  assert.match(migration, /DEFAULT 'cloud'/)
})
