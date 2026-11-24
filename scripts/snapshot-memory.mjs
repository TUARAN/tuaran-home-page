#!/usr/bin/env node
// 把本地的 Claude 项目记忆 / 仓库 docs/context 快照写入 D1 表 site_memory_versions（明文）。
// 后台「站点记忆」页通过 owner 鉴权的 /api/admin/site-memory 读取；内容不再进仓库或公开静态目录。
// 每次内容变化才追加一个版本（按 SHA-256 与该文件最新版本比对）。
// 依赖 wrangler 已登录；本机代理会掐断连接时，先清空 HTTP_PROXY / HTTPS_PROXY。
//
// 用法：
//   pnpm snapshot-memory                  # 写入远程 D1（显式手动执行）
//   pnpm snapshot-memory --if-changed     # 容错模式：失败只警告不退出非 0

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync, mkdtempSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import crypto from 'node:crypto'

const REPO_ROOT = process.cwd()
const DB_NAME = 'tuaran-me'

const SOURCES = [
  {
    id: 'codex',
    label: 'Codex 项目规则与记忆',
    description: '本项目 AGENTS.md 与 .codex/memories/，不读取全局跨项目记忆',
    dir: REPO_ROOT,
    files: ['AGENTS.md', 'docs/specs/branch-management.md', 'docs/runbooks/issue-first-workflow.md'],
  },
  {
    id: 'codex-memory',
    label: 'Codex 项目记忆文件',
    dir: path.join(REPO_ROOT, '.codex/memories'),
  },
  {
    id: 'claude',
    label: 'Claude Code 项目记忆',
    description: '~/.claude/projects/…/memory/ 下的跨会话项目级记忆',
    dir: path.join(
      homedir(),
      '.claude/projects/-Users-tuaran-Documents-GitHub-tuaran-home-page/memory',
    ),
  },
  {
    // id 继续用 ai-context：改 id 会另起一套版本线。
    id: 'ai-context',
    label: '仓库 docs/context/',
    description: '仓库内长期保存的架构 / 规划 / 审查文档',
    dir: path.join(REPO_ROOT, 'docs/context'),
  },
]

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return {}
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.+)$/)
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return meta
}

function sqlStr(v) {
  return `'${String(v).replace(/'/g, "''")}'`
}

function wrangler(args) {
  return execFileSync('npx', ['wrangler', 'd1', 'execute', DB_NAME, '--remote', ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

function latestHashes() {
  const out = wrangler([
    '--json',
    '--command',
    'SELECT source_id, slug, hash FROM site_memory_versions WHERE id IN (SELECT MAX(id) FROM site_memory_versions GROUP BY source_id, slug)',
  ])
  const parsed = JSON.parse(out.slice(out.indexOf('[')))
  const map = new Map()
  for (const row of parsed?.[0]?.results || []) map.set(`${row.source_id}/${row.slug}`, row.hash)
  return map
}

function main() {
  const ifChanged = process.argv.includes('--if-changed')
  try {
    run()
  } catch (error) {
    const message = `[snapshot-memory] failed: ${String(error?.message || error).split('\n')[0]}`
    if (ifChanged) {
      console.warn(message)
      process.exit(0)
    }
    console.error(message)
    process.exit(1)
  }
}

function run() {
  const known = latestHashes()
  const now = new Date().toISOString()
  const statements = []

  for (const source of SOURCES) {
    if (!existsSync(source.dir)) {
      console.warn(`[snapshot-memory] source dir missing, skip: ${source.dir}`)
      continue
    }
    const files = source.files || readdirSync(source.dir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => statSync(path.join(source.dir, f)).isFile())
      .sort()
    for (const filename of files) {
      const content = readFileSync(path.join(source.dir, filename), 'utf8')
      const slug = filename.replace(/\.md$/, '').replaceAll('/', '--')
      const hash = sha256Hex(content)
      if (known.get(`${source.id}/${slug}`) === hash) continue
      const meta = parseFrontmatter(content)
      statements.push(
        `INSERT INTO site_memory_versions (source_id, slug, title, description, hash, content, bytes, created_at) VALUES (${[
          source.id,
          slug,
          meta.name || meta.title || slug,
          meta.description || '',
          hash,
          content,
        ]
          .map(sqlStr)
          .join(', ')}, ${Buffer.byteLength(content, 'utf8')}, ${sqlStr(now)});`,
      )
      console.log(`[snapshot-memory] + ${source.id}/${slug}`)
    }
  }

  if (statements.length === 0) {
    console.log('[snapshot-memory] nothing changed.')
    return
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'site-memory-'))
  const file = path.join(dir, 'snapshot.sql')
  writeFileSync(file, statements.join('\n') + '\n', 'utf8')
  wrangler(['--file', file])
  console.log(`[snapshot-memory] done. ${statements.length} new version(s) written to D1.`)
}

main()
