#!/usr/bin/env node
// One-off codemod: rename frontmatter `source:` → `assistance:` and drop `model:`.
// After this runs successfully, the loader.js fallback (`|| data.source`) and
// the carry-over `source` / `model` fields can be removed.
//
// Usage: node scripts/migrate-research-assistance.mjs
// Idempotent: safe to re-run; only edits files that still have `source:` or `model:`.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const RESEARCH_ROOTS = [
  path.join(ROOT, 'research', 'topics'),
  path.join(ROOT, 'research', 'companies'),
]

const FRONTMATTER_RE = /^(---\n)([\s\S]*?)(\n---)/

function migrateFile(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const m = FRONTMATTER_RE.exec(raw)
  if (!m) return { file, changed: false, reason: 'no frontmatter' }
  const [, open, body, close] = m

  let lines = body.split('\n')
  let touched = false
  let hadAssistance = lines.some((l) => /^assistance\s*:/.test(l))
  let sourceLine = lines.find((l) => /^source\s*:/.test(l))
  let modelLine = lines.find((l) => /^model\s*:/.test(l))

  // 1) source: <id> → assistance: <id>，但若已有 assistance: 则只删 source
  if (sourceLine) {
    const sourceMatch = /^source\s*:\s*(.+?)\s*$/.exec(sourceLine)
    const value = sourceMatch ? sourceMatch[1].replace(/^['"]|['"]$/g, '') : ''
    if (hadAssistance) {
      lines = lines.filter((l) => !/^source\s*:/.test(l))
      touched = true
    } else if (value) {
      lines = lines.map((l) => (/^source\s*:/.test(l) ? `assistance: ${value}` : l))
      touched = true
      hadAssistance = true
    } else {
      lines = lines.filter((l) => !/^source\s*:/.test(l))
      touched = true
    }
  }

  // 2) 删除 model: 行（模型版本现在编码在 VARIANT_LABELS 里）
  if (modelLine) {
    lines = lines.filter((l) => !/^model\s*:/.test(l))
    touched = true
  }

  if (!touched) return { file, changed: false, reason: 'already migrated' }

  const newBody = lines.join('\n')
  const newRaw = raw.replace(FRONTMATTER_RE, `${open}${newBody}${close}`)
  fs.writeFileSync(file, newRaw, 'utf8')
  return { file, changed: true }
}

function main() {
  let touched = 0
  let skipped = 0
  for (const dir of RESEARCH_ROOTS) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.toLowerCase().endsWith('.md')) continue
      if (name.toLowerCase() === 'readme.md') continue
      const result = migrateFile(path.join(dir, name))
      if (result.changed) {
        touched++
        console.log(`  ✓ ${path.relative(ROOT, result.file)}`)
      } else {
        skipped++
      }
    }
  }
  console.log(`\nMigrated ${touched} file(s); ${skipped} already clean.`)
}

main()
