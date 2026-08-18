import { getD1 } from './d1.js'
import { decryptApiKey, getKeyStoreEnv } from './deepseekKeys.js'
import { createDeepSeekTask, finishDeepSeekTask } from './deepseekTasks.js'
import { buildOllamaAuthHeaders, buildOllamaChatRequest, ollamaNativeChatUrl, parseOllamaChatResponse } from './ollamaCore.js'

function codedError(code, message, extra = {}) {
  const error = new Error(message)
  error.code = code
  Object.assign(error, extra)
  return error
}

export async function getOllamaProvider(id, { requireActive = true } = {}) {
  const db = getD1()
  const row = await db.prepare('SELECT * FROM llm_providers WHERE id = ? AND provider_type = ?')
    .bind(String(id || ''), 'ollama')
    .first()
  if (!row) throw codedError('OLLAMA_PROVIDER_NOT_FOUND', '找不到 Ollama 服务配置')
  if (requireActive && row.status !== 'active') throw codedError('OLLAMA_PROVIDER_DISABLED', 'Ollama 服务已停用')

  const authType = row.auth_type || (row.auth_cipher ? 'bearer' : 'none')
  const auth = { type: authType, token: '', clientId: '', clientSecret: '' }
  if (row.auth_cipher || row.auth_secondary_cipher) {
    const secret = String(getKeyStoreEnv().DEEPSEEK_KEYS_ENC_SECRET || '').trim()
    if (!secret) throw codedError('LLM_KEYS_ENC_SECRET_NOT_CONFIGURED', '缺少密钥加密主密钥')
    if (authType === 'cloudflare_access') {
      auth.clientId = row.auth_cipher ? await decryptApiKey(row.auth_cipher, secret) : ''
      auth.clientSecret = row.auth_secondary_cipher ? await decryptApiKey(row.auth_secondary_cipher, secret) : ''
    } else if (authType === 'bearer') {
      auth.token = row.auth_cipher ? await decryptApiKey(row.auth_cipher, secret) : ''
    }
  }
  return { row, auth }
}

export async function callOllama({
  providerId,
  messages,
  model,
  temperature = 0.2,
  maxTokens = 2048,
  reasoningEffort,
  timeoutMs = 90000,
  task,
} = {}) {
  if (!providerId) throw codedError('MISSING_OLLAMA_PROVIDER', '缺少 Ollama 服务 ID')
  if (!Array.isArray(messages) || !messages.length) throw codedError('OLLAMA_BAD_REQUEST', 'messages 不能为空')

  const startedAt = Date.now()
  const { row, auth } = await getOllamaProvider(providerId)
  const resolvedModel = String(model || row.default_model || '').trim()
  if (!resolvedModel) throw codedError('MISSING_OLLAMA_MODEL', 'Ollama 服务未配置默认模型')
  const taskId = task
    ? await createDeepSeekTask({
        ...task,
        model: resolvedModel,
        provider: 'ollama',
        providerId: row.id,
        providerName: row.name,
        startedAt,
      })
    : null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.min(Math.max(Number(timeoutMs) || 90000, 1000), 120000))

  try {
    const response = await fetch(ollamaNativeChatUrl(row.base_url), {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...buildOllamaAuthHeaders(auth),
      },
      body: JSON.stringify(buildOllamaChatRequest({
        model: resolvedModel,
        messages,
        temperature,
        maxTokens,
        reasoningEffort,
      })),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw codedError('OLLAMA_API_FAILED', data?.error?.message || data?.error || `Ollama 返回 HTTP ${response.status}`, { status: response.status })
    }
    const result = parseOllamaChatResponse(data)
    if (!result.content) throw codedError('OLLAMA_EMPTY_RESPONSE', 'Ollama 返回空内容')
    await finishDeepSeekTask(taskId, {
      status: 'succeeded',
      usage: result.usage,
      durationMs: Date.now() - startedAt,
      resultSummary: result.content.slice(0, 300),
    })
    getD1().prepare('UPDATE llm_providers SET last_used_at = ?, used_count = used_count + 1 WHERE id = ?')
      .bind(Date.now(), row.id).run().catch(() => {})
    return { ok: true, ...result, taskId, providerId: row.id, providerName: row.name }
  } catch (error) {
    const finalError = error?.name === 'AbortError'
      ? codedError('OLLAMA_API_TIMEOUT', 'Ollama 调用超时')
      : error
    await finishDeepSeekTask(taskId, {
      status: 'failed',
      durationMs: Date.now() - startedAt,
      errorCode: finalError?.code || 'OLLAMA_CALL_FAILED',
      errorDetail: finalError?.message || String(finalError),
    })
    throw finalError
  } finally {
    clearTimeout(timer)
  }
}
