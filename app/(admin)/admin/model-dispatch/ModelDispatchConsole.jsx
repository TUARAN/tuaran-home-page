'use client'

import { useMemo, useState } from 'react'

import { AdminPage, Section } from '../../components/ui'

const STRATEGY_VERSION = 'dispatch-admin-v1.0.0'

const DISPATCH_UNITS = [
  {
    id: 'codex-gpt55',
    name: 'Codex-GPT5.5 一体化套件',
    locked: true,
    boundary: 'Codex 作为工程执行载体、GPT5.5 为底层推理引擎，二者绑定为单一调度单元，禁止拆分选型。',
    strengths: ['需求拆解', '全栈混合开发', '自主读写文件运行自测', '中小型项目端到端交付', 'API 批量生成', '老旧脚本重构'],
    weaknesses: ['百万行超大仓库一次性全局解析', '深度代码安全审计', '极简低成本运维脚本性价比偏低'],
    promptFocus: ['明确仓库边界与验收命令', '要求先读现有实现再改动', '输出改动清单、测试结果和风险'],
  },
  {
    id: 'claude-opus48',
    name: 'Claude Code Opus4.8',
    boundary: '超长上下文和大型架构推演调度单元，适合高复杂度工程阅读与审计。',
    strengths: ['超长上下文百万行代码库全量读取', '跨模块大型架构重构', '代码漏洞合规深度审计', '复杂业务长方案推演'],
    weaknesses: ['短任务响应慢', '轻量脚本调用成本高', '无本地 IDE 实时交互能力'],
    promptFocus: ['要求建立模块地图', '列出跨模块影响面', '输出安全与合规风险矩阵'],
  },
  {
    id: 'cursor-composer25',
    name: 'Cursor Composer2.5',
    boundary: 'IDE 嵌入式轻量编码智能体，适合局部编辑和实时开发反馈。',
    strengths: ['本地实时代码补全', '单文件局部 bug 快速修复', '前端页面增量迭代', '小模块快速开发'],
    weaknesses: ['缺失全局架构设计', '完整项目独立交付', '超长上下文深度分析能力'],
    promptFocus: ['限定文件范围', '要求保持局部最小改动', '用 IDE diagnostics 快速回归'],
  },
  {
    id: 'workbuddy-lowcode',
    name: 'Workbuddy 轻量化运维低代码工具',
    boundary: '低成本运维、流水线和低代码表单调度单元。',
    strengths: ['低成本运维流水线脚本', 'CI/CD 配置', '简易低代码表单', '日常自动化辅助开发'],
    weaknesses: ['无法支撑复杂算法', '大型系统架构', '深度代码审计', '完整业务系统搭建'],
    promptFocus: ['输入环境变量和执行平台', '声明幂等与回滚策略', '生成低成本脚本与配置片段'],
  },
  {
    id: 'deepseek-v4-pro-api',
    name: 'DeepSeek V4 Pro 线上 API',
    boundary: '线上独立 API 接入调度单元，适合低成本批量代码生成与中小型逻辑模块。',
    strengths: ['通用代码生成', '批量接口开发', '国内合规低成本批量任务', '中小型逻辑模块快速产出'],
    weaknesses: ['超长工程仓库全局分析', '大型重构', '复杂业务多层逻辑推演能力不足'],
    onlineRisks: ['调用链路稳定性', '限流', '超时', '数据传输隐私', '并发峰值报错'],
    promptFocus: ['控制单次上下文和批大小', '脱敏输入', '声明重试、限流和降级策略'],
  },
]

const TASK_TYPES = [
  ['fullstack', '全栈功能交付'],
  ['mega-repo', '百万行仓库解析'],
  ['local-bugfix', '本地局部 bug 修复'],
  ['frontend-iteration', '前端页面增量迭代'],
  ['ops-script', '运维脚本 / CI 配置'],
  ['api-batch', '批量 API / 代码生成'],
  ['security-audit', '代码安全 / 合规审计'],
  ['legacy-refactor', '老旧脚本重构'],
]

const SCALE_OPTIONS = [
  ['tiny', '极小：单文件 / 小脚本'],
  ['small', '小型：1-5 个文件'],
  ['medium', '中型：模块级 / 小项目'],
  ['large', '大型：跨模块 / 多服务'],
  ['mega', '超大：百万行级仓库'],
]

const URGENCY_OPTIONS = [
  ['same-day', '当天交付'],
  ['normal', '1-3 天'],
  ['deep', '允许深度推演'],
]

const COST_OPTIONS = [
  ['low', '低成本优先'],
  ['balanced', '成本与质量平衡'],
  ['quality', '质量优先'],
]

const PRIVACY_OPTIONS = [
  ['public', '低：公开或可外发'],
  ['internal', '中：内部代码'],
  ['sensitive', '高：敏感数据 / 客户代码'],
]

const initialForm = {
  title: 'Admin 多模型调度板块落地',
  originalDemand: '新增 Admin 专属多代码大模型智能调度规划管理员板块。',
  taskType: 'fullstack',
  scale: 'medium',
  contextLength: 120,
  urgency: 'normal',
  costThreshold: 'balanced',
  fullRepo: false,
  localIde: false,
  allowOnlineApi: true,
  concurrency: 8,
  privacy: 'internal',
  securityAudit: true,
  complexLogic: true,
}

function scoreUnits(form) {
  const scores = DISPATCH_UNITS.map((unit) => ({ unit, score: 50, reasons: [], warnings: [] }))
  const item = (id) => scores.find((score) => score.unit.id === id)
  const add = (id, delta, reason, warning = false) => {
    const target = item(id)
    target.score += delta
    ;(warning ? target.warnings : target.reasons).push(`${delta > 0 ? '+' : ''}${delta} ${reason}`)
  }

  if (form.taskType === 'fullstack') {
    add('codex-gpt55', 28, '全栈混合开发与端到端交付匹配')
    add('claude-opus48', 10, '复杂业务方案推演可作为架构备援')
    add('cursor-composer25', -16, '缺失完整项目独立交付能力', true)
    add('workbuddy-lowcode', -22, '无法支撑完整业务系统搭建', true)
  }
  if (form.taskType === 'mega-repo') {
    add('claude-opus48', 34, '百万行代码库全量读取能力匹配')
    add('codex-gpt55', -28, '百万行超大仓库一次性全局解析是短板', true)
    add('deepseek-v4-pro-api', -30, '超长工程仓库全局分析能力不足', true)
  }
  if (form.taskType === 'local-bugfix') {
    add('cursor-composer25', 32, '本地 IDE 实时交互和单文件修复匹配')
    add('codex-gpt55', 14, '可读写文件并自测，适合中等局部修复')
    add('claude-opus48', -16, '短任务响应慢且成本高', true)
  }
  if (form.taskType === 'frontend-iteration') {
    add('cursor-composer25', 24, '前端页面增量迭代匹配')
    add('codex-gpt55', 20, '可完成页面、状态和构建验证')
  }
  if (form.taskType === 'ops-script') {
    add('workbuddy-lowcode', 34, '低成本运维流水线脚本和 CI/CD 配置匹配')
    add('codex-gpt55', -12, '极简低成本运维脚本性价比偏低', true)
    add('claude-opus48', -24, '轻量脚本调用成本高', true)
  }
  if (form.taskType === 'api-batch') {
    add('deepseek-v4-pro-api', 26, '线上 API 适配低成本批量接口开发')
    add('codex-gpt55', 22, 'API 批量生成和自测能力匹配')
    add('deepseek-v4-pro-api', -8, '必须纳入限流、超时和并发峰值审计', true)
  }
  if (form.taskType === 'security-audit') {
    add('claude-opus48', 34, '代码漏洞合规深度审计能力匹配')
    add('codex-gpt55', -18, '深度代码安全审计是短板', true)
    add('cursor-composer25', -22, '缺失超长上下文深度分析能力', true)
    add('workbuddy-lowcode', -28, '无法支撑深度代码审计', true)
    add('deepseek-v4-pro-api', -20, '复杂合规审计与多层逻辑推演不足', true)
  }
  if (form.taskType === 'legacy-refactor') {
    add('codex-gpt55', 24, '老旧脚本重构和运行自测匹配')
    add('workbuddy-lowcode', 8, '简单脚本可低成本处理')
  }

  if (form.scale === 'tiny') {
    add('cursor-composer25', 14, '极小任务适合 IDE 内快速处理')
    add('workbuddy-lowcode', 12, '小脚本低成本优先')
    add('claude-opus48', -18, '极小任务调用成本不经济', true)
  }
  if (form.scale === 'medium') add('codex-gpt55', 16, '中型项目端到端交付优势明显')
  if (form.scale === 'large') {
    add('claude-opus48', 18, '跨模块大型架构重构优势')
    add('codex-gpt55', 8, '可执行落地但需拆阶段')
  }
  if (form.scale === 'mega') {
    add('claude-opus48', 30, '百万行级仓库优先')
    add('cursor-composer25', -24, '缺失全局架构设计能力', true)
    add('deepseek-v4-pro-api', -28, '超长仓库分析不足', true)
  }

  if (form.contextLength > 500 || form.fullRepo) {
    add('claude-opus48', 24, '超长上下文 / 全仓库读取要求匹配')
    add('cursor-composer25', -18, '超长上下文深度分析不足', true)
    add('deepseek-v4-pro-api', -22, '线上 API 不适合全仓库大上下文传输', true)
  }
  if (form.localIde) {
    add('cursor-composer25', 24, '明确需要本地 IDE 实时开发')
    add('claude-opus48', -12, '无本地 IDE 实时交互能力', true)
  }
  if (form.urgency === 'same-day') {
    add('cursor-composer25', 10, '短任务快速响应')
    add('workbuddy-lowcode', 8, '轻量自动化响应快')
    add('claude-opus48', -14, '短任务响应慢', true)
  }
  if (form.urgency === 'deep') {
    add('claude-opus48', 12, '允许深度长方案推演')
  }
  if (form.costThreshold === 'low') {
    add('workbuddy-lowcode', 18, '低成本运维和低代码优先')
    add('deepseek-v4-pro-api', 14, '低成本批量线上 API 可选')
    add('claude-opus48', -20, '轻量任务成本高', true)
  }
  if (form.costThreshold === 'quality') add('claude-opus48', 10, '质量优先时可承担复杂审计和架构推演')
  if (!form.allowOnlineApi) add('deepseek-v4-pro-api', -45, '禁止线上 API 时不可作为主调度单元', true)
  if (form.privacy === 'sensitive') {
    add('deepseek-v4-pro-api', -34, '敏感数据传输隐私风险高', true)
    add('claude-opus48', 8, '高隐私下优先离线或受控执行链路审计')
    add('codex-gpt55', 8, '本地文件读写执行边界更易审计')
  }
  if (form.securityAudit) add('claude-opus48', 14, '安全审计维度强化长上下文合规分析')
  if (form.complexLogic) {
    add('claude-opus48', 12, '复杂业务多层逻辑推演匹配')
    add('deepseek-v4-pro-api', -12, '复杂业务多层逻辑推演能力不足', true)
  }
  if (Number(form.concurrency) >= 50) {
    add('deepseek-v4-pro-api', -16, '高并发峰值存在限流 / 超时 / 报错风险', true)
    add('workbuddy-lowcode', 8, '可编排排队、重试和降级脚本')
  }

  return scores
    .map((score) => ({ ...score, score: Math.max(0, Math.min(100, score.score)) }))
    .sort((a, b) => b.score - a.score)
}

function estimateMetrics(form, selected) {
  const scaleFactor = { tiny: 0.35, small: 0.7, medium: 1, large: 2.2, mega: 5 }[form.scale] || 1
  const contextFactor = Math.max(1, Number(form.contextLength || 0) / 120)
  const tokenBase = Math.round(18000 * scaleFactor * Math.min(contextFactor, 6))
  const unitMultiplier = {
    'codex-gpt55': 1,
    'claude-opus48': 1.8,
    'cursor-composer25': 0.45,
    'workbuddy-lowcode': 0.25,
    'deepseek-v4-pro-api': 0.7,
  }[selected.unit.id]
  const tokenMin = Math.round(tokenBase * unitMultiplier * 0.75)
  const tokenMax = Math.round(tokenBase * unitMultiplier * 1.35)
  const costIndex = Math.max(1, Math.round((tokenMax / 10000) * ({ low: 0.6, balanced: 1, quality: 1.45 }[form.costThreshold] || 1)))
  const days = selected.unit.id === 'claude-opus48' && form.scale !== 'tiny' ? '1-5 天' : form.urgency === 'same-day' ? '2-8 小时' : '0.5-3 天'
  return {
    tokenRange: `${tokenMin.toLocaleString('zh-CN')} - ${tokenMax.toLocaleString('zh-CN')}`,
    costRange: `${costIndex} - ${Math.max(costIndex + 2, Math.round(costIndex * 1.8))} CU`,
    delivery: days,
    confidence: `${Math.max(52, Math.min(96, selected.score))}%`,
  }
}

function buildPrompt(form, selected, backup) {
  const focus = selected.unit.promptFocus.join('；')
  return `你是 ${selected.unit.name} 调度单元。请按 Admin 策略版本 ${STRATEGY_VERSION} 执行：\n1. 任务：${form.title}\n2. 原始需求：${form.originalDemand || '待补充'}\n3. 工程规模：${labelOf(SCALE_OPTIONS, form.scale)}；上下文长度约 ${form.contextLength}K token；全仓库读取：${form.fullRepo ? '是' : '否'}。\n4. 固定能力边界：${selected.unit.boundary}\n5. 本次优化重点：${focus}。\n6. 交付要求：输出任务信息、模型选型论证、落地实现模板、风险审计记录、策略迭代优化建议五大模块。\n7. 兜底备用单元：${backup.unit.name}；触发条件为主单元上下文不足、成本超限、响应超时、DeepSeek V4 Pro 线上 API 限流/隐私风险或审计发现模型错配。`
}

function labelOf(options, value) {
  return options.find(([id]) => id === value)?.[1] || value
}

function riskLevel(form, selected) {
  const risks = []
  if (selected.unit.id === 'deepseek-v4-pro-api') {
    if (form.privacy !== 'public') risks.push('线上 API 涉及内部或敏感数据传输')
    if (Number(form.concurrency) >= 20) risks.push('并发量级可能触发限流 / 超时 / 峰值报错')
    if (form.fullRepo || Number(form.contextLength) > 300) risks.push('全仓库或长上下文不适合线上 API 批量传输')
  }
  if (selected.unit.id === 'cursor-composer25' && (form.fullRepo || form.scale === 'large' || form.scale === 'mega')) risks.push('Cursor 不适合全局架构或超长上下文分析')
  if (selected.unit.id === 'workbuddy-lowcode' && (form.complexLogic || form.taskType === 'fullstack')) risks.push('Workbuddy 不适合复杂业务系统搭建')
  if (selected.unit.id === 'claude-opus48' && form.scale === 'tiny' && form.costThreshold === 'low') risks.push('Claude Code Opus4.8 用于极小低成本任务性价比偏低')
  if (selected.unit.id === 'codex-gpt55' && (form.scale === 'mega' || form.taskType === 'security-audit')) risks.push('Codex-GPT5.5 在百万行全局解析或深度安全审计上存在短板')
  const level = risks.length >= 3 ? '高' : risks.length >= 1 ? '中' : '低'
  return { level, risks }
}

function buildArchive(form, selected, backup, metrics, risk) {
  return {
    task_info: {
      task_id: 'ADM-MD-DRAFT-001',
      title: form.title,
      original_demand: form.originalDemand,
      strategy_version: STRATEGY_VERSION,
      admin_scope_only: true,
    },
    model_selection: {
      primary_unit: selected.unit.name,
      backup_unit: backup.unit.name,
      primary_score: selected.score,
      backup_score: backup.score,
      codex_gpt55_locked_as_single_unit: true,
      evidence: selected.reasons,
      warnings: selected.warnings,
    },
    implementation_template: {
      prompt_template: buildPrompt(form, selected, backup),
      estimated_tokens: metrics.tokenRange,
      estimated_cost: metrics.costRange,
      estimated_delivery: metrics.delivery,
      deepseek_api_guardrails:
        selected.unit.id === 'deepseek-v4-pro-api' || backup.unit.id === 'deepseek-v4-pro-api'
          ? ['脱敏输入', '批量切片', '指数退避重试', '并发闸门', '超时自动切换备用单元']
          : [],
    },
    risk_audit_record: {
      precheck_level: risk.level,
      precheck_items: risk.risks,
      execution_fields: ['actual_tokens', 'actual_cost', 'actual_delivery_hours', 'rework_count', 'security_findings', 'api_timeout_count', 'api_rate_limit_count', 'sensitive_data_exposure'],
    },
    strategy_iteration_suggestion: {
      candidate_rules: buildIterationRules(form, selected),
      conflict_checks: buildConflictChecks(form, selected),
    },
  }
}

function buildIterationRules(form, selected) {
  const rules = []
  if (form.taskType === 'api-batch' && selected.unit.id !== 'deepseek-v4-pro-api') rules.push('批量 API 生成若隐私等级低且并发 < 20，可提高 DeepSeek V4 Pro 线上 API 权重。')
  if (form.privacy === 'sensitive') rules.push('敏感数据任务默认降低 DeepSeek V4 Pro 线上 API 主调度权重，除非完成脱敏和法务确认。')
  if (form.fullRepo || form.scale === 'mega') rules.push('全仓库 / 百万行级任务默认提高 Claude Code Opus4.8 权重。')
  if (form.localIde && ['local-bugfix', 'frontend-iteration'].includes(form.taskType)) rules.push('本地 IDE + 局部修复场景提高 Cursor Composer2.5 权重。')
  if (form.taskType === 'ops-script' && form.costThreshold === 'low') rules.push('低成本运维脚本优先 Workbuddy，Codex-GPT5.5 仅作为复杂脚本兜底。')
  return rules.length ? rules : ['当前规则命中清晰，暂不新增策略规则；执行后用真实成本与返工率复核权重。']
}

function buildConflictChecks(form, selected) {
  const checks = [
    { name: 'Codex-GPT5.5 单元锁定', status: '通过', detail: '选型对象仅出现 Codex-GPT5.5 一体化套件，未拆分 Codex 与 GPT5.5。' },
    { name: 'Admin 生效范围', status: '通过', detail: '规则、审计标准和风险管控逻辑仅挂载 /admin/model-dispatch。' },
  ]
  if (form.taskType === 'api-batch' && form.fullRepo) {
    checks.push({ name: '场景重叠', status: '需修正', detail: '批量 API 与全仓库读取同时出现，应先按全仓库分析拆分，再把接口生成子任务分流给 DeepSeek V4 Pro 线上 API 或 Codex-GPT5.5。' })
  }
  if (selected.unit.id === 'deepseek-v4-pro-api' && form.privacy === 'sensitive') {
    checks.push({ name: '选型冲突', status: '需修正', detail: 'DeepSeek V4 Pro 线上 API 与敏感数据传输风险冲突，必须脱敏或切换到非线上 API 主单元。' })
  }
  if (selected.unit.id === 'cursor-composer25' && form.fullRepo) {
    checks.push({ name: '模型错配', status: '需修正', detail: 'Cursor Composer2.5 不适合全仓库深度分析，应切换 Claude Code Opus4.8 或 Codex-GPT5.5 分阶段执行。' })
  }
  return checks
}

function classForRisk(level) {
  if (level === '高') return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200'
  if (level === '中') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
  return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
}

export default function ModelDispatchConsole() {
  const [form, setForm] = useState(initialForm)
  const scores = useMemo(() => scoreUnits(form), [form])
  const selected = scores[0]
  const backup = scores[1]
  const metrics = useMemo(() => estimateMetrics(form, selected), [form, selected])
  const risk = useMemo(() => riskLevel(form, selected), [form, selected])
  const archive = useMemo(() => buildArchive(form, selected, backup, metrics, risk), [form, selected, backup, metrics, risk])
  const prompt = useMemo(() => buildPrompt(form, selected, backup), [form, selected, backup])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <AdminPage
      title="模型调度规划"
      maxWidth="1240px"
      description="Admin 专属多代码大模型智能调度规划、落地执行、全链路审计与策略迭代控制台。固定 5 类调度单元，Codex-GPT5.5 始终作为一体化套件参与选型。"
    >
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <Metric label="策略版本" value={STRATEGY_VERSION} />
          <Metric label="主调度单元" value={selected.unit.name} />
          <Metric label="兜底备用单元" value={backup.unit.name} />
          <Metric label="预检风险" value={`${risk.level}风险`} tone={risk.level} />
        </section>

        <Section title="任务信息" description="模糊需求先补齐工程规模、上下文、时效、成本、全仓读取、IDE、线上 API、并发和隐私合规维度。">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <Field label="任务标题">
                <input value={form.title} onChange={(e) => update('title', e.target.value)} className={inputClass} />
              </Field>
              <Field label="需求原文">
                <textarea value={form.originalDemand} onChange={(e) => update('originalDemand', e.target.value)} rows={5} className={inputClass} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="任务类型" value={form.taskType} options={TASK_TYPES} onChange={(value) => update('taskType', value)} />
                <SelectField label="工程规模" value={form.scale} options={SCALE_OPTIONS} onChange={(value) => update('scale', value)} />
                <SelectField label="交付时效" value={form.urgency} options={URGENCY_OPTIONS} onChange={(value) => update('urgency', value)} />
                <SelectField label="成本阈值" value={form.costThreshold} options={COST_OPTIONS} onChange={(value) => update('costThreshold', value)} />
                <SelectField label="隐私合规" value={form.privacy} options={PRIVACY_OPTIONS} onChange={(value) => update('privacy', value)} />
                <Field label="上下文长度（K token）">
                  <input type="number" min="1" value={form.contextLength} onChange={(e) => update('contextLength', e.target.value)} className={inputClass} />
                </Field>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-[#e2e3da] p-3 dark:border-[#263241]">
                <p className="text-sm font-semibold text-[#15140f] dark:text-gray-100">关键判定开关</p>
                <div className="mt-3 space-y-2">
                  <Toggle label="需要全仓库读取" checked={form.fullRepo} onChange={(value) => update('fullRepo', value)} />
                  <Toggle label="需要本地 IDE 实时开发" checked={form.localIde} onChange={(value) => update('localIde', value)} />
                  <Toggle label="允许使用线上 API" checked={form.allowOnlineApi} onChange={(value) => update('allowOnlineApi', value)} />
                  <Toggle label="包含安全 / 合规审计" checked={form.securityAudit} onChange={(value) => update('securityAudit', value)} />
                  <Toggle label="包含复杂多层业务逻辑" checked={form.complexLogic} onChange={(value) => update('complexLogic', value)} />
                </div>
              </div>
              <Field label="预计并发量级">
                <input type="number" min="1" value={form.concurrency} onChange={(e) => update('concurrency', e.target.value)} className={inputClass} />
              </Field>
              <div className={`rounded-lg border px-3 py-3 text-sm leading-6 ${classForRisk(risk.level)}`}>
                <b>前置风险提示：</b>
                {risk.risks.length ? risk.risks.join('；') : '当前选型未触发高优先级错配或线上 API 风险。'}
              </div>
            </div>
          </div>
        </Section>

        <Section title="模型选型论证" description="按固定能力边界量化打分；每条理由绑定调度单元优势、短板或 DeepSeek V4 Pro 线上 API 接入痛点。">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-[0.12em] text-[#7a7c70] dark:text-[#8e9ab0]">
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">调度单元</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">得分</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">能力边界</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">命中依据</th>
                  <th className="border-b border-[#eceee6] px-3 py-2 dark:border-[#1b2430]">风险短板</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, index) => (
                  <tr key={entry.unit.id} className={index === 0 ? 'bg-[#f4f6ee] dark:bg-[#172033]' : ''}>
                    <td className="border-b border-[#eceee6] px-3 py-3 align-top font-semibold text-[#15140f] dark:border-[#1b2430] dark:text-gray-100">
                      {entry.unit.name}
                      {entry.unit.locked ? <span className="mt-1 block text-[11px] font-normal text-emerald-700 dark:text-emerald-300">单一锁定单元</span> : null}
                    </td>
                    <td className="border-b border-[#eceee6] px-3 py-3 align-top dark:border-[#1b2430]">
                      <span className="font-mono text-lg font-semibold text-[#15140f] dark:text-gray-100">{entry.score}</span>
                    </td>
                    <td className="border-b border-[#eceee6] px-3 py-3 align-top text-[#56564e] dark:border-[#1b2430] dark:text-gray-300">{entry.unit.boundary}</td>
                    <td className="border-b border-[#eceee6] px-3 py-3 align-top text-[#56564e] dark:border-[#1b2430] dark:text-gray-300">
                      {entry.reasons.length ? entry.reasons.join('；') : '未命中显著正向规则'}
                    </td>
                    <td className="border-b border-[#eceee6] px-3 py-3 align-top text-[#7c2d12] dark:border-[#1b2430] dark:text-amber-200">
                      {entry.warnings.length ? entry.warnings.join('；') : '无显著短板触发'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Section title="落地实现模板" description="同步输出专属优化调用 Prompt、预估 token、成本、交付时效和 DeepSeek 线上 API 前置预警。">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="预估 Token" value={metrics.tokenRange} />
              <Metric label="预估成本" value={metrics.costRange} />
              <Metric label="交付时效" value={metrics.delivery} />
              <Metric label="选型置信度" value={metrics.confidence} />
            </div>
            <pre className="mt-4 max-h-[340px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#f8f9f4] p-3 text-[12.5px] leading-6 text-[#303126] dark:border-[#263241] dark:bg-[#0d131c] dark:text-gray-200">
              {prompt}
            </pre>
            <ApiGuardrail selected={selected} backup={backup} />
          </Section>

          <Section title="风险审计记录" description="执行后录入真实运行数据，按低 / 中 / 高输出审计台账与整改方案。">
            <div className="space-y-3 text-sm leading-6 text-[#51514a] dark:text-gray-300">
              <AuditRow level="高" title="模型错配" body="主单元短板与任务硬约束冲突，例如 Cursor 处理全仓架构、Workbuddy 承接复杂系统、Codex-GPT5.5 承接百万行一次性全局解析。" />
              <AuditRow level="高" title="DeepSeek V4 Pro 线上 API 链路故障" body="限流、超时、并发峰值报错或内部 / 敏感数据未脱敏外发，必须触发降级切换和审计留痕。" />
              <AuditRow level="中" title="成本超限 / 多次返工" body="真实 token、成本、返工次数超过预估 30% 以上，记录错配原因并调整策略权重。" />
              <AuditRow level="中" title="代码安全漏洞" body="交付后发现权限、数据泄露、注入、依赖风险，回填漏洞类型和责任单元能力短板。" />
              <AuditRow level="低" title="文档或字段缺失" body="任务 ID、策略版本、原始需求、主备单元、预估指标缺失，要求补录后归档。" />
            </div>
          </Section>
        </section>

        <Section title="策略迭代优化建议" description="周期汇总规划、执行、审计数据，识别低效规则、补充高频场景、生成版本差异并校验冲突。">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">本次候选规则</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-[#51514a] dark:text-gray-300">
                {archive.strategy_iteration_suggestion.candidate_rules.map((rule) => (
                  <li key={rule} className="border-l-2 border-[#cbcdc2] pl-3 dark:border-[#2d3744]">{rule}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">规则冲突校验</h3>
              <div className="mt-2 space-y-2">
                {archive.strategy_iteration_suggestion.conflict_checks.map((check) => (
                  <div key={`${check.name}-${check.detail}`} className="rounded-lg border border-[#e2e3da] px-3 py-2 text-sm dark:border-[#263241]">
                    <span className={`mr-2 rounded px-2 py-0.5 text-[11px] ${check.status === '通过' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200'}`}>{check.status}</span>
                    <b className="text-[#15140f] dark:text-gray-100">{check.name}</b>
                    <p className="mb-0 mt-1 leading-6 text-[#56564e] dark:text-gray-300">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="五大固定模块归档文本" description="可直接存档、入库或导出；字段覆盖任务信息、模型选型论证、落地模板、风险审计和策略迭代建议。">
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-[#e2e3da] bg-[#0f172a] p-4 text-[12px] leading-6 text-slate-100 dark:border-[#263241]">
            {JSON.stringify(archive, null, 2)}
          </pre>
        </Section>

        <Section title="固定调度单元能力边界" description="标准名称与能力边界锁定，不在 Admin 规划板块外生效。">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {DISPATCH_UNITS.map((unit) => (
              <div key={unit.id} className="rounded-lg border border-[#e2e3da] p-3 dark:border-[#263241]">
                <h3 className="text-sm font-semibold text-[#15140f] dark:text-gray-100">{unit.name}</h3>
                <p className="mt-2 text-[12.5px] leading-6 text-[#56564e] dark:text-gray-300">{unit.boundary}</p>
                <p className="mt-2 text-[12px] text-emerald-700 dark:text-emerald-300">优势：{unit.strengths.join(' / ')}</p>
                <p className="mt-2 text-[12px] text-amber-700 dark:text-amber-300">短板：{unit.weaknesses.join(' / ')}</p>
                {unit.onlineRisks ? <p className="mt-2 text-[12px] text-rose-700 dark:text-rose-300">线上风险：{unit.onlineRisks.join(' / ')}</p> : null}
              </div>
            ))}
          </div>
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

function SelectField({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map(([id, text]) => (
          <option key={id} value={id}>{text}</option>
        ))}
      </select>
    </Field>
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

function Metric({ label, value, tone }) {
  const toneClass = tone ? classForRisk(tone.replace('风险', '')) : 'border-[#e2e3da] bg-white text-[#15140f] dark:border-[#263241] dark:bg-[#10161f] dark:text-gray-100'
  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold md:text-base">{value}</div>
    </div>
  )
}

function ApiGuardrail({ selected, backup }) {
  const includesDeepSeek = selected.unit.id === 'deepseek-v4-pro-api' || backup.unit.id === 'deepseek-v4-pro-api'
  if (!includesDeepSeek) {
    return (
      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-sm leading-6 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
        DeepSeek V4 Pro 线上 API 当前不是主备优先单元；若后续作为批量子任务接入，仍需执行脱敏、限流、超时和并发审计。
      </div>
    )
  }
  return (
    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm leading-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
      DeepSeek V4 Pro 线上 API 预警：启用批量切片、请求队列、指数退避、30-60 秒超时、并发闸门、敏感字段脱敏；触发限流 / 超时 / 峰值报错时自动降级到 {backup.unit.id === 'deepseek-v4-pro-api' ? selected.unit.name : backup.unit.name}。
    </div>
  )
}

function AuditRow({ level, title, body }) {
  return (
    <div className="grid gap-2 rounded-lg border border-[#e2e3da] px-3 py-2 dark:border-[#263241] sm:grid-cols-[56px_1fr]">
      <span className={`inline-flex h-7 w-12 items-center justify-center rounded text-xs font-semibold ${classForRisk(level)}`}>{level}</span>
      <div>
        <b className="text-[#15140f] dark:text-gray-100">{title}</b>
        <p className="mb-0 mt-0.5 text-[#56564e] dark:text-gray-300">{body}</p>
      </div>
    </div>
  )
}
