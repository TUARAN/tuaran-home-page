#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

const blockedPathPrefixes = [
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

const allowedExactNames = new Set([
  '.env.example',
  'public/resources/liang-wenfeng-investor-meeting/liang-wenfeng-investor-meeting-transcript.pdf',
])

const blockedExtensions = [
  '.db',
  '.sqlite',
  '.sqlite3',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.pages',
  '.numbers',
  '.key',
  '.pem',
  '.p12',
  '.pfx',
]

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  return output.split('\0').filter(Boolean)
}

function isBlockedPath(file) {
  if (allowedExactNames.has(file)) return false
  if (blockedExactNames.has(file)) return true
  if (blockedPathPrefixes.some((prefix) => file.startsWith(prefix))) return true

  const lower = file.toLowerCase()
  return blockedExtensions.some((ext) => lower.endsWith(ext))
}

const blocked = trackedFiles().filter(isBlockedPath)

if (blocked.length) {
  console.error('[sensitive-files] Refusing to continue: high-risk files are tracked by git.')
  console.error('[sensitive-files] Move local exports/secrets outside the repo, or explicitly revise the guard if a file is intentionally public.')
  for (const file of blocked) {
    console.error(`  - ${file}`)
  }
  process.exit(1)
}

console.log('[sensitive-files] tracked files ok: no high-risk local artifacts detected.')
