#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { spawnSync } from 'child_process'

const source = process.env.FRONTEND_WEEKLY_SOURCE || 'https://github.com/TUARAN/frontend-weekly-digest-cn.git'
let repo = source
let cleanup = null

function git(args, options = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8', ...options })
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`)
  return result.stdout
}
function readSource(file) {
  if (existsSync(source)) return readFileSync(join(source, file), 'utf8')
  return git(['-C', repo, 'show', `HEAD:${file}`])
}
function plain(text) {
  return text.replace(/!?(\[[^\]]*\])\([^)]*\)/g, '$1').replace(/[*_`>#]/g, '').replace(/\n{3,}/g, '\n\n').trim()
}
function parseIssue(file, markdown) {
  const id = Number(file.match(/weekly\/(\d+)\//)?.[1])
  const recommendation = plain((markdown.match(/💬\s*\*\*推荐语\*\*\s*([\s\S]*?)(?=^##\s)/m) || [])[1] || '').slice(0, 2500)
  const sections = [...markdown.matchAll(/^###\s+(.+?)\n([\s\S]*?)(?=^###\s+|^##\s+|(?![\s\S]))/gm)].map((match) => ({
    title: plain(match[1]),
    items: [...match[2].matchAll(/^\s*[*-]\s+\[([^\]]+)]\((https?:\/\/[^)]+)\)(?:：\s*(.*))?$/gm)].map((item) => ({ title: item[1], href: item[2], summary: plain(item[3] || '') })),
  })).filter((section) => section.items.length)
  return { id, title: `前端周刊第${id}期`, recommendation, sections, source: `https://github.com/TUARAN/frontend-weekly-digest-cn/blob/main/${file.split('/').map(encodeURIComponent).join('/')}` }
}

try {
  if (!existsSync(source)) {
    repo = mkdtempSync(join(tmpdir(), 'frontend-weekly-'))
    cleanup = repo
    git(['clone', '--depth=1', '--filter=blob:none', '--no-checkout', source, repo])
  }
  const files = existsSync(source)
    ? readdirSync(join(source, 'weekly'), { recursive: true }).map((file) => `weekly/${String(file).replaceAll('\\', '/')}`)
    : git(['-C', repo, 'ls-tree', '-r', '--name-only', 'HEAD', 'weekly']).split('\n')
  const issues = files.filter((file) => /^weekly\/\d+\/前端周刊第\d+期\.md$/.test(file)).map((file) => parseIssue(file, readSource(file))).sort((a, b) => b.id - a.id)
  const out = resolve(process.cwd(), 'content/frontend-weekly')
  mkdirSync(out, { recursive: true })
  writeFileSync(join(out, 'weekly-index.json'), JSON.stringify({ updatedAt: new Date().toISOString(), source: 'TUARAN/frontend-weekly-digest-cn', issues }, null, 2) + '\n')
  console.log(`Synced ${issues.length} weekly issues`)
} finally {
  if (cleanup) rmSync(cleanup, { recursive: true, force: true })
}
