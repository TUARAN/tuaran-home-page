import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const BRANCH_PREFIXES = ['feat', 'fix', 'research', 'content', 'chore']
export const MAX_WORKTREES = 5
export const DEFAULT_STALE_IDLE_DAYS = 7

/** Status noise that does not block task worktree prune (snapshots, broken node_modules link). */
export function isNoiseStatusLine(line) {
  const rest = line.slice(3).trim()
  if (!rest) return false
  const file = rest.includes(' -> ') ? rest.split(' -> ')[0].trim() : rest
  if (file === 'node_modules' || file.startsWith('node_modules/')) return true
  if (file.startsWith('public/data/memory/')) return true
  return false
}

export function worktreeStatusLines(repoRoot) {
  const porcelain = gitExec(repoRoot, ['status', '--porcelain'])
  if (!porcelain) return []
  return porcelain.split('\n').filter(Boolean)
}

export function isWorktreeCleanEnough(repoRoot) {
  const lines = worktreeStatusLines(repoRoot)
  if (!lines.length) return true
  return lines.every(isNoiseStatusLine)
}

export function branchShortName(ref) {
  return ref ? ref.replace(/^refs\/heads\//, '') : null
}

export function isAgentSlotBranch(branchName) {
  return typeof branchName === 'string' && /^chore\/slot-/.test(branchName)
}

export function isAgentSlotPath(worktreePath) {
  const base = path.basename(worktreePath)
  return base.includes('-slot-')
}

export function branchUpstreamGone(repoRoot, branchName) {
  try {
    const vv = gitExec(repoRoot, ['branch', '-vv', '--list', branchName])
    return /: gone\]/.test(vv)
  } catch {
    return false
  }
}

export function isBranchMergedInto(repoRoot, branchName, upstream = 'origin/main') {
  try {
    gitExec(repoRoot, ['merge-base', '--is-ancestor', branchName, upstream])
    return true
  } catch {
    return false
  }
}

export function branchIdleDays(repoRoot, branchName) {
  try {
    const ts = Number(gitExec(repoRoot, ['log', '-1', '--format=%ct', branchName]))
    if (!Number.isFinite(ts) || ts <= 0) return 0
    return (Date.now() / 1000 - ts) / 86_400
  } catch {
    return 0
  }
}

function ghAvailable(repoRoot) {
  try {
    execFileSync('gh', ['--version'], { cwd: repoRoot, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function hasOpenPullRequest(repoRoot, branchName) {
  if (!ghAvailable(repoRoot)) return null
  try {
    const out = execFileSync(
      'gh',
      ['pr', 'list', '--head', branchName, '--state', 'open', '--json', 'number', '--limit', '1'],
      { cwd: repoRoot, encoding: 'utf8' },
    )
    return JSON.parse(out || '[]').length > 0
  } catch {
    return null
  }
}

export function evaluateWorktreePrune(entry, repoRoot, options = {}) {
  const {
    staleIdleDays = DEFAULT_STALE_IDLE_DAYS,
    includeStale = false,
    upstream = 'origin/main',
  } = options

  const branchName = branchShortName(entry.branch)
  const result = {
    path: entry.path,
    branch: branchName,
    action: 'keep',
    reason: null,
    forceRemove: false,
  }

  if (isMainWorktree(entry.path)) {
    result.reason = 'main worktree'
    return result
  }
  if (!branchName) {
    result.reason = 'detached HEAD'
    return result
  }
  if (isAgentSlotBranch(branchName) || isAgentSlotPath(entry.path)) {
    result.reason = 'agent slot'
    return result
  }
  if (!isWorktreeCleanEnough(entry.path)) {
    result.reason = 'uncommitted changes'
    return result
  }

  const noiseLines = worktreeStatusLines(entry.path)
  result.forceRemove = noiseLines.length > 0 && noiseLines.every(isNoiseStatusLine)

  const merged = isBranchMergedInto(entry.path, branchName, upstream)
  const remoteGone = branchUpstreamGone(entry.path, branchName)
  if (merged || remoteGone) {
    result.action = 'remove'
    result.reason = merged ? 'merged into origin/main' : 'upstream branch gone'
    return result
  }

  if (includeStale) {
    const idleDays = branchIdleDays(entry.path, branchName)
    const openPr = hasOpenPullRequest(entry.path, branchName)
    if (openPr === true) {
      result.reason = 'open pull request'
      return result
    }
    if (openPr === null && idleDays >= staleIdleDays) {
      result.reason = 'idle but PR state unknown (install gh)'
      return result
    }
    if (idleDays >= staleIdleDays) {
      result.action = 'remove'
      result.reason = `idle ${Math.floor(idleDays)}d (>= ${staleIdleDays}d), no open PR`
      result.deleteLocalBranch = false
      return result
    }
    result.reason = `active task (${Math.floor(idleDays)}d since last commit)`
    return result
  }

  result.reason = 'task in progress'
  return result
}

export function pruneWorktrees(cwd, options = {}) {
  const { apply = false, includeStale = false, staleIdleDays = DEFAULT_STALE_IDLE_DAYS } = options
  const mainRoot = findMainWorktree(cwd)

  try {
    gitExec(mainRoot, ['fetch', 'origin', 'main', '--prune'])
  } catch {
    // offline or no remote — still evaluate with local refs
  }

  const planned = []
  const skipped = []
  const removed = []

  for (const entry of listWorktrees(cwd)) {
    const verdict = evaluateWorktreePrune(entry, mainRoot, { staleIdleDays, includeStale })
    if (verdict.action === 'remove') {
      planned.push(verdict)
      if (!apply) continue
      const removeArgs = ['worktree', 'remove', entry.path]
      if (verdict.forceRemove) removeArgs.push('--force')
      try {
        gitExec(mainRoot, removeArgs)
        removed.push(verdict)
        const dropBranch = verdict.deleteLocalBranch !== false
        if (dropBranch) {
          try {
            gitExec(mainRoot, ['branch', '-D', verdict.branch])
          } catch {
            // branch may already be gone
          }
        }
      } catch (error) {
        skipped.push({ ...verdict, reason: `remove failed: ${error.message}` })
      }
    } else {
      skipped.push(verdict)
    }
  }

  return { mainRoot, planned, skipped, removed, apply }
}

export function branchName(type, taskSlug) {
  return `${type}/${taskSlug}`
}

export function satellitePath(mainRoot, taskSlug) {
  const parent = path.dirname(mainRoot)
  const base = path.basename(mainRoot)
  return path.join(parent, `${base}-${taskSlug}`)
}

export function isMainWorktree(repoRoot) {
  const gitPath = path.join(repoRoot, '.git')
  try {
    return fs.statSync(gitPath).isDirectory()
  } catch {
    return false
  }
}

export function isLinkedWorktree(repoRoot) {
  const gitPath = path.join(repoRoot, '.git')
  try {
    return fs.statSync(gitPath).isFile()
  } catch {
    return false
  }
}

export function gitExec(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trimEnd()
}

export function parseWorktreeList(porcelain) {
  const worktrees = []
  let current = null
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current) worktrees.push(current)
      current = { path: line.slice('worktree '.length), branch: null }
      continue
    }
    if (!current) continue
    if (line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length)
    }
  }
  if (current) worktrees.push(current)
  return worktrees
}

export function listWorktrees(cwd) {
  const porcelain = gitExec(cwd, ['worktree', 'list', '--porcelain'])
  return parseWorktreeList(porcelain)
}

export function findMainWorktree(cwd) {
  for (const entry of listWorktrees(cwd)) {
    if (isMainWorktree(entry.path)) return entry.path
  }
  throw new Error('could not find main worktree (no checkout with .git directory)')
}

export function assertTypePrefix(type) {
  if (!BRANCH_PREFIXES.includes(type)) {
    throw new Error(`type must be one of: ${BRANCH_PREFIXES.join(', ')}`)
  }
}

export function assertTaskSlug(taskSlug) {
  if (!taskSlug || /[/\s]/.test(taskSlug)) {
    throw new Error('task slug must be a single path segment (no spaces or slashes)')
  }
}

export function assertWorktreeCapacity(cwd, max = MAX_WORKTREES) {
  const count = listWorktrees(cwd).length
  if (count >= max) {
    throw new Error(
      `worktree count ${count} already at limit ${max} (includes main). Remove a merged worktree before adding another. Run: npm run worktree:doctor`,
    )
  }
}

export function nodeModulesStatus(repoRoot) {
  const target = path.join(repoRoot, 'node_modules')
  if (!fs.existsSync(target)) {
    return { kind: 'missing', target: null }
  }
  const st = fs.lstatSync(target)
  if (st.isSymbolicLink()) {
    return { kind: 'symlink', target: fs.readlinkSync(target) }
  }
  if (st.isDirectory()) {
    return { kind: 'directory', target: null }
  }
  return { kind: 'other', target: null }
}

export function linkNodeModules(mainRoot, satelliteRoot, { force = false } = {}) {
  const mainModules = path.join(mainRoot, 'node_modules')
  const satelliteModules = path.join(satelliteRoot, 'node_modules')

  if (!fs.existsSync(mainModules)) {
    throw new Error(`main worktree has no node_modules: ${mainModules}\nRun npm install in the main worktree first.`)
  }

  const status = nodeModulesStatus(satelliteRoot)
  if (status.kind === 'symlink') {
    if (path.resolve(satelliteRoot, status.target) === path.resolve(mainModules)) {
      return { action: 'unchanged', mainModules, satelliteModules }
    }
    fs.unlinkSync(satelliteModules)
  } else if (status.kind === 'directory') {
    if (!force) {
      throw new Error(
        `satellite has a real node_modules directory at ${satelliteModules}. Remove it or pass --force to replace with a symlink.`,
      )
    }
    fs.rmSync(satelliteModules, { recursive: true, force: true })
  } else if (status.kind === 'other') {
    fs.rmSync(satelliteModules, { force: true })
  }

  fs.symlinkSync(mainModules, satelliteModules)
  return { action: 'linked', mainModules, satelliteModules }
}