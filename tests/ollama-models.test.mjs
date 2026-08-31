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

test('业务调用既支持默认模型，也支持任务显式选择已安装模型', async () => {
  const [ollama, tasks, automationModels, testRoute] = await Promise.all([
    read('../lib/ollama.js'),
    read('../lib/deepseekTasks.js'),
    read('../app/api/admin/morning-greeting/model-selection/route.js'),
    read('../app/api/admin/llm-providers/test/route.js'),
  ])

  assert.match(ollama, /model \|\| row\.default_model/)
  assert.match(ollama, /model: resolvedModel/)
  assert.match(tasks, /text\(model, 160\)/)
  assert.match(automationModels, /listOllamaModels\(row\.id\)/)
  assert.match(automationModels, /buildModelSelectionOptions/)
  assert.match(automationModels, /JSON\.stringify\(\[modelId\]\)/)
  assert.match(testRoute, /model: result\.model/)
})

test('Ollama 直接测试区可选择已发现模型、输入提示词并展示真实响应', async () => {
  const [panel, chatRoute] = await Promise.all([
    read('../app/(admin)/admin/deepseek-tasks/OllamaProvidersPanel.jsx'),
    read('../app/api/admin/llm-providers/chat/route.js'),
  ])

  assert.match(panel, /Ollama 直接调用测试/)
  assert.match(panel, /直接选择已安装模型并发送提示词/)
  assert.match(panel, /ModelSelector/)
  assert.match(panel, /buildAdminModelOptions/)
  assert.match(panel, /\/api\/admin\/llm-providers\/chat/)
  assert.match(panel, /body: JSON\.stringify\(\{ id: testProviderId, model: testModel, prompt: testPrompt \}\)/)
  assert.match(panel, /directTestResult\.usage\?\.total_tokens/)
  assert.match(chatRoute, /getOwnerOrReject\(req\)/)
  assert.match(chatRoute, /model = cleanText\(body\?\.model, 160\)/)
  assert.match(chatRoute, /prompt = cleanText\(body\?\.prompt, 8000\)/)
  assert.match(chatRoute, /callOllama\(\{/)
  assert.match(chatRoute, /model,/)
  assert.match(chatRoute, /taskType: 'direct-test'/)
})
