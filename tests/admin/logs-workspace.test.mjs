import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const logsClient = await readFile(
  new URL('../../app/(admin)/admin/logs/LogsClient.jsx', import.meta.url),
  'utf8',
)
const opsConsole = await readFile(
  new URL('../../app/(admin)/admin/ops/OpsConsole.jsx', import.meta.url),
  'utf8',
)
const modelClient = await readFile(
  new URL('../../app/(admin)/admin/deepseek-tasks/DeepSeekTasksClient.jsx', import.meta.url),
  'utf8',
)

test('日志记录整合自动化最近运行和模型调用记录', () => {
  assert.match(logsClient, /id: 'runs', label: '最近运行'/)
  assert.match(logsClient, /id: 'calls', label: '调用记录'/)
  assert.match(logsClient, /<AutomationRunsPanel/)
  assert.match(logsClient, /<ModelCallRecordsPanel/)
})

test('自动化台账和模型服务不再内嵌执行记录', () => {
  assert.match(opsConsole, /自动化列表/)
  assert.doesNotMatch(opsConsole, /<h2[^>]*>最近运行/)
  assert.match(opsConsole, /href="\/admin\/logs"/)
  assert.match(modelClient, /DeepSeek 密钥/)
  assert.match(modelClient, /NAS · Ollama/)
  assert.doesNotMatch(modelClient, /id: 'records'/)
  assert.match(modelClient, /href="\/admin\/logs\?tab=calls"/)
})
