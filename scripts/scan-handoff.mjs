#!/usr/bin/env node
// Autopilot · 扫描收尾：输出摘要到 GitHub Actions step summary，并在存在
// high/medium 发现时创建（或复用）一个待修清单 Issue。
// 用法：node scripts/scan-handoff.mjs <security|performance|design>

import {
  latestReport,
  summaryMarkdown,
  aiAnalysisMarkdown,
  writeStepSummary,
  gh,
} from './scan-utils.mjs'

const VALID_TYPES = new Set(['security', 'performance', 'design'])
const type = process.argv[2]
if (!VALID_TYPES.has(type)) {
  console.error('用法：node scripts/scan-handoff.mjs <security|performance|design>')
  process.exit(2)
}

const report = await latestReport(type)
if (!report) {
  console.error(`[scan-handoff] 未找到 ${type} 的最近报告（data/audits/${type}-*.json）`)
  process.exit(1)
}

const markdown = summaryMarkdown(report)
const aiSection = aiAnalysisMarkdown(report)
const fullMarkdown = aiSection ? `${markdown}\n\n${aiSection}` : markdown
await writeStepSummary(fullMarkdown)
console.log(fullMarkdown)

const actionable = report.issues.filter((issue) => issue.severity === 'high' || issue.severity === 'medium')
if (!actionable.length) {
  console.log('[scan-handoff] 无 high/medium 发现，不创建 Issue。')
  process.exit(0)
}

if (!process.env.GITHUB_ACTIONS) {
  console.log(`[scan-handoff] 本地运行：发现 ${actionable.length} 个待处理项（未创建 Issue）。`)
  process.exit(0)
}

const date = report.generatedAt.slice(0, 10)
const title = `[autopilot] ${type} 巡检 ${date}：${actionable.length} 个待处理项`

try {
  const existing = gh([
    'issue', 'list',
    '--repo', process.env.GITHUB_REPOSITORY,
    '--state', 'open',
    '--search', `in:title "${title}"`,
    '--json', 'number',
    '--jq', 'length',
  ])
  if (Number(existing) > 0) {
    console.log('[scan-handoff] 同标题 Issue 已存在，跳过创建。')
    process.exit(0)
  }
} catch (error) {
  console.error(`[scan-handoff] 查询已有 Issue 失败：${String(error.stderr || error.message)}`)
  process.exit(1)
}

const body = [
  fullMarkdown,
  '',
  '## 修复协议',
  `- 每个主题一个分支：\`codex/${type}-scan-${date}\`。`,
  '- 修复后运行相关测试与 `npm run build:check`，再开 Draft PR。',
  '- PR 描述引用本 Issue，merge 由站长人工完成。',
  '- 完整协议见 docs/site-autopilot.md。',
  '',
  ...actionable.map((issue) => `- [ ] [${issue.severity}] ${issue.title}`),
  '',
].join('\n')

try {
  const number = gh([
    'issue', 'create',
    '--repo', process.env.GITHUB_REPOSITORY,
    '--title', title,
    '--body', body,
    '--json', 'number',
    '--jq', '.number',
  ])
  console.log(`[scan-handoff] 已创建待修清单 Issue #${number}`)
} catch (error) {
  console.error(`[scan-handoff] 创建 Issue 失败：${String(error.stderr || error.message)}`)
  process.exit(1)
}
