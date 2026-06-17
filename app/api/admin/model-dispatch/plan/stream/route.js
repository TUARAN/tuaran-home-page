import { getOwnerOrReject } from '../../../../../../lib/adminAuth'
import {
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MODEL,
  extractJson,
  getDeepSeekEnv,
} from '../../../../../../lib/deepseek'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

function makePlannerPrompt(task, strategyVersion) {
  return `你是企业后台 Admin 专属多代码大模型智能调度规划器。你的身份是 DeepSeek V4 Pro 线上 API 规划拆解器，只负责把需求拆成任务图和分派方案，不是唯一执行者。

固定执行 agent：
- Codex-GPT5.5 全栈工程执行：Codex 是工程执行载体，GPT5.5 是底层推理引擎，二者绑定为单一调度单元，禁止拆分。适合全栈混合开发、读写文件、自测、中小型项目端到端交付、API 批量生成、脚本重构；不适合百万行一次性全局解析和深度安全审计。
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

你必须把任务拆成 plan_steps。每个环节都要说明用哪个大模型/agent、备用模型、选型依据、预估 token、预估成本、预估耗时、依赖、交付物和风险。预估不允许留空；无法精确时给区间，例如 "20K-40K"、"低/中/高"、"2-6 小时"。

只返回严格 JSON，不要 markdown。字段：
{
  "task_info": {"task_id": "ADM-DISPATCH-YYYYMMDD-001", "title": "string", "strategy_version": "${strategyVersion}", "planner_unit": "DeepSeek V4 Pro 线上 API", "status": "planned"},
  "planner_summary": "string",
  "plan_steps": [
    {
      "id": "P1",
      "phase": "string",
      "objective": "string",
      "assigned_agent": "codex-gpt55 | claude-opus48 | cursor-composer25 | workbuddy-lowcode | deepseek-v4-pro-api",
      "backup_agent": "codex-gpt55 | claude-opus48 | cursor-composer25 | workbuddy-lowcode | deepseek-v4-pro-api",
      "model_rationale": "必须绑定 agent 能力边界或 DeepSeek V4 Pro 线上 API 风险",
      "estimated_tokens": "例如 20K-40K",
      "estimated_cost": "低 | 中 | 中高 | 高，或具体金额/区间",
      "estimated_duration": "例如 2-6 小时",
      "dependencies": ["P0"],
      "deliverables": ["string"],
      "risks": ["string"]
    }
  ],
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
      "risks": ["string"],
      "estimated_tokens": "例如 20K-40K",
      "estimated_cost": "低 | 中 | 中高 | 高，或具体金额/区间",
      "estimated_duration": "例如 2-6 小时"
    }
  ],
  "execution_order": ["T1"],
  "audit_checklist": ["string"]
}`
}

function sse(controller, event, data) {
  controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function readDeltaLine(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data:')) return ''
  const payload = trimmed.slice(5).trim()
  if (!payload || payload === '[DONE]') return ''
  const json = JSON.parse(payload)
  return json?.choices?.[0]?.delta?.content || ''
}

export async function POST(req) {
  const guard = await getOwnerOrReject(req)
  if (!guard.ok) return guard.response

  const env = getDeepSeekEnv()
  const apiKey = env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'MISSING_DEEPSEEK_API_KEY' }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  const task = body?.task || {}
  const strategyVersion = body?.strategyVersion || 'dispatch-admin-orchestrator-v1.2.0'
  const baseUrl = String(env.DEEPSEEK_BASE_URL || DEEPSEEK_DEFAULT_BASE_URL).replace(/\/+$/, '')
  const model = env.DEEPSEEK_MODEL || DEEPSEEK_DEFAULT_MODEL

  const stream = new ReadableStream({
    async start(controller) {
      sse(controller, 'start', { model, startedAt: Date.now() })
      let raw = ''
      let phase = 'initializing'
      try {
        phase = 'requesting_deepseek'
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${apiKey}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            stream: true,
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

        if (!res.ok || !res.body) {
          const detail = await res.text().catch(() => '')
          sse(controller, 'error', { error: 'DEEPSEEK_API_FAILED', phase, status: res.status, detail })
          controller.close()
          return
        }

        phase = 'reading_stream'
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            try {
              const delta = readDeltaLine(line)
              if (!delta) continue
              raw += delta
              sse(controller, 'delta', { text: delta })
            } catch {
              // Ignore malformed provider chunks.
            }
          }
        }

        if (buffer.trim()) {
          for (const line of buffer.split('\n')) {
            try {
              const delta = readDeltaLine(line)
              if (!delta) continue
              raw += delta
              sse(controller, 'delta', { text: delta })
            } catch {
              // Ignore malformed provider chunks.
            }
          }
        }

        phase = 'parsing_json'
        const plan = extractJson(raw)
        sse(controller, 'done', { model, raw, plan, plannedAt: Date.now() })
        controller.close()
      } catch (error) {
        sse(controller, 'error', {
          error: 'DEEPSEEK_STREAM_FAILED',
          phase,
          detail: String(error?.message || error),
          raw,
          rawPreview: raw.slice(0, 1000),
        })
        controller.close()
      }
    },
  })

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  })
}
