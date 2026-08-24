import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('管理员模型列表接口先鉴权，再读取现有服务并调用原生 tags', async () => {
  const [route, ollama, core] = await Promise.all([
    read('../app/api/admin/llm-providers/models/route.js'),
    read('../lib/ollama.js'),
    read('../lib/ollamaCore.js'),
  ])

  assert.match(route, /getOwnerOrReject\(req\)/)
  assert.ok(route.indexOf('getOwnerOrReject(req)') < route.indexOf('listOllamaModels(providerId)'))
  assert.match(ollama, /getOllamaProvider\(providerId\)/)
  assert.match(ollama, /buildOllamaAuthHeaders\(auth\)/)
  assert.match(core, /\/api\/tags/)
  assert.match(ollama, /OLLAMA_MODELS_TIMEOUT/)
})

test('模型列表响应只返回规范化字段，不返回凭据或上游摘要', async () => {
  const [route, core] = await Promise.all([
    read('../app/api/admin/llm-providers/models/route.js'),
    read('../lib/ollamaCore.js'),
  ])

  assert.match(route, /models: result\.models/)
  assert.doesNotMatch(route, /clientId|clientSecret|auth_cipher|auth_secondary_cipher/)
  assert.match(core, /name,\s*displayName:/)
  assert.match(core, /size,\s*parameterSize,\s*quantizationLevel/)
})

test('服务卡片通过现有 PATCH 切换默认模型，并保留刷新失败时的当前模型', async () => {
  const panel = await read('../app/(admin)/admin/deepseek-tasks/OllamaProvidersPanel.jsx')

  assert.match(panel, /llm-providers\/models\?id=/)
  assert.match(panel, /method: 'PATCH'/)
  assert.match(panel, /JSON\.stringify\(\{ id: provider\.id, defaultModel: model \}\)/)
  assert.match(panel, /切换默认模型会影响每日问候和服务测试等云调用，是否继续？/)
  assert.match(panel, /当前默认模型仍为 \{provider\.defaultModel\}/)
  assert.match(panel, /刷新模型列表/)
})

test('业务调用与台账继续使用服务端解析后的默认模型', async () => {
  const [ollama, tasks, morningGreeting, testRoute] = await Promise.all([
    read('../lib/ollama.js'),
    read('../lib/deepseekTasks.js'),
    read('../app/api/admin/morning-greeting/route.js'),
    read('../app/api/admin/llm-providers/test/route.js'),
  ])

  assert.match(ollama, /model \|\| row\.default_model/)
  assert.match(ollama, /model: resolvedModel/)
  assert.match(tasks, /text\(model, 160\)/)
  assert.match(morningGreeting, /model: row\.default_model/)
  assert.match(testRoute, /model: result\.model/)
})
