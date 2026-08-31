import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildOllamaAuthHeaders,
  buildOllamaChatRequest,
  normalizeOllamaModels,
  normalizeOllamaBaseUrl,
  ollamaUpstreamError,
  ollamaChatUrl,
  ollamaNativeChatUrl,
  ollamaTagsUrl,
  parseOllamaChatResponse,
} from '../lib/ollamaCore.js'

test('将 Cloudflare Tunnel 源站错误转换为可操作的 Ollama 错误', () => {
  assert.deepEqual(ollamaUpstreamError(502), {
    code: 'OLLAMA_ORIGIN_UNAVAILABLE',
    message: 'Cloudflare Tunnel 已连接，但 NAS Ollama 源站不可达。请检查 NAS 上的 Ollama 服务以及 Tunnel 到 11434 端口的转发。',
    status: 503,
    upstreamStatus: 502,
  })
  assert.deepEqual(ollamaUpstreamError(524), {
    code: 'OLLAMA_ORIGIN_TIMEOUT',
    message: 'NAS Ollama 已收到请求，但模型加载或生成超过 Cloudflare 等待时间。请先在 NAS 上预热模型后重试。',
    status: 504,
    upstreamStatus: 524,
  })
  assert.deepEqual(ollamaUpstreamError(401, { error: 'bad token' }), {
    code: 'OLLAMA_API_FAILED',
    message: 'bad token',
    status: 401,
    upstreamStatus: 401,
  })
})

test('Ollama Base URL 规范化并补 OpenAI 兼容路径', () => {
  assert.equal(normalizeOllamaBaseUrl('https://ollama.example.com/v1/'), 'https://ollama.example.com')
  assert.equal(ollamaChatUrl('https://ollama.example.com/ai/'), 'https://ollama.example.com/ai/v1/chat/completions')
  assert.equal(ollamaNativeChatUrl('https://ollama.example.com/ai/'), 'https://ollama.example.com/ai/api/chat')
  assert.equal(ollamaTagsUrl('https://ollama.example.com/ai/'), 'https://ollama.example.com/ai/api/tags')
})

test('27B 模型请求限制为 4096 上下文', () => {
  const request = buildOllamaChatRequest({
    model: 'qwen3.8-27b',
    messages: [{ role: 'user', content: 'ping' }],
    temperature: 0,
    maxTokens: 64,
  })
  assert.equal(request.options.num_ctx, 4096)
  assert.equal(buildOllamaChatRequest({ model: 'qwen3.5:9b', messages: [], maxTokens: 1 }).options.num_ctx, undefined)
})

test('规范化 Ollama 模型列表，不保留摘要或凭据信息', () => {
  assert.deepEqual(normalizeOllamaModels({ models: [{
    name: 'qwen3.8-27b',
    size: 10_234,
    digest: 'private-digest',
    details: { parameter_size: '27B', quantization_level: 'IQ2_S', family: 'qwen3' },
  }] }), [{
    name: 'qwen3.8-27b',
    displayName: 'Qwen 3.8 27B · IQ2_S',
    size: 10_234,
    parameterSize: '27B',
    quantizationLevel: 'IQ2_S',
  }])
})

test('模型展示名使用标签中的友好参数规模，同时保留 NAS 上报的精确规模', () => {
  assert.deepEqual(normalizeOllamaModels({ models: [
    {
      name: 'qwen3.5:9b',
      size: 1,
      details: { parameter_size: '9.7B', quantization_level: 'Q4_K_M' },
    },
    {
      name: 'qwen3.8-27b:ud-iq2-s',
      size: 2,
      details: { parameter_size: '26.9B', quantization_level: 'IQ2_S' },
    },
  ] }).map(({ name, displayName, parameterSize }) => ({ name, displayName, parameterSize })), [
    { name: 'qwen3.5:9b', displayName: 'Qwen 3.5 9B · Q4_K_M', parameterSize: '9.7B' },
    { name: 'qwen3.8-27b:ud-iq2-s', displayName: 'Qwen 3.8 27B · IQ2_S', parameterSize: '26.9B' },
  ])
})

test('Ollama Base URL 拒绝 HTTP、认证信息与明显内网地址', () => {
  assert.throws(() => normalizeOllamaBaseUrl('http://nas.example.com:11434'), /OLLAMA_HTTPS_REQUIRED/)
  assert.throws(() => normalizeOllamaBaseUrl('https://user:pass@nas.example.com'), /INVALID_BASE_URL/)
  assert.throws(() => normalizeOllamaBaseUrl('https://192.168.1.2:11434'), /OLLAMA_PUBLIC_HOST_REQUIRED/)
})

test('构建关闭思考的 Ollama 原生请求', () => {
  assert.deepEqual(buildOllamaChatRequest({
    model: 'qwen3.5:9b',
    messages: [{ role: 'user', content: 'ping' }],
    temperature: 0,
    maxTokens: 64,
    reasoningEffort: 'none',
  }), {
    model: 'qwen3.5:9b',
    messages: [{ role: 'user', content: 'ping' }],
    options: { temperature: 0, num_predict: 64 },
    think: false,
    stream: false,
  })
})

test('解析 Ollama 原生响应并归一化 Token', () => {
  assert.deepEqual(parseOllamaChatResponse({
    model: 'qwen3.5:9b',
    message: { role: 'assistant', content: '正常' },
    prompt_eval_count: 8,
    eval_count: 2,
  }), {
    model: 'qwen3.5:9b',
    content: '正常',
    usage: { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 },
  })
})

test('解析 OpenAI 兼容的 Ollama 响应', () => {
  assert.deepEqual(parseOllamaChatResponse({
    model: 'qwen3:8b',
    choices: [{ message: { content: 'pong' } }],
    usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
  }), {
    model: 'qwen3:8b',
    content: 'pong',
    usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
  })
})

test('构建 Ollama Bearer 与 Cloudflare Access 鉴权头', () => {
  assert.deepEqual(buildOllamaAuthHeaders({ type: 'none' }), {})
  assert.deepEqual(buildOllamaAuthHeaders({ type: 'bearer', token: 'abc' }), {
    authorization: 'Bearer abc',
  })
  assert.deepEqual(buildOllamaAuthHeaders({
    type: 'cloudflare_access', clientId: 'client-id', clientSecret: 'client-secret',
  }), {
    'CF-Access-Client-Id': 'client-id',
    'CF-Access-Client-Secret': 'client-secret',
  })
  assert.throws(
    () => buildOllamaAuthHeaders({ type: 'cloudflare_access', clientId: 'client-id' }),
    /CLOUDFLARE_ACCESS_CREDENTIALS_MISSING/,
  )
})
