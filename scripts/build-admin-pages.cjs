#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const appRoot = path.join(root, 'app')
const siteRoot = path.join(appRoot, '(site)')
const apiRoot = path.join(appRoot, 'api')
const webLlmRoot = path.join(appRoot, '(web-llm)')
const stashRoot = path.join(root, '.admin-pages-build-excluded')

// Admin pages import shared UI from app/(site)/components. Everything else in
// the site route group is a public route and must not enter the Admin Worker.
const KEPT_SITE_DIRECTORY_ENTRIES = new Map([
  ['articles', new Set(['articlesData.js'])],
  ['context-memory', new Set(['MemoryVault.jsx'])],
  ['long-compass', new Set(['LongCompassClient.jsx', 'components'])],
])

const KEPT_SITE_ENTRIES = new Set([
  'components',
  ...KEPT_SITE_DIRECTORY_ENTRIES.keys(),
])

// SessionProvider always calls me/nav-config and calls notifications for a
// signed-in owner. Auth routes stay available so preview/custom-domain auth
// flows keep working without depending on the public Pages project.
const KEPT_API_ENTRIES = new Set([
  'admin',
  'auth',
  'me',
  'nav-config',
  'notifications',
  'private-records',
  'site-settings',
])

function listEntries(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory).sort()
}

function mkdirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function restoreTree(stashDirectory, targetDirectory) {
  for (const name of listEntries(stashDirectory)) {
    const from = path.join(stashDirectory, name)
    const to = path.join(targetDirectory, name)
    if (fs.statSync(from).isDirectory()) {
      fs.mkdirSync(to, { recursive: true })
      restoreTree(from, to)
      continue
    }
    if (fs.existsSync(to)) {
      throw new Error(`Cannot restore Admin build exclusion because the target already exists: ${to}`)
    }
    mkdirFor(to)
    fs.renameSync(from, to)
  }
}

function restoreMovedPaths() {
  restoreTree(path.join(stashRoot, 'site'), siteRoot)
  restoreTree(path.join(stashRoot, 'api'), apiRoot)

  const stashedWebLlm = path.join(stashRoot, 'web-llm')
  if (fs.existsSync(stashedWebLlm)) {
    if (fs.existsSync(webLlmRoot)) {
      throw new Error(`Cannot restore Admin build exclusion because the target already exists: ${webLlmRoot}`)
    }
    mkdirFor(webLlmRoot)
    fs.renameSync(stashedWebLlm, webLlmRoot)
  }

  try {
    fs.rmSync(stashRoot, { recursive: true, force: true })
  } catch {
    // Best-effort cleanup after all source paths have been restored.
  }
}

function moveEntry(from, to, label) {
  if (!fs.existsSync(from)) return
  mkdirFor(to)
  fs.renameSync(from, to)
  console.log(`[admin-pages-build] excluded ${label}`)
}

function excludePublicPaths() {
  restoreMovedPaths()

  for (const name of listEntries(siteRoot)) {
    if (KEPT_SITE_ENTRIES.has(name)) continue
    moveEntry(
      path.join(siteRoot, name),
      path.join(stashRoot, 'site', name),
      `app/(site)/${name}`,
    )
  }

  for (const [directory, keptEntries] of KEPT_SITE_DIRECTORY_ENTRIES) {
    for (const name of listEntries(path.join(siteRoot, directory))) {
      if (keptEntries.has(name)) continue
      const relativePath = path.join(directory, name)
      moveEntry(
        path.join(siteRoot, relativePath),
        path.join(stashRoot, 'site', relativePath),
        `app/(site)/${relativePath}`,
      )
    }
  }

  for (const name of listEntries(apiRoot)) {
    if (KEPT_API_ENTRIES.has(name)) continue
    moveEntry(
      path.join(apiRoot, name),
      path.join(stashRoot, 'api', name),
      `app/api/${name}`,
    )
  }

  moveEntry(webLlmRoot, path.join(stashRoot, 'web-llm'), 'app/(web-llm)')
}

function cleanBuildOutputs() {
  for (const relativePath of ['.next', path.join('.vercel', 'output')]) {
    const target = path.join(root, relativePath)
    try {
      fs.rmSync(target, { recursive: true, force: true })
    } catch {
      // Build outputs are disposable. Leave the real error to next-on-pages.
    }
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
        ADMIN_PAGES_BUILD: '1',
      },
    },
  )
}

let result
try {
  excludePublicPaths()
  cleanBuildOutputs()
  result = runNextOnPages()
} finally {
  restoreMovedPaths()
}

if (result?.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result?.status ?? 1)
