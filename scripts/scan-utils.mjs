#!/usr/bin/env node
// Autopilot 扫描共享工具：报告落盘/读取、摘要输出、GitHub Issue 创建。
// 报告写入 data/audits/（已被 .gitignore 忽略，通过 workflow artifact 与 Issue 对外暴露）。

import { writeFile, mkdir, readFile, readdir, appendFile } from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export const REPO_ROOT = process.cwd()
export const AUDIT_DIR = path.join(REPO_ROOT, 'data', 'audits')

export function todayStamp(timeZone = 'Asia/Shanghai') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function severityCounts(issues) {
  const counts = { total: issues.length, high: 0, medium: 0, low: 0, info: 0 }
  for (const issue of issues) counts[issue.severity] = (counts[issue.severity] ?? 0) + 1
  return counts
}

export async function writeReport({ type, issues, runId = process.env.GITHUB_RUN_ID || 'local' }) {
  const report = {
    schemaVersion: 1,
    type,
    generatedAt: new Date().toISOString(),
    runId,
    branch: process.env.GITHUB_REF_NAME || 'local',
    summary: severityCounts(issues),
    issues,
  }
  await mkdir(AUDIT_DIR, { recursive: true })
  const file = path.join(AUDIT_DIR, `${type}-${todayStamp()}.json`)
  await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return { file, report }
}

export async function latestReportPath(type) {
  const files = (await readdir(AUDIT_DIR)).filter(
    (name) => name.startsWith(`${type}-`) && name.endsWith('.json'),
  ).sort()
  return files.length ? path.join(AUDIT_DIR, files[files.length - 1]) : null
}

export async function latestReport(type) {
  const file = await latestReportPath(type)
  if (!file) return null
  return JSON.parse(await readFile(file, 'utf8'))
}

export function summaryMarkdown(report) {
  const { summary } = report
  const lines = [
    `# Autopilot · ${report.type} 巡检`,
    '',
    `- 生成时间：${report.generatedAt}`,
    `- 运行：${report.runId}（分支 ${report.branch}）`,
    `- 发现：${summary.total} 项（high ${summary.high} / medium ${summary.medium} / low ${summary.low} / info ${summary.info}）`,
    '',
  ]
  for (const issue of report.issues) {
    lines.push(`- [${issue.severity}] ${issue.title}`)
    if (issue.fix?.suggestedBranch) lines.push(`  - 建议分支：\`${issue.fix.suggestedBranch}\``)
  }
  return lines.join('\n')
}

export async function writeStepSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}\n`, 'utf8')
  }
}

export function aiAnalysisMarkdown(report) {
  const ai = report.aiAnalysis
  if (!ai) return ''
  if (ai.status !== 'ok') {
    return `## DeepSeek 分析\n\n未参与分析（${ai.status}）：${ai.reason}`
  }
  const byId = new Map(report.issues.map((issue) => [issue.id, issue]))
  const lines = [
    `## DeepSeek 分析（${ai.model}）`,
    '',
    `- 总评：${ai.summary || '（无）'}`,
    `- 建议修复顺序：${
      (ai.priorityIds || []).map((id) => byId.get(id)?.title || id).join('；') || '（无）'
    }`,
    `- 建议 PR 数量：${ai.recommendedPrCount ?? '（未给出）'}`,
  ]
  if (ai.risks?.length) lines.push(`- 风险提示：${ai.risks.join('；')}`)
  if (ai.actions?.length) {
    lines.push('', '### 修复建议')
    for (const action of ai.actions) {
      const title = byId.get(action.issueId)?.title || action.issueId
      lines.push(`- **${action.priority}** ${title}`)
      if (action.reason) lines.push(`  - 理由：${action.reason}`)
      if (action.suggestedAction) lines.push(`  - 动作：${action.suggestedAction}`)
      if (action.prTitle) lines.push(`  - PR 标题：${action.prTitle}`)
      if (action.branch) lines.push(`  - 分支：\`${action.branch}\``)
    }
  }
  return lines.join('\n')
}

export function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}
