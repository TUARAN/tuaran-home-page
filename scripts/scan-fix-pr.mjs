#!/usr/bin/env node
// Autopilot · 自动修复并开 Draft PR（scan → issue → PR 闭环的最后一环）。
// 用法：node scripts/scan-fix-pr.mjs <security|performance|design> [--dry-run]
//
// 行为：
//   1. 读最近一份报告；无 high/medium 发现直接退出；
//   2. 同名分支已有开放 PR 则跳过；
//   3. 建分支 codex/<type>-scan-<日期>；
//   4. 按类型应用保守修复：
//      - security：npm audit fix（只做向后兼容的安全升级）；
//      - design：为同行的 <img> 补 alt=""（仅处理扫描标记的行）；
//      - performance：无安全、确定性的自动修复，保留 Issue 转人工；
//   5. 有实际改动时跑 npm run build:check；
//   6. 通过则提交、推送、开 Draft PR 并引用对应 Issue。
// merge 永远由站长人工完成。

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { latestReport, gh } from './scan-utils.mjs'

const VALID_TYPES = new Set(['security', 'performance', 'design'])
const type = process.argv[2]
const dryRun = process.argv.includes('--dry-run')
if (!VALID_TYPES.has(type)) {
  console.error('用法：node scripts/scan-fix-pr.mjs <security|performance|design> [--dry-run]')
  process.exit(2)
}

const report = await latestReport(type)
if (!report) {
  console.error(`[scan-fix-pr] 未找到 ${type} 的最近报告（data/audits/${type}-*.json）`)
  process.exit(1)
}

const actionable = report.issues.filter(
  (issue) => issue.severity === 'high' || issue.severity === 'medium',
)
if (!actionable.length) {
  console.log(`[scan-fix-pr] ${type} 无 high/medium 发现，不需要自动修复。`)
  process.exit(0)
}

const date = report.generatedAt.slice(0, 10)
const branch = `codex/${type}-scan-${date}`
const prTitle = `[autopilot] ${type} 巡检 ${date}：自动修复`
const npmRegistry = process.env.NPM_REGISTRY || ''

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options })
}

// 同名分支已有开放 PR → 跳过
try {
  const existing = Number(
    gh(['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number', '--jq', 'length']),
  )
  if (existing > 0) {
    console.log(`[scan-fix-pr] 分支 ${branch} 已有开放 PR，跳过。`)
    process.exit(0)
  }
} catch {
  console.log('[scan-fix-pr] gh 不可用或查询失败，继续尝试修复。')
}

// 建分支（失败则切到已有分支继续）
try {
  git(['checkout', '-b', branch])
  console.log(`[scan-fix-pr] 已建分支 ${branch}`)
} catch {
  git(['checkout', branch])
  console.log(`[scan-fix-pr] 已切换到已有分支 ${branch}`)
}

// ---- 按类型应用保守修复 ----
const changedFiles = []
if (type === 'security') {
  console.log('[scan-fix-pr] 运行 npm audit fix（仅向后兼容修复）…')
  const auditArgs = ['audit', 'fix', '--no-fund', '--no-audit']
  if (npmRegistry) auditArgs.push('--registry', npmRegistry)
  execFileSync('npm', auditArgs, { stdio: 'inherit' })
  changedFiles.push('package.json', 'package-lock.json')
} else if (type === 'design') {
  console.log('[scan-fix-pr] 为扫描标记的 <img> 补 alt="" …')
  const touched = new Set()
  for (const issue of report.issues) {
    const match = String(issue.id || '').match(/^design-alt-(.+):(\d+)$/)
    if (!match) continue
    const file = path.join(process.cwd(), match[1])
    const lineNo = Number(match[2]) - 1
    const text = await readFile(file, 'utf8').catch(() => null)
    if (text == null) continue
    const lines = text.split('\n')
    const line = lines[lineNo]
    if (!line || !line.includes('<img') || line.includes('alt=')) continue
    if (!/\/?>$/.test(line.trimEnd())) continue
    lines[lineNo] = line.replace(/\/?>$/, ' alt=""$&')
    await writeFile(file, lines.join('\n'), 'utf8')
    touched.add(file)
    console.log(`  - 已补 alt：${match[1]}:${match[2]}`)
  }
  changedFiles.push(...[...touched].map((file) => path.relative(process.cwd(), file)))
} else {
  console.log(`[scan-fix-pr] ${type} 无安全、确定性的自动修复，保留 Issue 转人工。`)
  git(['checkout', 'main'])
  process.exit(0)
}

// 实际改动检查
const porcelain = git(['status', '--porcelain'])
if (!porcelain.trim()) {
  console.log('[scan-fix-pr] 没有产生实际改动，不开 PR。')
  git(['checkout', 'main'])
  process.exit(0)
}

// 构建门禁（dry-run 跳过）
if (!dryRun) {
  console.log('[scan-fix-pr] 运行 build:check …')
  try {
    execFileSync('npm', ['run', 'build:check'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXTAUTH_SECRET: 'ci-placeholder-not-for-runtime',
        NEXTAUTH_URL: 'https://2aran.com',
        RESEARCH_ENCRYPTION_PASSWORD: 'ci-placeholder-not-for-runtime',
      },
    })
  } catch (error) {
    console.error('[scan-fix-pr] build:check 失败，不开 PR；请人工处理对应 Issue。')
    git(['checkout', 'main'])
    process.exit(1)
  }
}

if (dryRun) {
  console.log(`[scan-fix-pr] dry-run：改动就绪（${changedFiles.length} 个文件），未提交未推送。`)
  git(['checkout', 'main'])
  process.exit(0)
}

// 提交、推送、开 Draft PR
git(['add', ...changedFiles])
git([
  '-c', 'user.name=github-actions[bot]',
  '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
  'commit', '-m', `autopilot: ${type} 巡检 ${date} 自动修复`,
])
console.log(`[scan-fix-pr] 已提交，推送 ${branch} …`)
if (process.env.GITHUB_ACTIONS) {
  execFileSync('gh', ['auth', 'setup-git'], { stdio: 'ignore' })
}
git(['push', 'origin', branch])

// 找对应 Issue
let issueRef = ''
try {
  const number = gh([
    'issue', 'list',
    '--repo', process.env.GITHUB_REPOSITORY || 'TUARAN/tuaran-home-page',
    '--state', 'open',
    '--search', `in:title "[autopilot] ${type} 巡检 ${date}"`,
    '--json', 'number',
    '--jq', '.[0].number',
  ])
  if (number) issueRef = `#${number}`
} catch {
  issueRef = ''
}

const body = [
  `Autopilot 自动修复（${type} 巡检 ${date}）。`,
  issueRef ? `关联待修清单：${issueRef}` : '（未找到对应 Issue，请结合报告人工核对）',
  '',
  '- 修复内容见本 PR diff；构建门禁已通过。',
  '- 请站长 review 后自行 merge；不要 merge 未经确认的改动。',
  '',
].join('\n')

const url = gh([
  'pr', 'create',
  '--repo', process.env.GITHUB_REPOSITORY || 'TUARAN/tuaran-home-page',
  '--draft',
  '--title', prTitle,
  '--body', body,
  '--head', branch,
  '--base', 'main',
])
console.log(`[scan-fix-pr] 已开 Draft PR：${String(url).trim()}`)
git(['checkout', 'main'])
