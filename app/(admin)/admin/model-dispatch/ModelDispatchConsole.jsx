'use client'

import { useMemo, useState } from 'react'

import { AdminPage, Section } from '../../components/ui'

const STRATEGY_VERSION = 'dispatch-admin-orchestrator-v1.1.0'

const AGENTS = [
  {
    id: 'codex-gpt55',
    name: 'Codex-GPT5.5 全栈工程执行',
    short: 'Codex-GPT5.5',
    role: '工程执行主力',
    color: 'emerald',
    boundary: 'Codex 作为工程执行载体、GPT5.5 为底层推理引擎，二者绑定为单一调度单元，禁止拆分选型。',
    bestFor: ['需求拆解后落地实现', '全栈混合开发', '读写文件', '运行自测', '中小型项目端到端交付', 'API 批量生成', '老旧脚本重构'],
    avoid: ['百万行超大仓库一次性全局解析', '深度代码安全审计', '极简低成本运维脚本'],
  },
  {
    id: 'claude-opus48',
    name: 'Claude Code Opus4.8',
    short: 'Claude Opus4.8',
    role: '超长上下文 / 架构审计',
    color: 'violet',
    boundary: '适合高复杂度工程阅读、跨模块架构重构、漏洞合规审计与长方案推演。',
    bestFor: ['百万行代码库全量读取', '跨模块大型架构重构', '代码漏洞合规深度审计', '复杂业务长方案推演'],
    avoid: ['短任务快速响应', '轻量脚本', '本地 IDE 实时交互'],
  },
  {
    id: 'cursor-composer25',
    name: 'Cursor Composer2.5',
    short: 'Cursor Composer2.5',
    role: 'IDE 局部快速修复',
    color: 'sky',
    boundary: 'IDE 嵌入式轻量编码智能体，适合局部编辑、补全和前端增量迭代。',
    bestFor: ['本地实时代码补全', '单文件局部 bug 快速修复', '前端页面增量迭代', '小模块快速开发'],
    avoid: ['全局架构设计', '完整项目独立交付', '超长上下文深度分析'],
  },
  {
    id: 'workbuddy-lowcode',
    name: 'Workbuddy 轻量化运维低代码工具',
    short: 'Workbuddy',
    role: '低成本运维 / 低代码',
    color: 'amber',
    boundary: '低成本运维、流水线、CI/CD 和低代码表单调度单元。',
    bestFor: ['运维流水线脚本', 'CI/CD 配置', '简易低代码表单', '日常自动化辅助开发'],
    avoid: ['复杂算法', '大型系统架构', '深度代码审计', '完整业务系统搭建'],
  },
  {
    id: 'deepseek-v4-pro-api',
    name: 'DeepSeek V4 Pro 线上 API',
    short: 'DeepSeek V4 Pro',
    role: '规划拆解器 / 批量代码 API',
    color: 'rose',
    boundary: '本页面默认把 DeepSeek V4 Pro 作为任务规划拆解器；必要时也可承接低成本批量代码生成子任务。',
    bestFor: ['任务拆解', '调度规划 JSON 生成', '通用代码生成', '批量接口开发', '国内合规低成本批量任务'],
    avoid: ['超长工程仓库全局分析', '大型重构', '复杂业务多层逻辑推演', '敏感数据原文外发'],
    onlineRisks: ['限流', '超时', '并发峰值报错', '数据传输隐私', '调用链路稳定性'],
  },
]

const AGENT_BY_ID = Object.fromEntries(AGENTS.map((agent) => [agent.id, agent]))

const initialForm = {
  title: '把 Admin 模型调度页改成任务拆解和 agent 分派中枢',
  demand:
    '我需要先调用 DeepSeek V4 Pro 拆解任务，生成任务规划，再把不同子任务分配给 Codex-GPT5.5、Claude Code Opus4.8、Cursor Composer2.5、Workbuddy、DeepSeek V4 Pro 等 agent 去执行，并能追踪执行、审计风险、归档结果。',
  repo: 'tuaran-home-page',
  context: 'Next.js App Router；Admin 页面 owner-only；本地可用 ADMIN_LOCAL_PREVIEW=1 预览。',
  scale: 'medium',
  deadline: '1-3 天',
  cost: 'balanced',
  privacy: 'internal',
  fullRepo: false,
  localIde: true,
  concurrency: 5,
}

const samplePlan = {
  task_info: {
    task_id: 'ADM-DISPATCH-DEMO-001',
    title: initialForm.title,
    strategy_version: STRATEGY_VERSION,
    planner_unit: 'DeepSeek V4 Pro 线上 API',
    status: 'planned',
  },
  planner_summary:
    'DeepSeek V4 Pro 负责把原始需求拆成可执行子任务；执行阶段不把 DeepSeek 当作唯一模型，而是按每个子任务能力边界分派给不同 agent。',
  plan_steps: [
    {
      id: 'P1',
      phase: '需求理解与任务拆解',
      objective: '读取原始需求，拆出可执行环节、依赖关系和风险边界。',
      assigned_agent: 'deepseek-v4-pro-api',
      backup_agent: 'claude-opus48',
      model_rationale: 'DeepSeek V4 Pro 线上 API 适合低成本生成结构化调度 JSON；复杂长方案可由 Claude Code Opus4.8 复核。',
      estimated_tokens: '8K-14K',
      estimated_cost: '低',
      estimated_duration: '2-5 分钟',
      dependencies: [],
      deliverables: ['结构化 plan_steps', '执行顺序', '风险清单'],
      risks: ['线上 API 超时', '输出 JSON 格式漂移', '内部需求传输隐私风险'],
    },
    {
      id: 'P2',
      phase: '工程实现',
      objective: '按规划修改页面和 API，完成可运行的调度中枢。',
      assigned_agent: 'codex-gpt55',
      backup_agent: 'cursor-composer25',
      model_rationale: 'Codex-GPT5.5 擅长全栈实现、端到端交付和自测；Cursor 适合作为局部 UI 修复备用。',
      estimated_tokens: '35K-70K',
      estimated_cost: '中',
      estimated_duration: '0.5-1.5 天',
      dependencies: ['P1'],
      deliverables: ['页面重构', 'planner API', '构建验证'],
      risks: ['实现偏离调度目标', 'API key 暴露', 'UI 信息密度过高'],
    },
    {
      id: 'P3',
      phase: '安全与合规复核',
      objective: '复核 owner gate、API key、DeepSeek 线上 API 隐私和分派规则冲突。',
      assigned_agent: 'claude-opus48',
      backup_agent: 'codex-gpt55',
      model_rationale: 'Claude Code Opus4.8 适合跨模块权限、安全和合规审计；Codex-GPT5.5 可落地修复审计发现。',
      estimated_tokens: '20K-45K',
      estimated_cost: '中高',
      estimated_duration: '2-6 小时',
      dependencies: ['P2'],
      deliverables: ['审计清单', '整改建议', '错配规则'],
      risks: ['权限绕过', '敏感数据外发', 'DeepSeek API 限流或超时未记录'],
    },
    {
      id: 'P4',
      phase: '执行追踪与台账',
      objective: '记录真实 agent、token、成本、耗时、返工、风险等级和归档结果。',
      assigned_agent: 'workbuddy-lowcode',
      backup_agent: 'codex-gpt55',
      model_rationale: 'Workbuddy 适合低成本结构化台账和自动化辅助；复杂持久化或 API 接入由 Codex-GPT5.5 兜底。',
      estimated_tokens: '5K-12K',
      estimated_cost: '低',
      estimated_duration: '1-3 小时',
      dependencies: ['P2', 'P3'],
      deliverables: ['执行追踪字段', '审计归档 JSON', '策略迭代依据'],
      risks: ['只规划不闭环', '缺少真实消耗记录'],
    },
  ],
  subtasks: [
    {
      id: 'T1',
      title: '重构页面信息架构',
      goal: '把页面首屏从模型选型说明改成 DeepSeek 规划器和 agent 分派看板。',
      assigned_agent: 'codex-gpt55',
      backup_agent: 'cursor-composer25',
      priority: 'P0',
      status: 'todo',
      reason: '涉及 Next 页面重构、文件读写和构建验证，匹配 Codex-GPT5.5 工程执行能力。',
      prompt:
        '读取 /admin/model-dispatch 页面现状，重构为任务录入、DeepSeek 规划调用、agent 分派看板、审计归档四段式体验，保留 Admin 视觉体系并运行 build。',
      inputs: ['当前页面组件', '用户原始需求', 'Admin UI 组件'],
      deliverables: ['新的调度控制台 UI', '清晰的 DeepSeek → agents 工作流'],
      risks: ['误把 Codex 与 GPT5.5 拆分', '页面继续像静态说明页'],
      estimated_tokens: '35K-70K',
      estimated_cost: '中',
      estimated_duration: '0.5-1.5 天',
    },
    {
      id: 'T2',
      title: '新增 DeepSeek planner API',
      goal: '后端 owner-only 调用 DeepSeek V4 Pro，返回结构化任务规划 JSON。',
      assigned_agent: 'codex-gpt55',
      backup_agent: 'deepseek-v4-pro-api',
      priority: 'P0',
      status: 'todo',
      reason: '需要新增 API route、环境变量校验、JSON 解析和错误处理，匹配 Codex-GPT5.5。',
      prompt:
        '新增 /api/admin/model-dispatch/plan，读取 DEEPSEEK_API_KEY，调用 DeepSeek chat completions，强制返回 JSON，不在客户端暴露 key。',
      inputs: ['DEEPSEEK_API_KEY', '任务原文', '约束参数'],
      deliverables: ['owner-only planner endpoint', '错误态：缺 key、限流、超时、JSON 解析失败'],
      risks: ['线上 API 超时', '限流', '敏感数据传输'],
      estimated_tokens: '15K-30K',
      estimated_cost: '中',
      estimated_duration: '2-4 小时',
    },
    {
      id: 'T3',
      title: '补齐执行审计字段',
      goal: '为每个子任务记录实际 agent、耗时、成本、返工、风险和完成状态。',
      assigned_agent: 'workbuddy-lowcode',
      backup_agent: 'codex-gpt55',
      priority: 'P1',
      status: 'todo',
      reason: '结构化表单和低成本台账适合 Workbuddy；复杂持久化再交给 Codex-GPT5.5。',
      prompt:
        '根据子任务列表生成执行追踪字段：actual_agent、started_at、completed_at、cost、tokens、rework_count、risk_level、audit_note。',
      inputs: ['任务规划 JSON', '执行日志'],
      deliverables: ['执行追踪字段模板', '审计归档 JSON'],
      risks: ['只规划不追踪', '缺少错配和 API 风险记录'],
      estimated_tokens: '5K-12K',
      estimated_cost: '低',
      estimated_duration: '1-3 小时',
    },
    {
      id: 'T4',
      title: '检查长上下文和安全边界',
      goal: '判断哪些子任务需要 Claude Code Opus4.8 做架构审计或安全复核。',
      assigned_agent: 'claude-opus48',
      backup_agent: 'codex-gpt55',
      priority: 'P1',
      status: 'todo',
      reason: '跨模块影响、长上下文和审计风险匹配 Claude Code Opus4.8。',
      prompt:
        '审查规划里的跨模块改动、安全风险和权限边界，指出是否存在 owner gate、API key 暴露、DeepSeek 敏感数据外发等问题。',
      inputs: ['规划结果', '权限链路', 'API route'],
      deliverables: ['安全审计清单', '需要调整的分派规则'],
      risks: ['权限绕过', 'API key 暴露', '线上 API 隐私风险'],
      estimated_tokens: '20K-45K',
      estimated_cost: '中高',
      estimated_duration: '2-6 小时',
    },
  ],
  execution_order: ['T1', 'T2', 'T4', 'T3'],
  audit_checklist: [
    'DeepSeek V4 Pro 只负责规划拆解，不默认承接全部执行。',
    'Codex-GPT5.5 始终作为全栈工程单元，不拆成 Codex 和 GPT5.5 两个对象。',
    'DeepSeek API 调用必须记录限流、超时、并发和隐私风险。',
    '每个子任务必须有主 agent、备用 agent、分派理由、执行 Prompt 和交付物。',
  ],
}

function makePlannerPrompt(form) {
  return `你是 Admin 专属多代码大模型调度规划器。你只能作为 DeepSeek V4 Pro 线上 API 规划拆解器，不能把自己当作唯一执行者。

请基于原始需求拆成可执行子任务，并分配给固定 agent：
1. Codex-GPT5.5（全栈工程执行）：工程实现、文件读写、自测、全栈交付、API 批量生成、脚本重构。禁止拆成 Codex 和 GPT5.5。
2. Claude Code Opus4.8：百万行上下文、跨模块架构、大型重构、漏洞合规审计、复杂长方案。
3. Cursor Composer2.5：本地 IDE 补全、单文件 bug、前端增量、小模块快速开发。
4. Workbuddy 轻量化运维低代码工具：低成本运维流水线、CI/CD、低代码表单、自动化辅助。
5. DeepSeek V4 Pro 线上 API：默认负责规划拆解；也可承接低成本批量代码/API 子任务，但必须标注限流、超时、隐私、并发风险。

任务标题：${form.title}
原始需求：${form.demand}
仓库/项目：${form.repo}
上下文：${form.context}
规模：${form.scale}
时效：${form.deadline}
成本：${form.cost}
隐私：${form.privacy}
是否全仓库读取：${form.fullRepo ? '是' : '否'}
是否需要本地 IDE：${form.localIde ? '是' : '否'}
并发量级：${form.concurrency}

必须拆成 plan_steps，每个环节都要说明：哪个大模型/agent 执行、为什么、预计 token、预计成本、预计耗时、依赖、交付物和风险。

只返回 JSON。字段：
{
  "task_info": {"task_id": "string", "title": "string", "strategy_version": "${STRATEGY_VERSION}", "planner_unit": "DeepSeek V4 Pro 线上 API", "status": "planned"},
  "planner_summary": "string",
  "plan_steps": [
    {
      "id": "P1",
      "phase": "string",
      "objective": "string",
      "assigned_agent": "codex-gpt55 | claude-opus48 | cursor-composer25 | workbuddy-lowcode | deepseek-v4-pro-api",
      "backup_agent": "codex-gpt55 | claude-opus48 | cursor-composer25 | workbuddy-lowcode | deepseek-v4-pro-api",
      "model_rationale": "必须绑定 agent 能力边界或 DeepSeek API 风险",
      "estimated_tokens": "例如 20K-40K",
      "estimated_cost": "低 | 中 | 中高 | 高，或给出区间",
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
      "estimated_cost": "低 | 中 | 中高 | 高，或给出区间",
      "estimated_duration": "例如 2-6 小时"
    }
  ],
  "execution_order": ["T1"],
  "audit_checklist": ["string"]
}`
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== 'object') return samplePlan
  const rawPlanSteps = Array.isArray(plan.plan_steps) ? plan.plan_steps : []
  const subtasks = Array.isArray(plan.subtasks) ? plan.subtasks : rawPlanSteps
  return {
    ...samplePlan,
    ...plan,
    task_info: { ...samplePlan.task_info, ...(plan.task_info || {}) },
    plan_steps: (rawPlanSteps.length ? rawPlanSteps : samplePlan.plan_steps).map((step, index) => ({
      id: step.id || `P${index + 1}`,
      phase: step.phase || step.title || `环节 ${index + 1}`,
      objective: step.objective || step.goal || '',
      assigned_agent: AGENT_BY_ID[step.assigned_agent] ? step.assigned_agent : 'codex-gpt55',
      backup_agent: AGENT_BY_ID[step.backup_agent] ? step.backup_agent : 'codex-gpt55',
      model_rationale: step.model_rationale || step.reason || '',
      estimated_tokens: step.estimated_tokens || step.token_estimate || '待估',
      estimated_cost: step.estimated_cost || step.cost_estimate || '待估',
      estimated_duration: step.estimated_duration || step.duration_estimate || '待估',
      dependencies: Array.isArray(step.dependencies) ? step.dependencies : [],
      deliverables: Array.isArray(step.deliverables) ? step.deliverables : [],
      risks: Array.isArray(step.risks) ? step.risks : [],
    })),
    subtasks: subtasks.map((task, index) => ({
      id: task.id || `T${index + 1}`,
      title: task.title || task.phase || '未命名子任务',
      goal: task.goal || task.objective || '',
      assigned_agent: AGENT_BY_ID[task.assigned_agent] ? task.assigned_agent : 'codex-gpt55',
      backup_agent: AGENT_BY_ID[task.backup_agent] ? task.backup_agent : 'codex-gpt55',
      priority: task.priority || 'P1',
      status: task.status || 'todo',
      reason: task.reason || task.model_rationale || '',
      prompt: task.prompt || '',
      inputs: Array.isArray(task.inputs) ? task.inputs : [],
      deliverables: Array.isArray(task.deliverables) ? task.deliverables : [],
      risks: Array.isArray(task.risks) ? task.risks : [],
      estimated_tokens: task.estimated_tokens || task.token_estimate || '待估',
      estimated_cost: task.estimated_cost || task.cost_estimate || '待估',
      estimated_duration: task.estimated_duration || task.duration_estimate || '待估',
    })),
  }
}

function riskTone(task) {
  const text = [...(task.risks || []), task.reason || ''].join(' ')
  if (/敏感|泄露|权限|超时|限流|并发|安全|审计/.test(text)) return '高'
  if (/成本|返工|复杂|跨模块/.test(text)) return '中'
  return '低'
}

function groupTasks(subtasks) {
  return AGENTS.map((agent) => ({
    agent,
    tasks: subtasks.filter((task) => task.assigned_agent === agent.id),
  }))
}

function buildArchive(form, plan) {
  return {
    task_info: plan.task_info,
    deepseek_planner: {
      model: 'DeepSeek V4 Pro 线上 API',
      role: '任务拆解与调度规划，不是唯一执行者',
      prompt: makePlannerPrompt(form),
    },
    plan_steps: (plan.plan_steps || []).map((step) => ({
      id: step.id,
      phase: step.phase,
      assigned_agent: AGENT_BY_ID[step.assigned_agent]?.name,
      backup_agent: AGENT_BY_ID[step.backup_agent]?.name,
      model_rationale: step.model_rationale,
      estimated_tokens: step.estimated_tokens,
      estimated_cost: step.estimated_cost,
      estimated_duration: step.estimated_duration,
      dependencies: step.dependencies,
      deliverables: step.deliverables,
      risks: step.risks,
    })),
    dispatch_plan: plan.subtasks.map((task) => ({
      id: task.id,
      title: task.title,
      assigned_agent: AGENT_BY_ID[task.assigned_agent]?.name,
      backup_agent: AGENT_BY_ID[task.backup_agent]?.name,
      priority: task.priority,
      reason: task.reason,
      estimated_tokens: task.estimated_tokens,
      estimated_cost: task.estimated_cost,
      estimated_duration: task.estimated_duration,
      prompt: task.prompt,
      deliverables: task.deliverables,
      risk_level: riskTone(task),
    })),
    execution_tracking_template: plan.subtasks.map((task) => ({
      task_id: task.id,
      actual_agent: '',
      status: 'todo',
      started_at: '',
      completed_at: '',
      actual_tokens: '',
      actual_cost: '',
      actual_duration: '',
      rework_count: 0,
      audit_note: '',
    })),
    audit_checklist: plan.audit_checklist || [],
  }
}

export default function ModelDispatchConsole() {
  const [form, setForm] = useState(initialForm)
  const [plan, setPlan] = useState(samplePlan)
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(samplePlan.subtasks[0]?.id || '')

  const normalizedPlan = useMemo(() => normalizePlan(plan), [plan])
  const groups = useMemo(() => groupTasks(normalizedPlan.subtasks), [normalizedPlan])
  const selectedTask = normalizedPlan.subtasks.find((task) => task.id === selectedTaskId) || normalizedPlan.subtasks[0]
  const archive = useMemo(() => buildArchive(form, normalizedPlan), [form, normalizedPlan])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function callDeepSeekPlanner() {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/admin/model-dispatch/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ task: form, strategyVersion: STRATEGY_VERSION }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.plan) throw new Error(data?.error || data?.detail || `HTTP_${res.status}`)
      const nextPlan = normalizePlan(data.plan)
      setPlan(nextPlan)
      setRaw(data.raw || JSON.stringify(nextPlan, null, 2))
      setSelectedTaskId(nextPlan.subtasks[0]?.id || '')
      setStatus('done')
    } catch (err) {
      setError(err?.message || 'DEEPSEEK_PLAN_FAILED')
      setStatus('error')
    }
  }

  function useDemoPlan() {
    setPlan(samplePlan)
    setRaw(JSON.stringify(samplePlan, null, 2))
    setSelectedTaskId(samplePlan.subtasks[0]?.id || '')
    setError('')
    setStatus('demo')
  }

  return (
    <AdminPage
      title="DeepSeek 任务规划与 Agent 分派"
      maxWidth="1280px"
      description="本页的核心不是静态选型，而是先调用 DeepSeek V4 Pro 拆解任务，再把子任务按能力边界分派给不同执行 agent，并记录执行、风险与审计。"
    >
      <div className="space-y-5">
        <section className="grid gap-3 lg:grid-cols-4">
          <FlowStep index="1" title="录入需求" body="填写原始任务、仓库、上下文、隐私、时效和并发约束。" />
          <FlowStep index="2" title="DeepSeek 拆解" body="服务端调用 DeepSeek V4 Pro，输出结构化任务图和分派建议。" active />
          <FlowStep index="3" title="分派 Agent" body="Codex-GPT5.5、Claude、Cursor、Workbuddy、DeepSeek 分别承接适配任务。" />
          <FlowStep index="4" title="追踪审计" body="记录真实成本、返工、风险、错配和 DeepSeek API 链路问题。" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Section
            title="任务录入"
            description="这部分是给 DeepSeek V4 Pro 的规划输入，不是直接给执行 agent 的任务。"
            actions={
              <button
                type="button"
                onClick={callDeepSeekPlanner}
                disabled={status === 'loading'}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#15140f] px-3 text-sm font-medium text-white transition hover:bg-[#2f3027] disabled:opacity-50 dark:bg-gray-100 dark:text-[#111827]"
              >
                {status === 'loading' ? 'DeepSeek 规划中...' : '调用 DeepSeek 拆解'}
              </button>
            }
          >
            <div className="space-y-3">
              <Field label="任务标题">
                <input value={form.title} onChange={(event) => update('title', event.target.value)} className={inputClass} />
              </Field>
              <Field label="原始需求">
                <textarea value={form.demand} onChange={(event) => update('demand', event.target.value)} rows={7} className={inputClass} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="仓库 / 项目">
                  <input value={form.repo} onChange={(event) => update('repo', event.target.value)} className={inputClass} />
                </Field>
                <Field label="工程规模">
                  <select value={form.scale} onChange={(event) => update('scale', event.target.value)} className={inputClass}>
                    <option value="small">小型局部任务</option>
                    <option value="medium">中型功能交付</option>
                    <option value="large">跨模块大型任务</option>
                    <option value="mega">百万行超大仓库</option>
                  </select>
                </Field>
                <Field label="交付时效">
                  <select value={form.deadline} onChange={(event) => update('deadline', event.target.value)} className={inputClass}>
                    <option>当天</option>
                    <option>1-3 天</option>
                    <option>允许深度推演</option>
                  </select>
                </Field>
                <Field label="成本策略">
                  <select value={form.cost} onChange={(event) => update('cost', event.target.value)} className={inputClass}>
                    <option value="low">低成本优先</option>
                    <option value="balanced">成本质量平衡</option>
                    <option value="quality">质量优先</option>
                  </select>
                </Field>
                <Field label="隐私等级">
                  <select value={form.privacy} onChange={(event) => update('privacy', event.target.value)} className={inputClass}>
                    <option value="public">公开 / 可外发</option>
                    <option value="internal">内部代码</option>
                    <option value="sensitive">敏感数据 / 客户代码</option>
                  </select>
                </Field>
                <Field label="并发量级">
                  <input type="number" min="1" value={form.concurrency} onChange={(event) => update('concurrency', event.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="上下文补充">
                <textarea value={form.context} onChange={(event) => update('context', event.target.value)} rows={3} className={inputClass} />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Toggle label="需要全仓库读取" checked={form.fullRepo} onChange={(value) => update('fullRepo', value)} />
                <Toggle label="需要本地 IDE 开发" checked={form.localIde} onChange={(value) => update('localIde', value)} />
              </div>
              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                  {error === 'MISSING_DEEPSEEK_API_KEY'
                    ? '缺少 DEEPSEEK_API_KEY，先在本地或 Cloudflare 环境变量里配置后再调用。'
                    : error}
                  <button type="button" onClick={useDemoPlan} className="ml-2 underline underline-offset-2">
                    先看示例规划
                  </button>
                </div>
              ) : null}
            </div>
          </Section>

          <Section title="DeepSeek 规划输出" description="这里展示 DeepSeek 返回的任务图；你可以直接复制给不同 agent 去执行。">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Planner" value="DeepSeek V4 Pro" />
              <Metric label="子任务" value={`${normalizedPlan.subtasks.length} 个`} />
              <Metric label="策略版本" value={normalizedPlan.task_info?.strategy_version || STRATEGY_VERSION} />
            </div>
            <div className="rounded-lg border border-[#e2e3da] bg-[#f8f9f4] p-3 text-sm leading-6 text-[#51514a] dark:border-[#263241] dark:bg-[#0d131c] dark:text-gray-300">
              <b className="text-[#15140f] dark:text-gray-100">规划摘要：</b>
              {normalizedPlan.planner_summary}
            </div>
            <ol className="mt-4 space-y-2">
              {(normalizedPlan.execution_order || []).map((id, index) => {
                const task = normalizedPlan.subtasks.find((item) => item.id === id)
                if (!task) return null
                const agent = AGENT_BY_ID[task.assigned_agent]
                return (
                  <li key={id} className="flex items-start gap-3 rounded-lg border border-[#e2e3da] px-3 py-2 text-sm dark:border-[#263241]">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#15140f] text-xs text-white dark:bg-gray-100 dark:text-[#111827]">{index + 1}</span>
                    <div>
                      <button type="button" onClick={() => setSelectedTaskId(task.id)} className="text-left font-semibold text-[#15140f] underline-offset-2 hover:underline dark:text-gray-100">
                        {task.id} · {task.title}
                      </button>
                      <p className="mb-0 mt-0.5 text-[#67695d] dark:text-gray-400">{agent?.name} · {task.priority} · 风险 {riskTone(task)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Section>
        </section>

        <Section title="Agent 分派看板" description="DeepSeek 规划之后，真正的执行任务按 agent 能力边界拆开管理。">
          <div className="grid gap-3 lg:grid-cols-5">
            {groups.map(({ agent, tasks }) => (
              <div key={agent.id} className="rounded-lg border border-[#e2e3da] bg-white/70 p-3 dark:border-[#263241] dark:bg-[#0d131c]">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{agent.short}</p>
                  <p className="mt-0.5 text-[12px] text-[#67695d] dark:text-gray-400">{agent.role}</p>
                </div>
                <div className="space-y-2">
                  {tasks.length ? tasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selectedTask?.id === task.id ? 'border-[#15140f] bg-[#f4f6ee] dark:border-gray-100 dark:bg-[#172033]' : 'border-[#eceee6] hover:border-[#b9bbad] dark:border-[#1b2430] dark:hover:border-[#3c495a]'}`}
                    >
                      <span className="font-mono text-[11px] text-[#767869] dark:text-[#8e9ab0]">{task.id} · {task.priority}</span>
                      <span className="mt-1 block font-semibold text-[#15140f] dark:text-gray-100">{task.title}</span>
                      <span className="mt-1 block text-[12px] text-[#67695d] dark:text-gray-400">风险 {riskTone(task)}</span>
                    </button>
                  )) : (
                    <p className="rounded-lg border border-dashed border-[#e2e3da] px-3 py-4 text-center text-[12px] text-[#9a9c8e] dark:border-[#263241] dark:text-[#5d6b80]">暂无分派</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="调度 Plan" description="DeepSeek 必须把任务拆成环节，并给出每个环节使用的大模型、依据、预估 token、成本和耗时。">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-[0.12em] text-[#7a7c70] dark:text-[#8e9ab0]">
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">环节</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">主模型 / 备用</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">选型依据</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">预估消耗</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">交付物 / 风险</th>
                </tr>
              </thead>
              <tbody>
                {(normalizedPlan.plan_steps || []).map((step) => {
                  const primary = AGENT_BY_ID[step.assigned_agent]
                  const backup = AGENT_BY_ID[step.backup_agent]
                  return (
                    <tr key={step.id}>
                      <td className="border-b border-[#eceee6] px-3 py-3 align-top dark:border-[#1b2430]">
                        <div className="font-mono text-[11px] text-[#767869] dark:text-[#8e9ab0]">{step.id}</div>
                        <div className="mt-1 font-semibold text-[#15140f] dark:text-gray-100">{step.phase}</div>
                        <p className="mb-0 mt-1 text-[#56564e] dark:text-gray-300">{step.objective}</p>
                        {step.dependencies?.length ? (
                          <p className="mb-0 mt-1 text-[12px] text-[#858779] dark:text-[#8e9ab0]">依赖：{step.dependencies.join(' / ')}</p>
                        ) : null}
                      </td>
                      <td className="border-b border-[#eceee6] px-3 py-3 align-top dark:border-[#1b2430]">
                        <b className="block text-[#15140f] dark:text-gray-100">{primary?.name || step.assigned_agent}</b>
                        <span className="mt-1 block text-[12px] text-[#67695d] dark:text-gray-400">备用：{backup?.name || step.backup_agent}</span>
                      </td>
                      <td className="border-b border-[#eceee6] px-3 py-3 align-top leading-6 text-[#56564e] dark:border-[#1b2430] dark:text-gray-300">
                        {step.model_rationale || '待补充'}
                      </td>
                      <td className="border-b border-[#eceee6] px-3 py-3 align-top dark:border-[#1b2430]">
                        <div className="space-y-1 text-[12.5px] text-[#51514a] dark:text-gray-300">
                          <p className="mb-0"><b>Token：</b>{step.estimated_tokens}</p>
                          <p className="mb-0"><b>成本：</b>{step.estimated_cost}</p>
                          <p className="mb-0"><b>耗时：</b>{step.estimated_duration}</p>
                        </div>
                      </td>
                      <td className="border-b border-[#eceee6] px-3 py-3 align-top text-[12.5px] leading-6 dark:border-[#1b2430]">
                        <p className="mb-1 text-emerald-700 dark:text-emerald-300">交付：{step.deliverables?.join(' / ') || '待补充'}</p>
                        <p className="mb-0 text-amber-700 dark:text-amber-300">风险：{step.risks?.join(' / ') || '无显著风险'}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {selectedTask ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Section title={`${selectedTask.id} · ${selectedTask.title}`} description="这是可复制给对应执行 agent 的任务卡。">
              <div className="space-y-3 text-sm leading-6 text-[#51514a] dark:text-gray-300">
                <Info label="目标" value={selectedTask.goal} />
                <Info label="主 Agent" value={AGENT_BY_ID[selectedTask.assigned_agent]?.name || selectedTask.assigned_agent} />
                <Info label="备用 Agent" value={AGENT_BY_ID[selectedTask.backup_agent]?.name || selectedTask.backup_agent} />
                <Info label="分派依据" value={selectedTask.reason} />
                <Info label="预估 Token" value={selectedTask.estimated_tokens} />
                <Info label="预估成本" value={selectedTask.estimated_cost} />
                <Info label="预估耗时" value={selectedTask.estimated_duration} />
                <Info label="输入" value={(selectedTask.inputs || []).join(' / ') || '待补充'} />
                <Info label="交付物" value={(selectedTask.deliverables || []).join(' / ') || '待补充'} />
                <Info label="风险" value={(selectedTask.risks || []).join(' / ') || '无显著风险'} />
              </div>
            </Section>
            <Section title="执行 Prompt" description="把这段发给被分派的 agent，执行完成后再回填审计字段。">
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#0f172a] p-4 text-[12.5px] leading-6 text-slate-100 dark:border-[#263241]">
                {selectedTask.prompt}
              </pre>
            </Section>
          </section>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-2">
          <Section title="Agent 能力边界" description="DeepSeek 规划时必须按这些边界分派，不允许把所有任务都塞给一个模型。">
            <div className="space-y-3">
              {AGENTS.map((agent) => (
                <details key={agent.id} className="rounded-lg border border-[#e2e3da] px-3 py-2 dark:border-[#263241]">
                  <summary className="cursor-pointer text-sm font-semibold text-[#15140f] dark:text-gray-100">{agent.name}</summary>
                  <p className="mt-2 text-[12.5px] leading-6 text-[#56564e] dark:text-gray-300">{agent.boundary}</p>
                  <p className="mt-2 text-[12px] text-emerald-700 dark:text-emerald-300">适合：{agent.bestFor.join(' / ')}</p>
                  <p className="mt-1 text-[12px] text-amber-700 dark:text-amber-300">避免：{agent.avoid.join(' / ')}</p>
                  {agent.onlineRisks ? <p className="mt-1 text-[12px] text-rose-700 dark:text-rose-300">线上 API 风险：{agent.onlineRisks.join(' / ')}</p> : null}
                </details>
              ))}
            </div>
          </Section>

          <Section title="归档 JSON" description="用于入库、导出、执行追踪和复盘。">
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#0f172a] p-4 text-[12px] leading-6 text-slate-100 dark:border-[#263241]">
              {JSON.stringify(archive, null, 2)}
            </pre>
          </Section>
        </section>

        <Section title="DeepSeek 原始返回" description="调试 DeepSeek 输出格式时使用；未调用时显示示例规划。">
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#f8f9f4] p-4 text-[12px] leading-6 text-[#303126] dark:border-[#263241] dark:bg-[#0d131c] dark:text-gray-200">
            {raw || JSON.stringify(samplePlan, null, 2)}
          </pre>
        </Section>
      </div>
    </AdminPage>
  )
}

const inputClass =
  'w-full rounded-lg border border-[#d5d7cd] bg-white px-3 py-2 text-sm text-[#15140f] outline-none transition focus:border-[#818472] focus:ring-2 focus:ring-[#dfe3d2] dark:border-[#2d3744] dark:bg-[#0d131c] dark:text-gray-100 dark:focus:border-[#5f6f86] dark:focus:ring-[#1d2a3a]'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[#67695d] dark:text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-[#e6e7df] px-3 py-2 text-sm text-[#51514a] dark:border-[#263241] dark:text-gray-300">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#5b6f3a]" />
    </label>
  )
}

function FlowStep({ index, title, body, active = false }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${active ? 'border-[#15140f] bg-[#f4f6ee] dark:border-gray-100 dark:bg-[#172033]' : 'border-[#e2e3da] bg-white dark:border-[#263241] dark:bg-[#10161f]'}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#15140f] text-xs font-semibold text-white dark:bg-gray-100 dark:text-[#111827]">{index}</span>
        <h2 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{title}</h2>
      </div>
      <p className="mb-0 mt-2 text-[12.5px] leading-6 text-[#56564e] dark:text-gray-300">{body}</p>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e2e3da] bg-white px-3 py-2 dark:border-[#263241] dark:bg-[#10161f]">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-[#8e9ab0]">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-[#15140f] dark:text-gray-100">{value}</div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e2e3da] px-3 py-2 dark:border-[#263241]">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#858779] dark:text-[#8e9ab0]">{label}</span>
      <p className="mb-0 mt-1 text-[#303126] dark:text-gray-200">{value}</p>
    </div>
  )
}
