#!/usr/bin/env node
// Autopilot · DeepSeek 智能分诊：读取最近一份确定性扫描报告，让 DeepSeek V4 Pro
// 做误报过滤、优先级排序与修复建议，结果写回报告文件的 aiAnalysis 字段。
// 无 DEEPSEEK_API_KEY 或 API 失败时不阻断流程（status=skipped/failed，退出码 0）。
// 用法：node scripts/scan-analyze.mjs <security|performance|design>

import { writeFile } from 'node:fs/promises'
import {
  latestReport,
  latestReportPath,
  writeStepSummary,
  aiAnalysisMarkdown,
} from './scan-utils.mjs'
import { callScanDeepSeekJson, pickScanModel } from './scan-deepseek.mjs'

const VALID_TYPES = new Set(['security', 'performance', 'design'])
const type = process.argv[2]
if (!VALID_TYPES.has(type)) {
  console.error('用法：node scripts/scan-analyze.mjs <security|performance|design>')
  process.exit(2)
}

const report = await latestReport(type)
if (!report) {
  console.error(`[scan-analyze] 未找到 ${type} 的最近报告（data/audits/${type}-*.json）`)
  process.exit(1)
}

const system = `你是 2aran.com（涂阿燃的个人站：Next.js 15 App Router + React 19 + JavaScript + Tailwind 3，部署于 Cloudflare Pages/D1/R2，站长是前端与 AI Agent 工程师）的资深全栈工程师兼产品负责人。
你会收到一份确定性扫描脚本生成的巡检报告。请做智能分诊：
1. 过滤误报与噪音（例如已知有意为之的大视频、可接受的内联数据）；
2. 按「修复性价比 × 风险」为值得修的项目排序；
3. 为最值得修的前 8 个项目给出具体动作；
4. 汇总值得注意的风险。
不要输出任何思考过程，直接输出结果。输出必须完整、可被 JSON.parse 解析，总长度必须控制在 3500 token 以内。
输出紧凑：actions 数组最多 8 项，summary 不超过 100 字，每项 reason 不超过 40 字，suggestedAction 不超过 60 字。
只输出严格 JSON，不要 markdown、代码围栏或解释。`

const user = [
  `巡检类型：${report.type}`,
  `生成时间：${report.generatedAt}`,
  '请严格按以下 schema 输出：',
  '{ "summary": "不超过 100 字的一句话总评", "priorityIds": ["按修复优先级从高到低排列的 issueId"], "actions": [{ "issueId": "与报告 issues[].id 一致", "priority": "high|medium|low", "reason": "不超过 40 字", "suggestedAction": "不超过 60 字" }], "noiseIds": ["判定为噪音的 issueId"], "recommendedPrCount": 数字, "risks": ["不超过 5 条风险提示"] }',
  '',
  '巡检报告：',
  JSON.stringify(
    report.issues.slice(0, 40).map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      title: issue.title,
      detail: String(issue.detail || '').slice(0, 160),
      evidence: (issue.evidence || []).slice(0, 2).map((item) => String(item).slice(0, 100)),
      tags: issue.tags || [],
    })),
    null,
    2,
  ),
].join('\n')

let analysis
try {
  const resolvedModel = pickScanModel({ type: report.type, issues: report.issues })
  console.log(`[scan-analyze] 模型路由：${resolvedModel}`)
  const result = await callScanDeepSeekJson({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    model: resolvedModel,
  })
  const json = result.json || {}
  const actions = Array.isArray(json.actions) ? json.actions.slice(0, 8) : []
  analysis = {
    status: 'ok',
    model: result.model,
    generatedAt: new Date().toISOString(),
    usage: result.usage || null,
    summary: String(json.summary || '').slice(0, 500),
    priorityIds: Array.isArray(json.priorityIds) ? json.priorityIds.slice(0, 30) : [],
    // 分支名与 PR 标题由代码确定性生成，不占用模型输出
    actions: actions.map((action) => ({
      issueId: action.issueId,
      priority: action.priority,
      reason: String(action.reason || '').slice(0, 80),
      suggestedAction: String(action.suggestedAction || '').slice(0, 120),
      prTitle: `[${type} 巡检] ${String(action.suggestedAction || '修复').slice(0, 48)}`,
      branch: `codex/${type}-scan-${report.generatedAt.slice(0, 10)}`,
    })),
    noiseIds: Array.isArray(json.noiseIds) ? json.noiseIds.slice(0, 60) : [],
    recommendedPrCount: Number(json.recommendedPrCount) || 0,
    risks: Array.isArray(json.risks) ? json.risks.map(String).slice(0, 10) : [],
  }
} catch (error) {
  const code = error?.code || 'DEEPSEEK_CALL_FAILED'
  analysis = {
    status: code === 'MISSING_DEEPSEEK_API_KEY' ? 'skipped' : 'failed',
    code,
    reason: String(error?.message || error).slice(0, 300),
  }
  console.warn(`[scan-analyze] DeepSeek 未参与分析（${code}）：${analysis.reason}`)
}

report.aiAnalysis = analysis
const filePath = await latestReportPath(type)
if (filePath) {
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

const markdown = aiAnalysisMarkdown(report)
console.log(markdown)
await writeStepSummary(markdown)
console.log(`[scan-analyze] 分析结果已写回 ${filePath}`)
process.exit(0)
