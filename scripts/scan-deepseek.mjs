// Autopilot 专用 DeepSeek 客户端。
// 与 lib/deepseek.js 保持同一契约：OpenAI 兼容 /chat/completions，环境变量
// DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL / DEEPSEEK_MODEL。
// 不直接 import lib/deepseek.js：它面向 Cloudflare Edge 运行时（无扩展名 ESM import），
// 普通 Node 脚本无法加载；这里按相同协议做精简实现，避免改动生产代码。

const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const FLASH_MODEL = 'deepseek-v4-flash'
export const PRO_MODEL = 'deepseek-v4-pro'

// 模型路由规则：简单的任务用 flash，复杂的任务用 pro。
// - 安全分诊永远按复杂处理（误判成本高，涉及漏洞与权限边界）；
// - 报告存在 high 发现、high+medium 达 5 项、或总发现达 20 项 → 复杂；
// - 其余例行分诊（少量 low/info）→ 简单。
// - DEEPSEEK_MODEL 显式配置时优先于规则。
export function pickScanModel({ type, issues = [] }) {
  if (process.env.DEEPSEEK_MODEL) return process.env.DEEPSEEK_MODEL
  let high = 0
  let medium = 0
  for (const issue of issues) {
    if (issue.severity === 'high') high += 1
    else if (issue.severity === 'medium') medium += 1
  }
  const complex =
    type === 'security' ||
    high > 0 ||
    high + medium >= 5 ||
    issues.length >= 20
  return complex ? PRO_MODEL : FLASH_MODEL
}

export function getScanDeepSeekEnv() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: String(process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    model: process.env.DEEPSEEK_MODEL || '',
  }
}

function extractJson(text) {
  const value = String(text || '').trim()
  if (!value) throw new Error('DeepSeek 返回空内容')
  try {
    return JSON.parse(value)
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('DeepSeek 返回里找不到 JSON')
    return JSON.parse(match[0])
  }
}

export async function callScanDeepSeekJson({
  messages,
  model,
  type,
  issues,
  temperature = 0.2,
  maxTokens = 4096,
  timeoutMs = 90000,
} = {}) {
  const env = getScanDeepSeekEnv()
  if (!env.apiKey) {
    throw Object.assign(new Error('缺少 DEEPSEEK_API_KEY'), { code: 'MISSING_DEEPSEEK_API_KEY' })
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw Object.assign(new Error('messages 不能为空'), { code: 'DEEPSEEK_BAD_REQUEST' })
  }
  const resolvedModel = model || env.model || pickScanModel({ type, issues })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${env.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${env.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      throw Object.assign(
        new Error(data?.error?.message || data?.message || 'DeepSeek API 请求失败'),
        { code: 'DEEPSEEK_API_FAILED', status: res.status },
      )
    }
    const content = data?.choices?.[0]?.message?.content || ''
    return {
      ok: true,
      model: resolvedModel,
      content,
      usage: data?.usage || null,
      json: extractJson(content),
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw Object.assign(new Error('DeepSeek API 超时'), { code: 'DEEPSEEK_API_TIMEOUT' })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
