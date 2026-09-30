import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const logsPage = await readFile(
  new URL('../../app/(admin)/admin/logs/page.jsx', import.meta.url),
  'utf8',
)
const verifierSource = await readFile(
  new URL('../../scripts/verify-admin-pages-build.cjs', import.meta.url),
  'utf8',
)
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
const opsPage = await readFile(
  new URL('../../app/(admin)/admin/ops/page.jsx', import.meta.url),
  'utf8',
)
const taskCenterClient = await readFile(
  new URL('../../app/(admin)/admin/ops/TaskCenterClient.jsx', import.meta.url),
  'utf8',
)
const settingsPage = await readFile(
  new URL('../../app/(admin)/admin/settings/page.jsx', import.meta.url),
  'utf8',
)

test('日志记录页按查询参数动态渲染，并声明 Edge Runtime', () => {
  assert.match(logsPage, /export const runtime = 'edge'/)
  assert.match(logsPage, /await searchParams/)
  assert.match(verifierSource, /ALLOWED_DYNAMIC_ADMIN_PAGES[\s\S]*['"]\/admin\/logs['"]/)
  assert.match(verifierSource, /REQUIRED_EDGE_ROUTES[\s\S]*['"]\/admin\/logs['"]/)
})

test('任务中心整合任务台账、最近运行和模型调用记录', () => {
  assert.match(logsClient, /id: 'runs', label: '最近运行'/)
  assert.match(logsClient, /id: 'calls', label: '调用记录'/)
  assert.match(logsClient, /<AutomationRunsPanel/)
  assert.match(logsClient, /<ModelCallRecordsPanel/)
  assert.match(opsPage, /<TaskCenterClient \/>/)
  assert.match(opsPage, /<Suspense/)
  assert.doesNotMatch(opsPage, /export const runtime = 'edge'/)
  assert.match(taskCenterClient, /id: 'tasks', label: '任务台账'/)
  assert.match(taskCenterClient, /id: 'runs', label: '最近运行'/)
  assert.match(taskCenterClient, /id: 'calls', label: '模型调用'/)
  assert.match(taskCenterClient, /<OpsConsoleClient embedded \/>/)
  assert.match(taskCenterClient, /key="runs" initialTab="runs" embedded/)
  assert.match(taskCenterClient, /key=\{`calls:\$\{searchParams\.toString\(\)\}`\}/)
})

test('模型服务归入配置中心，调用记录回到任务中心', () => {
  assert.match(opsConsole, /自动化列表/)
  assert.doesNotMatch(opsConsole, /<h2[^>]*>最近运行/)
  assert.match(opsConsole, /href="\/admin\/ops\?tab=runs"/)
  assert.match(modelClient, /DeepSeek 密钥/)
  assert.match(modelClient, /NAS · Ollama/)
  assert.doesNotMatch(modelClient, /id: 'records'/)
  assert.match(modelClient, /href="\/admin\/ops\?tab=calls"/)
  assert.match(settingsPage, /id: 'models', label: '模型服务'/)
  assert.match(settingsPage, /<DeepSeekTasksClient embedded \/>/)
})
