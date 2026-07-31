#!/usr/bin/env node
// Autopilot · 设计体验巡检（每月初自动触发，也可手动/本地运行）
// 检查项：Tailwind 透明度类与主题 token 审计（复用现有脚本）、img alt 可访问性启发式检查。
// 浏览器级 a11y/视觉回归检查属第二阶段，见 docs/site-autopilot.md。

import { execFileSync } from 'node:child_process'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { writeReport, summaryMarkdown, todayStamp } from './scan-utils.mjs'

const stamp = todayStamp()
const issues = []

// ---- 1) 复用现有 Tailwind / 主题 token 审计 ----
try {
  execFileSync('node', ['scripts/check-tailwind-opacity-classes.mjs'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  console.log('[design] Tailwind 透明度类与主题 token 审计通过')
} catch (error) {
  const output = `${error.stdout || ''}${error.stderr || ''}`
  const lines = output.split('\n').filter(Boolean)
  for (const line of lines) {
    const match = line.match(/^\s{2}(.+?):(\d+) (.+?) -> (.+)$/)
    if (match) {
      issues.push({
        id: `design-opacity-${match[1]}:${match[2]}`,
        severity: 'low',
        title: `不支持的透明度类：${match[3]}`,
        detail: `建议改为 ${match[4]}（Tailwind 内置 5 分位透明度或任意值语法）。`,
        evidence: [`${match[1]}:${match[2]}`],
        fix: {
          kind: 'code-change',
          suggestedBranch: `codex/design-scan-${stamp}`,
        },
        tags: ['design-tokens'],
      })
    }
  }
  if (!issues.length) {
    issues.push({
      id: 'design-tailwind-unknown',
      severity: 'medium',
      title: 'Tailwind 类审计发现异常',
      detail: output.slice(0, 800),
      evidence: ['scripts/check-tailwind-opacity-classes.mjs'],
      fix: {
        kind: 'code-change',
        suggestedBranch: `codex/design-scan-${stamp}`,
      },
      tags: ['design-tokens'],
    })
  }
}

// ---- 2) img alt 启发式检查（信息级，可能存在组件代理等误报，需人工复核）----
async function listJsx(dir) {
  const entries = await readdir(dir).catch(() => [])
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry)
    const info = await stat(full).catch(() => null)
    if (!info) continue
    if (info.isDirectory()) files.push(...await listJsx(full))
    else if (entry.endsWith('.jsx')) files.push(full)
  }
  return files
}
let imgWithoutAlt = 0
for (const file of await listJsx('app')) {
  const text = await readFile(file, 'utf8').catch(() => '')
  const lines = text.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!/<img\b/.test(line)) continue
    if (!/\balt=/.test(line)) {
      imgWithoutAlt += 1
      if (imgWithoutAlt <= 30) {
        const rel = path.relative(process.cwd(), file)
        issues.push({
          id: `design-alt-${rel}:${index + 1}`,
          severity: 'info',
          title: `img 缺少 alt 属性：${rel}:${index + 1}`,
          detail: '为图片补充有意义的 alt 文本（装饰性图片可为空 alt）。可能是组件代理，需人工复核。',
          evidence: [`${rel}:${index + 1}`],
          fix: {
            kind: 'code-change',
            suggestedBranch: `codex/design-scan-${stamp}`,
          },
          tags: ['a11y'],
        })
      }
    }
  }
}
if (imgWithoutAlt > 30) {
  issues.push({
    id: 'design-alt-many',
    severity: 'info',
    title: `img 缺少 alt 的疑似项共 ${imgWithoutAlt} 处（已展示前 30 处）`,
    detail: '建议先人工确认误报率，再决定是否批量处理。',
    evidence: ['app/ 全量行级检查'],
    fix: { kind: 'investigate', suggestedBranch: `codex/design-scan-${stamp}` },
    tags: ['a11y'],
  })
}

const { file, report } = await writeReport({ type: 'design', issues })
console.log(summaryMarkdown(report))
console.log(`[design] 报告已写入 ${file}`)
