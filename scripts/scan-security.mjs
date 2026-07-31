#!/usr/bin/env node
// Autopilot · 安全巡检（每周一自动触发，也可手动/本地运行）
// 检查项：依赖漏洞（npm audit）、被 Git 跟踪的敏感文件、安全响应头配置静态检查。
// 输出：data/audits/security-YYYY-MM-DD.json，并打印摘要。脚本本身永远以 0 退出，
// 由 scripts/scan-handoff.mjs 决定是否创建 GitHub Issue。

import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { writeReport, summaryMarkdown, todayStamp } from './scan-utils.mjs'

const stamp = todayStamp()
const issues = []

function runNpmAudit() {
  try {
    return JSON.parse(
      execFileSync('npm', ['audit', '--json'], {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: 180000,
      }),
    )
  } catch (error) {
    // npm audit 发现漏洞时以非零码退出，输出仍在 stdout
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout)
      } catch {
        throw error
      }
    }
    throw error
  }
}

// ---- 1) 依赖漏洞 ----
try {
  const audit = runNpmAudit()
  if (audit?.error || !audit?.vulnerabilities) {
    const reason = audit?.error?.code || audit?.error?.summary || '未知原因'
    issues.push({
      id: 'sec-audit-unavailable',
      severity: 'info',
      title: 'npm audit 无法执行',
      detail: String(reason).slice(0, 300),
      evidence: ['npm audit --json'],
      fix: {
        kind: 'investigate',
        suggestedBranch: `codex/security-scan-${stamp}`,
      },
      tags: ['dependencies'],
    })
  }
  const entries = Object.entries(audit?.vulnerabilities ?? {})
  if (!audit?.error && !entries.length) {
    console.log('[security] npm audit：未发现漏洞')
  }
  for (const [name, v] of entries.slice(0, 25)) {
    if (v.severity === 'none') continue
    const severity = v.severity === 'critical' ? 'high' : v.severity
    const via = Array.isArray(v.via)
      ? v.via.map((x) => (typeof x === 'string' ? x : x.title)).filter(Boolean).join('；')
      : ''
    issues.push({
      id: `sec-deps-${name}`,
      severity,
      title: `依赖漏洞：${name}（${v.severity}）`,
      detail: via || '见 npm audit 输出',
      evidence: ['npm audit --json', `range: ${v.range ?? '未知'}`],
      fix: {
        kind: 'dependency-bump',
        suggestedBranch: `codex/security-scan-${stamp}`,
      },
      tags: ['dependencies'],
    })
  }
} catch (error) {
  issues.push({
    id: 'sec-audit-unavailable',
    severity: 'info',
    title: 'npm audit 无法执行',
    detail: String(error.stderr || error.message).slice(0, 300),
    evidence: ['npm audit --json'],
    fix: {
      kind: 'investigate',
      suggestedBranch: `codex/security-scan-${stamp}`,
    },
    tags: ['dependencies'],
  })
}

// ---- 2) 被 Git 跟踪的敏感文件 ----
// 规则与 scripts/check-sensitive-files.mjs 保持一致口径，这里只聚焦凭据/密钥类。
const blockedPrefixes = [
  '.data/',
  '.next/',
  '.next-check/',
  '.vercel/',
  '.wrangler/',
  'desktop-dist/',
  'dist/',
  'output/',
  'private/',
  'tmp/',
]
const blockedExactNames = new Set([
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  '.dev.vars',
])
const blockedExtensions = new Set(['.db', '.sqlite', '.sqlite3', '.pem', '.key', '.p12'])
const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  const base = file.split('/').pop() ?? ''
  const ext = base.toLowerCase().split('.').pop()
  const hit =
    blockedPrefixes.some((prefix) => file.startsWith(prefix)) ||
    blockedExactNames.has(base) ||
    (ext ? blockedExtensions.has(`.${ext}`) : false)
  if (hit) {
    issues.push({
      id: `sec-tracked-${file}`,
      severity: 'high',
      title: `敏感文件被 Git 跟踪：${file}`,
      detail: '应立即停止跟踪并从提交历史中清理，确认相关 Secret 未泄露。',
      evidence: ['git ls-files'],
      fix: {
        kind: 'code-change',
        suggestedBranch: `codex/security-scan-${stamp}`,
      },
      tags: ['secrets'],
    })
  }
}

// ---- 3) 安全响应头静态检查（信息级，需人工结合 CDN 层判断）----
for (const file of ['next.config.js', 'middleware.js']) {
  const text = await readFile(file, 'utf8').catch(() => '')
  if (!text) continue
  if (!/Strict-Transport-Security/.test(text)) {
    issues.push({
      id: `sec-header-hsts-${file}`,
      severity: 'info',
      title: `未在 ${file} 中发现 HSTS 配置`,
      detail: '可能由 Cloudflare 边缘层配置，需人工确认；若没有，建议为 HTTPS 域开启。',
      evidence: [`${file}（静态检查）`],
      fix: {
        kind: 'config-change',
        suggestedBranch: `codex/security-scan-${stamp}`,
      },
      tags: ['headers'],
    })
  }
  if (!/Content-Security-Policy/.test(text)) {
    issues.push({
      id: `sec-header-csp-${file}`,
      severity: 'info',
      title: `未在 ${file} 中发现 CSP 配置`,
      detail: '站点内联脚本较多，CSP 需要按页面逐项评估，先记录再人工判断。',
      evidence: [`${file}（静态检查）`],
      fix: {
        kind: 'config-change',
        suggestedBranch: `codex/security-scan-${stamp}`,
      },
      tags: ['headers'],
    })
  }
}

const { file, report } = await writeReport({ type: 'security', issues })
console.log(summaryMarkdown(report))
console.log(`[security] 报告已写入 ${file}`)
