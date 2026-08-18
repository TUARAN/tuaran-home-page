const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
]

/**
 * 线上 Edge 只能调用公网 HTTPS 地址。这里同时挡住明显的内网地址，
 * 避免把后台的可配置 URL 变成访问 Cloudflare 内部网络的入口。
 */
export function normalizeOllamaBaseUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) throw new Error('MISSING_BASE_URL')
  let url
  try {
    url = new URL(raw)
  } catch {
    throw new Error('INVALID_BASE_URL')
  }
  if (url.protocol !== 'https:') throw new Error('OLLAMA_HTTPS_REQUIRED')
  if (url.username || url.password || url.search || url.hash) throw new Error('INVALID_BASE_URL')
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new Error('OLLAMA_PUBLIC_HOST_REQUIRED')
  }
  const path = url.pathname.replace(/\/+$/, '').replace(/\/v1$/i, '')
  return `${url.origin}${path}`
}

export function ollamaChatUrl(baseUrl) {
  return `${normalizeOllamaBaseUrl(baseUrl)}/v1/chat/completions`
}

export function ollamaNativeChatUrl(baseUrl) {
  return `${normalizeOllamaBaseUrl(baseUrl)}/api/chat`
}

export function buildOllamaChatRequest({ model, messages, temperature, maxTokens, reasoningEffort } = {}) {
  return {
    model,
    messages,
    options: {
      temperature,
      num_predict: maxTokens,
    },
    ...(reasoningEffort === 'none' ? { think: false } : {}),
    stream: false,
  }
}

export function buildOllamaAuthHeaders(auth = {}) {
  if (auth.type === 'cloudflare_access') {
    if (!auth.clientId || !auth.clientSecret) throw new Error('CLOUDFLARE_ACCESS_CREDENTIALS_MISSING')
    return {
      'CF-Access-Client-Id': auth.clientId,
      'CF-Access-Client-Secret': auth.clientSecret,
    }
  }
  if (auth.type === 'bearer') {
    if (!auth.token) throw new Error('OLLAMA_BEARER_TOKEN_MISSING')
    return { authorization: `Bearer ${auth.token}` }
  }
  return {}
}

export function parseOllamaChatResponse(data) {
  const promptTokens = Math.max(0, Number(data?.prompt_eval_count) || 0)
  const completionTokens = Math.max(0, Number(data?.eval_count) || 0)
  const nativeUsage = promptTokens || completionTokens
    ? {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      }
    : null
  return {
    model: String(data?.model || ''),
    content: String(data?.message?.content || data?.choices?.[0]?.message?.content || ''),
    usage: data?.usage && typeof data.usage === 'object' ? data.usage : nativeUsage,
  }
}
