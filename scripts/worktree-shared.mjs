import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const BRANCH_PREFIXES = ['feat', 'fix', 'research', 'content', 'chore']
export const MAX_WORKTREES = 5

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

  fs.symlink(mainModules, satelliteModules)
  return { action: 'linked', mainModules, satelliteModules }
}