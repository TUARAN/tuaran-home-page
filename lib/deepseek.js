/**
 * DeepSeek 共享调用层
 *
 * 站长方针:云端自动化里凡是要用大模型的步骤,统一走 DeepSeek。
 * 这里把调用逻辑收成一处,任何 Edge 路由 / 采集器 import 即可,别再各写一遍 fetch。
 *
 * 环境变量(在 Cloudflare Pages Secrets 配):
 *   - DEEPSEEK_API_KEY   必需
 *   - DEEPSEEK_BASE_URL  可选,默认 https://api.deepseek.com
 *   - DEEPSEEK_MODEL     可选；线上调用默认 deepseek-v4-flash，显式传 model 才会改。
 *
 * 双协议：
 *   - OpenAI 兼容协议(/chat/completions, Bearer 鉴权)——默认路径；
 *   - Responses API(/responses)——服务端 web_search 联网检索必须走这里
 *     （DeepSeek 官方：老 /chat/completions 会忽略 web_search 工具参数）。
 *
 * 错误用 err.code 区分,方便调用方映射 HTTP 状态:
 *   MISSING_DEEPSEEK_API_KEY / DEEPSEEK_API_FAILED(带 .status) /
 *   DEEPSEEK_API_TIMEOUT / DEEPSEEK_EMPTY_RESPONSE / DEEPSEEK_JSON_NOT_FOUND
 */

import { getOptionalRequestContext } from '@cloudflare/next-on-pages'
import { createDeepSeekTask, finishDeepSeekTask } from './deepseekTasks'
import { resolveDeepSeekKey } from './deepseekKeys'
import { resolveDeepSeekModel, DEEPSEEK_SITE_MODEL } from './deepseekKeysCore'
import { normalizeResponsesUsage, parseResponsesOutput } from './deepseekResponsesCore'

export const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const DEEPSEEK_DEFAULT_MODEL = DEEPSEEK_SITE_MODEL

function codedError(code, message, extra = {}) {
  const err = new Error(message || code)
  err.code = code
  Object.assign(err, extra)
  return err
}

/**
 * 解析 env:显式传入优先,否则取 Cloudflare Edge 上下文,最后回退 process.env。
 * (Edge 路由要直接调 getOptionalRequestContext,不能依赖 handler 第二参,见 lib/d1.js)
 */
export function getDeepSeekEnv(explicitEnv) {
  if (explicitEnv) return explicitEnv
  const ctx = getOptionalRequestContext()
  if (ctx?.env) return ctx.env
  return (typeof process !== 'undefined' && process.env) || {}
}

/** 从可能夹带散文/围栏的文本里抠出 JSON 对象 */
export function extractJson(text) {
  const value = String(text || '').trim()
  if (!value) throw codedError('DEEPSEEK_EMPTY_RESPONSE', 'DeepSeek 返回空内容')
  try {
    return JSON.parse(value)
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) throw codedError('DEEPSEEK_JSON_NOT_FOUND', 'DeepSeek 返回里找不到 JSON')
    return JSON.parse(match[0])
  }
}

/**
 * 调一次 DeepSeek chat/completions。
 * @returns {Promise<{ok:true, model:string, content:string, usage:object|null, raw:object}>}
 */
export async function callDeepSeek({
  env,
  messages,
  model,
  temperature = 0.2,
  maxTokens = 4096,
  responseFormat,
  timeoutMs = 60000,
  signal,
  task: taskMeta,
  taskDefaultModel,
  disableThinking = false,
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw codedError('DEEPSEEK_BAD_REQUEST', 'messages 不能为空')
  }
  const startedAt = Date.now()
  const resolved = getDeepSeekEnv(env)
  const key = await resolveDeepSeekKey({
    env: resolved,
    source: taskMeta?.source,
    taskType: taskMeta?.taskType,
  })
  const apiKey = key.apiKey
  const baseUrl = String(key.baseUrl || resolved.DEEPSEEK_BASE_URL || DEEPSEEK_DEFAULT_BASE_URL).replace(/\/+$/, '')
  const resolvedModel = resolveDeepSeekModel({
    model,
    taskDefaultModel,
    fallback: DEEPSEEK_DEFAULT_MODEL,
  })
  const taskId = taskMeta
    ? await createDeepSeekTask({ ...taskMeta, model: resolvedModel, keyId: key.keyId, keyName: key.keyName, startedAt })
    : null

  if (!apiKey) {
    await finishDeepSeekTask(taskId, {
      status: 'failed',
      durationMs: Date.now() - startedAt,
      errorCode: 'MISSING_DEEPSEEK_API_KEY',
      errorDetail: '缺少 DEEPSEEK_API_KEY',
    })
    throw codedError('MISSING_DEEPSEEK_API_KEY', '缺少 DEEPSEEK_API_KEY')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        ...(disableThinking ? { thinking: { type: 'disabled' } } : {}),
        ...(responseFormat ? { response_format: responseFormat } : {}),
        temperature,
        max_tokens: maxTokens,
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw codedError(
        'DEEPSEEK_API_FAILED',
        data?.error?.message || data?.message || 'DeepSeek API 请求失败',
        { status: res.status },
      )
    }

    const result = {
      ok: true,
      model: resolvedModel,
      content: data?.choices?.[0]?.message?.content || '',
      usage: data?.usage || null,
      raw: data,
      taskId,
    }
    await finishDeepSeekTask(taskId, {
      status: 'succeeded',
      usage: result.usage,
      durationMs: Date.now() - startedAt,
    })
    return result
  } catch (error) {
    const finalError = error?.name === 'AbortError'
      ? codedError('DEEPSEEK_API_TIMEOUT', 'DeepSeek API 超时')
      : error
    await finishDeepSeekTask(taskId, {
      status: 'failed',
      durationMs: Date.now() - startedAt,
      errorCode: finalError?.code || 'DEEPSEEK_CALL_FAILED',
      errorDetail: finalError?.message || String(finalError),
    })
    if (error?.name === 'AbortError') throw finalError
    throw error
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 调 DeepSeek 并要求严格 JSON 输出,返回解析后的对象。
 * 默认带 response_format: json_object,并在前面塞一条只输出 JSON 的 system 提示。
 * @returns {Promise<{model, content, usage, raw, json}>}
 */
export async function callDeepSeekJson({ messages, responseFormat, ensureJsonSystemPrompt = true, ...rest }) {
  const finalMessages =
    ensureJsonSystemPrompt && !messages.some((m) => m.role === 'system')
      ? [
          { role: 'system', content: '你只输出严格 JSON。不要输出 markdown、解释、代码围栏或额外文本。' },
          ...messages,
        ]
      : messages
  const result = await callDeepSeek({
    ...rest,
    messages: finalMessages,
    responseFormat: responseFormat || { type: 'json_object' },
  })
  try {
    return { ...result, json: extractJson(result.content) }
  } catch (error) {
    await finishDeepSeekTask(result.taskId, {
      status: 'failed',
      usage: result.usage,
      errorCode: error?.code || 'DEEPSEEK_JSON_PARSE_FAILED',
      errorDetail: error?.message || String(error),
    })
    throw error
  }
}

/**
 * 调一次 DeepSeek Responses API（服务端联网检索走这里）。
 * @returns {Promise<{ok:true, model:string, content:string, usage:object|null, raw:object,
 *   taskId:string|null, webSearchCalls:number, citations:Array, searchResults:Array}>}
 */
export async function callDeepSeekResponses({
  env,
  input,
  instructions,
  model,
  tools,
  toolChoice,
  temperature = 0.2,
  maxTokens = 4096,
  timeoutMs = 60000,
  signal,
  task: taskMeta,
  taskDefaultModel,
  disableThinking = false,
  user,
} = {}) {
  if (input == null && !instructions) {
    throw codedError('DEEPSEEK_BAD_REQUEST', 'Responses API 的 input 与 instructions 至少传一个')
  }
  const startedAt = Date.now()
  const resolved = getDeepSeekEnv(env)
  const key = await resolveDeepSeekKey({
    env: resolved,
    source: taskMeta?.source,
    taskType: taskMeta?.taskType,
  })
  const apiKey = key.apiKey
  const baseUrl = String(key.baseUrl || resolved.DEEPSEEK_BASE_URL || DEEPSEEK_DEFAULT_BASE_URL).replace(/\/+$/, '')
  const resolvedModel = resolveDeepSeekModel({
    model,
    taskDefaultModel,
    fallback: DEEPSEEK_DEFAULT_MODEL,
  })
  const webSearchEnabled = (tools || []).some((tool) => String(tool?.type || '').startsWith('web_search'))
  const taskId = taskMeta
    ? await createDeepSeekTask({
        ...taskMeta,
        model: resolvedModel,
        keyId: key.keyId,
        keyName: key.keyName,
        startedAt,
        metadata: { protocol: 'responses', webSearch: { enabled: webSearchEnabled, calls: 0, citations: 0 } },
      })
    : null

  if (!apiKey) {
    await finishDeepSeekTask(taskId, {
      status: 'failed',
      durationMs: Date.now() - startedAt,
      errorCode: 'MISSING_DEEPSEEK_API_KEY',
      errorDetail: '缺少 DEEPSEEK_API_KEY',
    })
    throw codedError('MISSING_DEEPSEEK_API_KEY', '缺少 DEEPSEEK_API_KEY')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const res = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModel,
        ...(input != null ? { input } : {}),
        ...(instructions ? { instructions } : {}),
        ...(tools?.length ? { tools } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
        ...(disableThinking ? { reasoning: { effort: 'none' } } : {}),
        temperature,
        ...(maxTokens ? { max_output_tokens: maxTokens } : {}),
        ...(user ? { user } : {}),
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw codedError(
        'DEEPSEEK_API_FAILED',
        data?.error?.message || data?.message || 'DeepSeek Responses API 请求失败',
        { status: res.status },
      )
    }
    if (data?.status === 'failed') {
      throw codedError(
        'DEEPSEEK_API_FAILED',
        data?.error?.message || 'DeepSeek Responses API 返回 failed',
        { status: res.status },
      )
    }

    const parsed = parseResponsesOutput(data)
    const usage = normalizeResponsesUsage(data?.usage)
    const result = {
      ok: true,
      model: resolvedModel,
      content: parsed.content,
      usage,
      raw: data,
      taskId,
      webSearchCalls: parsed.webSearchCalls,
      citations: parsed.citations,
      searchResults: parsed.searchResults,
      truncated: data?.status === 'incomplete',
    }
    await finishDeepSeekTask(taskId, {
      status: 'succeeded',
      usage,
      durationMs: Date.now() - startedAt,
      resultSummary: parsed.webSearchCalls
        ? `联网检索 ${parsed.webSearchCalls} 次，引用 ${parsed.citations.length} 条来源`
        : '',
      metadata: {
        protocol: 'responses',
        webSearch: {
          enabled: webSearchEnabled,
          calls: parsed.webSearchCalls,
          citations: parsed.citations.length,
          searchResults: parsed.searchResults,
        },
      },
    })
    return result
  } catch (error) {
    const finalError = error?.name === 'AbortError'
      ? codedError('DEEPSEEK_API_TIMEOUT', 'DeepSeek API 超时')
      : error
    await finishDeepSeekTask(taskId, {
      status: 'failed',
      durationMs: Date.now() - startedAt,
      errorCode: finalError?.code || 'DEEPSEEK_CALL_FAILED',
      errorDetail: finalError?.message || String(finalError),
    })
    if (error?.name === 'AbortError') throw finalError
    throw error
  } finally {
    clearTimeout(timer)
  }
}
