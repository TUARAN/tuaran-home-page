import test from 'node:test'
import assert from 'node:assert/strict'

import { buildOllamaAuthHeaders, normalizeOllamaBaseUrl, ollamaChatUrl, parseOllamaChatResponse } from '../lib/ollamaCore.js'

test('Ollama Base URL 规范化并补 OpenAI 兼容路径', () => {
  assert.equal(normalizeOllamaBaseUrl('https://ollama.example.com/v1/'), 'https://ollama.example.com')
  assert.equal(ollamaChatUrl('https://ollama.example.com/ai/'), 'https://ollama.example.com/ai/v1/chat/completions')
})

test('Ollama Base URL 拒绝 HTTP、认证信息与明显内网地址', () => {
  assert.throws(() => normalizeOllamaBaseUrl('http://nas.example.com:11434'), /OLLAMA_HTTPS_REQUIRED/)
  assert.throws(() => normalizeOllamaBaseUrl('https://user:pass@nas.example.com'), /INVALID_BASE_URL/)
  assert.throws(() => normalizeOllamaBaseUrl('https://192.168.1.2:11434'), /OLLAMA_PUBLIC_HOST_REQUIRED/)
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
