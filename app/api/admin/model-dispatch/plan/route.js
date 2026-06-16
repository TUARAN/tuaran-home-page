import { getOptionalRequestContext } from '@cloudflare/next-on-pages'

import { getOwnerOrReject } from '../../../../../lib/adminAuth'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-v4-pro'

function getEnv() {
  const ctx = getOptionalRequestContext()
  return ctx?.env || process.env || {}
}

function makePlannerPrompt(task, strategyVersion) {
  return `你是企业后台 Admin 专属多代码大模型智能调度规划器。你的身份是 DeepSeek V4 Pro 线上 API 规划拆解器，只负责把需求拆成任务图和分派方案，不是唯一执行者。

固定执行 agent：
- Codex-GPT5.5 一体化套件：Codex 是工程执行载体，GPT5.5 是底层推理引擎，二者绑定为单一调度单元，禁止拆分。适合全栈混合开发、读写文件、自测、中小型项目端到端交付、API 批量生成、脚本重构；不适合百万行一次性全局解析和深度安全审计。
- Claude Code Opus4.8：适合百万行上下文、跨模块大型重构、漏洞合规深度审计、复杂业务长方案；不适合短任务和低成本脚本。
- Cursor Composer2.5：适合本地 IDE 补全、单文件 bug、前端增量、小模块；不适合全局架构和完整项目独立交付。
- Workbuddy 轻量化运维低代码工具：适合低成本运维脚本、CI/CD、低代码表单、自动化辅助；不适合复杂算法、大型架构、深度审计。
- DeepSeek V4 Pro 线上 API：默认承担本次规划拆解；也可执行低成本批量代码/API 子任务，但必须标注限流、超时、隐私传输、并发峰值报错风险。

任务标题：${task?.title || ''}
原始需求：${task?.demand || ''}
仓库/项目：${task?.repo || ''}
上下文：${task?.context || ''}
规模：${task?.scale || ''}
时效：${task?.deadline || ''}
成本：${task?.cost || ''}
隐私：${task?.privacy || ''}
是否全仓库读取：${task?.fullRepo ? '是' : '否'}
是否需要本地 IDE：${task?.localIde ? '是' : '否'}
并发量级：${task?.concurrency || ''}

只返回严格 JSON，不要 markdown。字段：
{
  "task_info": {"task_id": "ADM-DISPATCH-YYYYMMDD-001", "title": "string", "strategy_version": "${strategyVersion}", "planner_unit": "DeepSeek V4 Pro 线上 API", "status": "planned"},
  "planner_summary": "string",
  "subtasks": [
    {
      "id": "T1",
      "title": "string",
      "goal": "string",
      "assigned_agent": "codex-gpt55 | claude-opus48 | cursor-composer25 | workbuddy-lowcode | deepseek-v4-pro-api",
      "backup_agent": "codex-gpt55 | claude-opus48 | cursor-composer25 | workbuddy-lowcode | deepseek-v4-pro-api",
      "priority": "P0 | P1 | P2",
      "status": "todo",
      "reason": "必须绑定 agent 能力边界或 DeepSeek API 风险",
      "prompt": "给该执行 agent 的专属执行 Prompt",
      "inputs": ["string"],
      "deliverables": ["string"],
      "risks": ["string"]
    }
  ],
  "execution_order": ["T1"],
  "audit_checklist": ["string"]
}`
}

function extractJson(text) {
  const value = String(text || '').trim()
  if (!value) throw new Error('EMPTY_DEEPSEEK_RESPONSE')
  try {
    return JSON.parse(value)
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('DEEPSEEK_JSON_NOT_FOUND')
    return JSON.parse(match[0])
  }
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const env = getEnv()
  const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'MISSING_DEEPSEEK_API_KEY' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  const task = body?.task || {}
  const strategyVersion = body?.strategyVersion || 'dispatch-admin-orchestrator-v1.1.0'
  const baseUrl = (env.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const model = env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: '你只输出严格 JSON。不要输出 markdown、解释、代码围栏或额外文本。',
          },
          {
            role: 'user',
            content: makePlannerPrompt(task, strategyVersion),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 4096,
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return Response.json(
        {
          error: 'DEEPSEEK_API_FAILED',
          status: res.status,
          detail: data?.error?.message || data?.message || 'DeepSeek API request failed',
        },
        { status: 502 }
      )
    }

    const raw = data?.choices?.[0]?.message?.content || ''
    const plan = extractJson(raw)
    return Response.json({
      ok: true,
      model,
      plannedAt: Date.now(),
      usage: data?.usage || null,
      plan,
      raw,
    })
  } catch (error) {
    const aborted = error?.name === 'AbortError'
    return Response.json(
      {
        error: aborted ? 'DEEPSEEK_API_TIMEOUT' : 'DEEPSEEK_PLAN_FAILED',
        detail: String(error?.message || error),
      },
      { status: aborted ? 504 : 500 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
