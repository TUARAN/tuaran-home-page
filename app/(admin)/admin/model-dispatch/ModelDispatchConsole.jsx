'use client'

import { useMemo, useState } from 'react'

import { AdminPage, Section } from '../../components/ui'

const STRATEGY_VERSION = 'dispatch-admin-orchestrator-v1.2.0'

const AGENTS = [
  {
    id: 'codex-gpt55',
    name: 'Codex-GPT5.5 全栈工程执行',
    short: 'Codex-GPT5.5',
    role: '工程执行主力',
    boundary: 'Codex 作为工程执行载体、GPT5.5 为底层推理引擎，二者绑定为单一调度单元，禁止拆分。',
    bestFor: ['全栈混合开发', '读写文件', '运行自测', '中小型项目端到端交付', 'API 批量生成', '脚本重构'],
    avoid: ['百万行仓库一次性全局解析', '深度代码安全审计', '极简低成本脚本'],
  },
  {
    id: 'claude-opus48',
    name: 'Claude Code Opus4.8',
    short: 'Claude Opus4.8',
    role: '长上下文 / 架构审计',
    boundary: '适合超长上下文、大型架构重构、漏洞合规审计与复杂长方案推演。',
    bestFor: ['百万行代码库全量读取', '跨模块大型重构', '代码漏洞合规审计', '复杂业务长方案'],
    avoid: ['短任务快速响应', '轻量脚本', '本地 IDE 实时交互'],
  },
  {
    id: 'cursor-composer25',
    name: 'Cursor Composer2.5',
    short: 'Cursor Composer2.5',
    role: 'IDE 局部快速修复',
    boundary: 'IDE 嵌入式轻量编码智能体，适合局部编辑、补全和前端增量迭代。',
    bestFor: ['本地实时代码补全', '单文件 bug', '前端增量迭代', '小模块快速开发'],
    avoid: ['全局架构设计', '完整项目独立交付', '超长上下文深度分析'],
  },
  {
    id: 'workbuddy-lowcode',
    name: 'Workbuddy 轻量化运维低代码工具',
    short: 'Workbuddy',
    role: '低成本运维 / 低代码',
    boundary: '适合低成本运维流水线、CI/CD、低代码表单和日常自动化。',
    bestFor: ['运维脚本', 'CI/CD 配置', '低代码表单', '自动化辅助'],
    avoid: ['复杂算法', '大型系统架构', '深度代码审计', '完整业务系统搭建'],
  },
  {
    id: 'deepseek-v4-pro-api',
    name: 'DeepSeek V4 Pro 线上 API',
    short: 'DeepSeek V4 Pro',
    role: '规划拆解器 / 批量 API',
    boundary: '本页默认用它做流式任务拆解和调度规划；也可承接低成本批量代码/API 子任务。',
    bestFor: ['流式任务拆解', '调度计划 JSON', '通用代码生成', '批量接口开发', '低成本批量任务'],
    avoid: ['超长仓库全局分析', '大型重构', '复杂业务多层逻辑推演', '敏感数据原文外发'],
    onlineRisks: ['限流', '超时', '并发峰值报错', '数据传输隐私', '调用链路稳定性'],
  },
]

const AGENT_BY_ID = Object.fromEntries(AGENTS.map((agent) => [agent.id, agent]))

const emptyPlan = {
  task_info: {
    task_id: '',
    title: '',
    strategy_version: STRATEGY_VERSION,
    planner_unit: 'DeepSeek V4 Pro 线上 API',
    status: 'draft',
  },
  planner_summary: '',
  plan_steps: [],
  subtasks: [],
  execution_order: [],
  audit_checklist: [],
}

const initialForm = {
  title: '',
  demand: '',
  repo: '',
  context: '',
  scale: 'medium',
  deadline: '1-3 天',
  cost: 'balanced',
  privacy: 'internal',
  fullRepo: false,
  localIde: false,
  concurrency: 1,
}

function normalizePlan(plan) {
  if (!plan || typeof plan !== 'object') return emptyPlan
  const rawSteps = Array.isArray(plan.plan_steps) ? plan.plan_steps : []
  const rawTasks = Array.isArray(plan.subtasks) ? plan.subtasks : []
  return {
    ...emptyPlan,
    ...plan,
    task_info: { ...emptyPlan.task_info, ...(plan.task_info || {}) },
    plan_steps: rawSteps.map((step, index) => ({
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
    subtasks: rawTasks.map((task, index) => ({
      id: task.id || `T${index + 1}`,
      title: task.title || task.phase || `任务 ${index + 1}`,
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

function riskTone(item) {
  const text = [...(item.risks || []), item.reason || item.model_rationale || ''].join(' ')
  if (/敏感|泄露|权限|超时|限流|并发|安全|审计|API key/i.test(text)) return '高'
  if (/成本|返工|复杂|跨模块|大型/i.test(text)) return '中'
  return '低'
}

function groupTasks(subtasks) {
  return AGENTS.map((agent) => ({
    agent,
    tasks: subtasks.filter((task) => task.assigned_agent === agent.id),
  }))
}

function makeArchive(form, plan) {
  return {
    task_info: plan.task_info,
    planner: {
      model: 'DeepSeek V4 Pro 线上 API',
      strategy_version: STRATEGY_VERSION,
      streaming: true,
    },
    input: form,
    plan_steps: plan.plan_steps.map((step) => ({
      ...step,
      assigned_agent_name: AGENT_BY_ID[step.assigned_agent]?.name || step.assigned_agent,
      backup_agent_name: AGENT_BY_ID[step.backup_agent]?.name || step.backup_agent,
      risk_level: riskTone(step),
    })),
    subtasks: plan.subtasks.map((task) => ({
      ...task,
      assigned_agent_name: AGENT_BY_ID[task.assigned_agent]?.name || task.assigned_agent,
      backup_agent_name: AGENT_BY_ID[task.backup_agent]?.name || task.backup_agent,
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

function taskText(task) {
  return JSON.stringify(
    {
      id: task.id,
      title: task.title,
      goal: task.goal,
      assigned_agent: AGENT_BY_ID[task.assigned_agent]?.name || task.assigned_agent,
      backup_agent: AGENT_BY_ID[task.backup_agent]?.name || task.backup_agent,
      reason: task.reason,
      estimated_tokens: task.estimated_tokens,
      estimated_cost: task.estimated_cost,
      estimated_duration: task.estimated_duration,
      prompt: task.prompt,
      deliverables: task.deliverables,
      risks: task.risks,
    },
    null,
    2
  )
}

function formatStreamError(payload) {
  const parts = []
  if (payload?.error) parts.push(payload.error)
  if (payload?.phase) parts.push(`phase=${payload.phase}`)
  if (payload?.status) parts.push(`HTTP_${payload.status}`)
  if (payload?.detail) parts.push(payload.detail)
  if (payload?.rawPreview) parts.push(`raw=${payload.rawPreview}`)
  return parts.filter(Boolean).join(' · ') || 'DEEPSEEK_STREAM_FAILED'
}

export default function ModelDispatchConsole() {
  const [form, setForm] = useState(initialForm)
  const [plan, setPlan] = useState(emptyPlan)
  const [raw, setRaw] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [copied, setCopied] = useState('')

  const normalizedPlan = useMemo(() => normalizePlan(plan), [plan])
  const groups = useMemo(() => groupTasks(normalizedPlan.subtasks), [normalizedPlan.subtasks])
  const selectedTask = normalizedPlan.subtasks.find((task) => task.id === selectedTaskId) || normalizedPlan.subtasks[0] || null
  const archive = useMemo(() => makeArchive(form, normalizedPlan), [form, normalizedPlan])
  const hasPlan = normalizedPlan.plan_steps.length > 0 || normalizedPlan.subtasks.length > 0

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value || '')
      setCopied(label)
      setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('复制失败')
      setTimeout(() => setCopied(''), 1600)
    }
  }

  function handleStreamEvent(event, payload) {
    if (event === 'start') {
      setRaw('')
      setStatus('streaming')
      return
    }
    if (event === 'delta') {
      setRaw((prev) => `${prev}${payload?.text || ''}`)
      return
    }
    if (event === 'done') {
      const nextPlan = normalizePlan(payload?.plan)
      setPlan(nextPlan)
      setRaw(payload?.raw || '')
      setSelectedTaskId(nextPlan.subtasks[0]?.id || '')
      setStatus('done')
      return
    }
    if (event === 'error') {
      setError(formatStreamError(payload))
      setStatus('error')
    }
  }

  async function callDeepSeekPlanner() {
    setStatus('loading')
    setError('')
    setPlan(emptyPlan)
    setRaw('')
    setSelectedTaskId('')

    try {
      const res = await fetch('/api/admin/model-dispatch/plan/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ task: form, strategyVersion: STRATEGY_VERSION }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || data?.detail || `HTTP_${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() || ''
        chunks.forEach((chunk) => {
          const event = chunk.match(/^event:\s*(.+)$/m)?.[1]
          const dataLine = chunk.match(/^data:\s*(.+)$/m)?.[1]
          if (!event || !dataLine) return
          try {
            handleStreamEvent(event, JSON.parse(dataLine))
          } catch {
            // Ignore malformed SSE chunks and keep reading.
          }
        })
      }
    } catch (err) {
      setError(err?.message || 'DEEPSEEK_STREAM_FAILED')
      setStatus('error')
    }
  }

  return (
    <AdminPage
      title="DeepSeek 流式规划与 Agent 分派"
      maxWidth="1280px"
      description="先由 DeepSeek V4 Pro 流式拆解任务，生成按环节组织的 plan；每个环节都要标注执行模型、依据、预估 token、成本和耗时，再分派给对应 agent。"
    >
      <div className="space-y-5">
        <section className="grid gap-3 lg:grid-cols-4">
          <FlowStep index="1" title="录入需求" body="填写任务、仓库、上下文、隐私、时效和并发。" />
          <FlowStep index="2" title="流式规划" body="DeepSeek 边输出边展示，避免长时间白屏。" active={status === 'loading' || status === 'streaming'} />
          <FlowStep index="3" title="环节选型" body="每个 plan 环节都有主模型、备用模型和选型依据。" />
          <FlowStep index="4" title="复制分派" body="复制任务卡或 Prompt，交给对应 agent 执行。" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Section
            title="任务录入"
            description="这里是 DeepSeek 规划输入。点击后会流式输出，页面默认保持空白结果。"
            actions={
              <button
                type="button"
                onClick={callDeepSeekPlanner}
                disabled={status === 'loading' || status === 'streaming' || !form.title.trim() || !form.demand.trim()}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#15140f] px-3 text-sm font-medium text-white transition hover:bg-[#2f3027] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-[#111827]"
              >
                {status === 'loading' || status === 'streaming' ? 'DeepSeek 流式规划中...' : '调用 DeepSeek 生成 Plan'}
              </button>
            }
          >
            <div className="space-y-3">
              <Field label="任务标题">
                <input value={form.title} onChange={(event) => update('title', event.target.value)} className={inputClass} placeholder="例如：重构 Admin 模型调度页" />
              </Field>
              <Field label="原始需求">
                <textarea value={form.demand} onChange={(event) => update('demand', event.target.value)} rows={7} className={inputClass} placeholder="把你要拆解和分派的任务原文贴在这里。" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="仓库 / 项目">
                  <input value={form.repo} onChange={(event) => update('repo', event.target.value)} className={inputClass} placeholder="tuaran-home-page" />
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
                <textarea value={form.context} onChange={(event) => update('context', event.target.value)} rows={3} className={inputClass} placeholder="技术栈、权限边界、已有约束、验收命令等。" />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Toggle label="需要全仓库读取" checked={form.fullRepo} onChange={(value) => update('fullRepo', value)} />
                <Toggle label="需要本地 IDE 开发" checked={form.localIde} onChange={(value) => update('localIde', value)} />
              </div>
              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                  {error}
                </div>
              ) : null}
            </div>
          </Section>

          <Section
            title="DeepSeek 流式输出"
            description="这里实时展示 DeepSeek 正在输出的 JSON。输出结束后会自动解析为下面的调度 Plan。"
            actions={<CopyButton label="raw" onCopy={() => copyText('raw', raw)} copied={copied} disabled={!raw} />}
          >
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Metric label="状态" value={status === 'idle' ? '等待输入' : status === 'done' ? '已生成' : status === 'error' ? '失败' : '流式生成中'} />
              <Metric label="Plan 环节" value={`${normalizedPlan.plan_steps.length} 个`} />
              <Metric label="子任务" value={`${normalizedPlan.subtasks.length} 个`} />
            </div>
            <pre className="min-h-[260px] max-h-[440px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#0f172a] p-4 text-[12px] leading-6 text-slate-100 dark:border-[#263241]">
              {raw || '尚未调用 DeepSeek。填写任务标题和原始需求后点击「调用 DeepSeek 生成 Plan」。'}
            </pre>
          </Section>
        </section>

        <Section title="调度 Plan" description="每个环节都应该能回答：用哪个模型、为什么用、预计消耗多少、风险在哪里。">
          {normalizedPlan.plan_steps.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-[12px] uppercase tracking-[0.12em] text-[#7a7c70] dark:text-[#8e9ab0]">
                    <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">环节</th>
                    <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">主模型 / 备用</th>
                    <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">选型依据</th>
                    <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">预估消耗</th>
                    <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">交付物 / 风险</th>
                    <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedPlan.plan_steps.map((step) => (
                    <PlanRow key={step.id} step={step} copied={copied} onCopy={copyText} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock text="还没有 Plan。DeepSeek 返回后，这里会展示每个环节的大模型、依据和预估消耗。" />
          )}
        </Section>

        <Section title="Agent 分派看板" description="DeepSeek 规划之后，真正执行的子任务按 agent 能力边界拆开。每张任务卡都可复制。">
          {hasPlan ? (
            <div className="grid gap-3 lg:grid-cols-5">
              {groups.map(({ agent, tasks }) => (
                <div key={agent.id} className="rounded-lg border border-[#e2e3da] bg-white/70 p-3 dark:border-[#263241] dark:bg-[#0d131c]">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{agent.short}</p>
                    <p className="mt-0.5 text-[12px] text-[#67695d] dark:text-gray-400">{agent.role}</p>
                  </div>
                  <div className="space-y-2">
                    {tasks.length ? tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`rounded-lg border px-3 py-2 text-sm transition ${selectedTask?.id === task.id ? 'border-[#15140f] bg-[#f4f6ee] dark:border-gray-100 dark:bg-[#172033]' : 'border-[#eceee6] dark:border-[#1b2430]'}`}
                      >
                        <button type="button" onClick={() => setSelectedTaskId(task.id)} className="block w-full text-left">
                          <span className="font-mono text-[11px] text-[#767869] dark:text-[#8e9ab0]">{task.id} · {task.priority}</span>
                          <span className="mt-1 block font-semibold text-[#15140f] dark:text-gray-100">{task.title}</span>
                          <span className="mt-1 block text-[12px] text-[#67695d] dark:text-gray-400">
                            {task.estimated_tokens} · {task.estimated_cost} · {task.estimated_duration}
                          </span>
                        </button>
                        <button type="button" onClick={() => copyText(task.id, taskText(task))} className="mt-2 text-[12px] text-[#53554d] underline underline-offset-2 dark:text-gray-300">
                          {copied === task.id ? '已复制' : '复制任务卡'}
                        </button>
                      </div>
                    )) : (
                      <p className="rounded-lg border border-dashed border-[#e2e3da] px-3 py-4 text-center text-[12px] text-[#9a9c8e] dark:border-[#263241] dark:text-[#5d6b80]">暂无分派</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBlock text="还没有可分派任务。生成 Plan 后，这里会按 agent 自动分列展示。" />
          )}
        </Section>

        {selectedTask ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Section
              title={`${selectedTask.id} · ${selectedTask.title}`}
              description="这是可复制给对应执行 agent 的任务卡。"
              actions={<CopyButton label={selectedTask.id} onCopy={() => copyText(selectedTask.id, taskText(selectedTask))} copied={copied} />}
            >
              <div className="space-y-3 text-sm leading-6 text-[#51514a] dark:text-gray-300">
                <Info label="目标" value={selectedTask.goal} />
                <Info label="主 Agent" value={AGENT_BY_ID[selectedTask.assigned_agent]?.name || selectedTask.assigned_agent} />
                <Info label="备用 Agent" value={AGENT_BY_ID[selectedTask.backup_agent]?.name || selectedTask.backup_agent} />
                <Info label="分派依据" value={selectedTask.reason} />
                <Info label="预估 Token" value={selectedTask.estimated_tokens} />
                <Info label="预估成本" value={selectedTask.estimated_cost} />
                <Info label="预估耗时" value={selectedTask.estimated_duration} />
                <Info label="交付物" value={(selectedTask.deliverables || []).join(' / ') || '待补充'} />
                <Info label="风险" value={(selectedTask.risks || []).join(' / ') || '无显著风险'} />
              </div>
            </Section>
            <Section
              title="执行 Prompt"
              description="把这段发给被分派的 agent，执行完成后再回填审计字段。"
              actions={<CopyButton label={`${selectedTask.id}-prompt`} onCopy={() => copyText(`${selectedTask.id}-prompt`, selectedTask.prompt)} copied={copied} disabled={!selectedTask.prompt} />}
            >
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#0f172a] p-4 text-[12.5px] leading-6 text-slate-100 dark:border-[#263241]">
                {selectedTask.prompt || 'DeepSeek 未返回执行 Prompt。'}
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

          <Section
            title="归档 JSON"
            description="用于入库、导出、执行追踪和复盘。"
            actions={<CopyButton label="archive" onCopy={() => copyText('archive', JSON.stringify(archive, null, 2))} copied={copied} disabled={!hasPlan} />}
          >
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#0f172a] p-4 text-[12px] leading-6 text-slate-100 dark:border-[#263241]">
              {hasPlan ? JSON.stringify(archive, null, 2) : '生成 Plan 后，这里会出现可归档 JSON。'}
            </pre>
          </Section>
        </section>
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

function EmptyBlock({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-[#d5d7cd] bg-[#fafbf7] px-4 py-8 text-center text-sm text-[#767869] dark:border-[#263241] dark:bg-[#0d131c] dark:text-[#8e9ab0]">
      {text}
    </div>
  )
}

function CopyButton({ label, onCopy, copied, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-[#caccc0] bg-white px-3 text-[12px] font-medium text-[#53554d] transition hover:border-[#818472] hover:text-[#15140f] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2d3744] dark:bg-[#10161f] dark:text-gray-300"
    >
      {copied === label ? '已复制' : '复制'}
    </button>
  )
}

function PlanRow({ step, copied, onCopy }) {
  const primary = AGENT_BY_ID[step.assigned_agent]
  const backup = AGENT_BY_ID[step.backup_agent]
  return (
    <tr>
      <td className="border-b border-[#eceee6] px-3 py-3 align-top dark:border-[#1b2430]">
        <div className="font-mono text-[11px] text-[#767869] dark:text-[#8e9ab0]">{step.id}</div>
        <div className="mt-1 font-semibold text-[#15140f] dark:text-gray-100">{step.phase}</div>
        <p className="mb-0 mt-1 text-[#56564e] dark:text-gray-300">{step.objective}</p>
        {step.dependencies?.length ? <p className="mb-0 mt-1 text-[12px] text-[#858779] dark:text-[#8e9ab0]">依赖：{step.dependencies.join(' / ')}</p> : null}
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
      <td className="border-b border-[#eceee6] px-3 py-3 align-top dark:border-[#1b2430]">
        <CopyButton label={step.id} copied={copied} onCopy={() => onCopy(step.id, JSON.stringify(step, null, 2))} />
      </td>
    </tr>
  )
}
