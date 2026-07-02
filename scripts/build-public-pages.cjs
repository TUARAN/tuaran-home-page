#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const stashRoot = path.join(root, '.public-pages-build-excluded')

const EXCLUDED_PATHS = [
  {
    from: path.join(root, 'app', '(admin)'),
    to: path.join(stashRoot, 'app-admin-group'),
    label: 'app/(admin)',
  },
  {
    from: path.join(root, 'app', 'api', 'admin'),
    to: path.join(stashRoot, 'api-admin'),
    label: 'app/api/admin',
  },
]

function mkdirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function restoreMovedPaths() {
  for (const entry of [...EXCLUDED_PATHS].reverse()) {
    if (fs.existsSync(entry.to) && !fs.existsSync(entry.from)) {
      mkdirFor(entry.from)
      fs.renameSync(entry.to, entry.from)
    }
  }
  try {
    fs.rmSync(stashRoot, { recursive: true, force: true })
  } catch {
    // Best effort cleanup only.
  }
}

function excludeAdminPaths() {
  restoreMovedPaths()
  for (const entry of EXCLUDED_PATHS) {
    if (!fs.existsSync(entry.from)) continue
    mkdirFor(entry.to)
    fs.renameSync(entry.from, entry.to)
    console.log(`[public-pages-build] excluded ${entry.label}`)
  }
}

function runNextOnPages() {
  return spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['@cloudflare/next-on-pages@1.13.16'],
    {
      cwd: root,
      stdio: 'inherit',
      env: {
        ...process.env,
        PUBLIC_PAGES_BUILD: '1',
      },
    },
  )
}

let result
try {
  excludeAdminPaths()
  result = runNextOnPages()
} finally {
  restoreMovedPaths()
}

if (result?.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result?.status ?? 1)
