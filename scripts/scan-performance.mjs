#!/usr/bin/env node
// Autopilot · 性能巡检（每两周一次，也可手动/本地运行）
// 检查项：public/ 静态资源体积、超大源文件（含内联数据）、构建产物 chunk 体积。
// 浏览器级指标（Lighthouse LCP/CLS/INP）属第二阶段，需真实站点 + 浏览器，见 docs/site-autopilot.md。

import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { writeReport, summaryMarkdown, todayStamp } from './scan-utils.mjs'

const stamp = todayStamp()
const issues = []

async function walk(dir) {
  const entries = await readdir(dir).catch(() => [])
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry)
    const info = await stat(full).catch(() => null)
    if (!info) continue
    if (info.isDirectory()) files.push(...await walk(full))
    else files.push(full)
  }
  return files
}

// ---- 1) public/ 静态资源体积 ----
const MEDIA_EXT = new Set(['.mp4', '.webm', '.mov', '.pdf', '.zip'])
let totalPublicBytes = 0
let publicCount = 0
for (const file of await walk('public')) {
  const info = await stat(file)
  totalPublicBytes += info.size
  publicCount += 1
  const sizeMiB = info.size / 1024 / 1024
  const rel = path.relative(process.cwd(), file)
  const ext = path.extname(rel).toLowerCase()
  if (MEDIA_EXT.has(ext)) {
    if (sizeMiB > 20) {
      issues.push({
        id: `perf-media-${rel}`,
        severity: 'low',
        title: `大媒体文件：${rel}（${sizeMiB.toFixed(1)} MiB）`,
        detail: '视频/大文件可能是有意为之；确认走 R2/CDN 并配置合适缓存，避免首屏直接拉取。',
        evidence: [`${rel}（${sizeMiB.toFixed(1)} MiB）`],
        fix: {
          kind: 'config-change',
          suggestedBranch: `codex/perf-scan-${stamp}`,
        },
        tags: ['assets'],
      })
    }
  } else if (sizeMiB > 10) {
    issues.push({
      id: `perf-large-${rel}`,
      severity: 'medium',
      title: `大静态文件：${rel}（${sizeMiB.toFixed(1)} MiB）`,
      detail: '超过 10 MiB 的非媒体静态文件需要评估压缩、拆分或迁往 R2。',
      evidence: [`${rel}（${sizeMiB.toFixed(1)} MiB）`],
      fix: {
        kind: 'code-change',
        suggestedBranch: `codex/perf-scan-${stamp}`,
      },
      tags: ['assets'],
    })
  } else if (sizeMiB > 5) {
    issues.push({
      id: `perf-large-${rel}`,
      severity: 'low',
      title: `较大静态文件：${rel}（${sizeMiB.toFixed(1)} MiB）`,
      detail: '考虑压缩或按需加载。',
      evidence: [`${rel}（${sizeMiB.toFixed(1)} MiB）`],
      fix: {
        kind: 'code-change',
        suggestedBranch: `codex/perf-scan-${stamp}`,
      },
      tags: ['assets'],
    })
  }
}
if (totalPublicBytes > 100 * 1024 * 1024) {
  issues.push({
    id: 'perf-public-total',
    severity: 'info',
    title: `public/ 总量 ${(totalPublicBytes / 1024 / 1024).toFixed(0)} MiB（${publicCount} 个文件）`,
    detail: '超过 100 MiB 时优先评估把大文件迁往 R2，保持构建产物轻量。',
    evidence: ['public/ 全量统计'],
    fix: { kind: 'investigate', suggestedBranch: `codex/perf-scan-${stamp}` },
    tags: ['assets'],
  })
}

// ---- 2) 超大源文件（可能是内联数据，考虑外移）----
const sourceRoots = ['app', 'lib']
for (const root of sourceRoots) {
  for (const file of await walk(root)) {
    if (!/\.(js|jsx|mjs|cjs)$/.test(file)) continue
    const text = await readFile(file, 'utf8').catch(() => '')
    const lines = text.split('\n').length
    const rel = path.relative(process.cwd(), file)
    if (lines > 2000) {
      issues.push({
        id: `perf-src-${rel}`,
        severity: 'medium',
        title: `超大源文件：${rel}（${lines} 行）`,
        detail: '超过 2000 行；若是内联数据，建议外移 JSON 或 R2；若是逻辑，建议拆分模块。',
        evidence: [`${rel}（${lines} 行）`],
        fix: {
          kind: 'refactor',
          suggestedBranch: `codex/perf-scan-${stamp}`,
        },
        tags: ['bundle', 'maintainability'],
      })
    } else if (lines > 1000) {
      issues.push({
        id: `perf-src-${rel}`,
        severity: 'low',
        title: `大源文件：${rel}（${lines} 行）`,
        detail: '超过 1000 行，维护时留意拆分机会。',
        evidence: [`${rel}（${lines} 行）`],
        fix: {
          kind: 'refactor',
          suggestedBranch: `codex/perf-scan-${stamp}`,
        },
        tags: ['bundle', 'maintainability'],
      })
    }
  }
}

// ---- 3) 本地构建产物 chunk 体积（workflow 全新 checkout 无 .next，自动跳过）----
const chunkDir = '.next/static/chunks'
const chunkFiles = await walk(chunkDir).catch(() => [])
const chunkSizes = []
for (const file of chunkFiles) {
  const info = await stat(file)
  chunkSizes.push({ file: path.relative(process.cwd(), file), sizeMiB: info.size / 1024 / 1024 })
}
chunkSizes.sort((a, b) => b.sizeMiB - a.sizeMiB)
for (const chunk of chunkSizes.slice(0, 8)) {
  if (chunk.sizeMiB < 0.3) break
  issues.push({
    id: `perf-chunk-${chunk.file}`,
    severity: 'info',
    title: `较大 chunk：${chunk.file}（${chunk.sizeMiB.toFixed(2)} MiB）`,
    detail: '本地构建产物参考；确认大 chunk 是否包含可懒加载的路由或依赖。',
    evidence: [`${chunk.file}（${chunk.sizeMiB.toFixed(2)} MiB）`],
    fix: { kind: 'investigate', suggestedBranch: `codex/perf-scan-${stamp}` },
    tags: ['bundle'],
  })
}

const { file, report } = await writeReport({ type: 'performance', issues })
console.log(summaryMarkdown(report))
console.log(`[performance] 报告已写入 ${file}`)
