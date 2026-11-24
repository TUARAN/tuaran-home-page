#!/usr/bin/env node
import path from 'node:path'
import process from 'node:process'
import {
  assertTaskSlug,
  assertTypePrefix,
  assertWorktreeCapacity,
  branchName,
  findMainWorktree,
  gitExec,
  isLinkedWorktree,
  isMainWorktree,
  linkNodeModules,
  listWorktrees,
  nodeModulesStatus,
  satellitePath,
} from './worktree-shared.mjs'

function usage() {
  console.log(`Usage:
  npm run worktree:add -- <type> <task-slug> [--path DIR]
  npm run worktree:link-deps [-- --force]
  npm run worktree:doctor

Commands:
  add (default)  Create linked worktree + symlink node_modules from main
  link           Symlink node_modules in the current linked worktree
  doctor         List worktrees and node_modules status`)
}

function parseArgs(argv) {
  const args = [...argv]
  let command = 'add'
  if (args[0] && !args[0].startsWith('-') && ['add', 'link', 'doctor'].includes(args[0])) {
    command = args.shift()
  }
  return { command, args }
}

function cmdDoctor(cwd) {
  const mainRoot = findMainWorktree(cwd)
  console.log(`main worktree: ${mainRoot}\n`)
  for (const entry of listWorktrees(cwd)) {
    const role = isMainWorktree(entry.path) ? 'main' : isLinkedWorktree(entry.path) ? 'satellite' : 'unknown'
    const branch = entry.branch ? entry.branch.replace(/^refs\/heads\//, '') : '(detached)'
    const nm = nodeModulesStatus(entry.path)
    console.log(`${entry.path}`)
    console.log(`  role: ${role}  branch: ${branch}`)
    console.log(`  node_modules: ${nm.kind}${nm.target ? ` → ${nm.target}` : ''}`)
  }
}

function cmdLink(cwd, flags) {
  if (isMainWorktree(cwd)) {
    console.error('worktree:link-deps must run inside a satellite worktree, not the main workspace.')
    process.exit(1)
  }
  if (!isLinkedWorktree(cwd)) {
    console.error('not inside a linked git worktree')
    process.exit(1)
  }
  const mainRoot = findMainWorktree(cwd)
  const result = linkNodeModules(mainRoot, cwd, { force: flags.force })
  console.log(`${result.action}: ${result.satelliteModules} → ${result.mainModules}`)
}

function cmdAdd(cwd, type, taskSlug, targetPath, flags) {
  if (!isMainWorktree(cwd)) {
    console.error('worktree:add must run from the main workspace (directory .git), not a satellite worktree.')
    console.error(`Try: cd ${findMainWorktree(cwd)} && npm run worktree:add -- ${type} ${taskSlug}`)
    process.exit(1)
  }
  assertTypePrefix(type)
  assertTaskSlug(taskSlug)
  assertWorktreeCapacity(cwd)

  const branch = branchName(type, taskSlug)
  const dest = targetPath ? path.resolve(targetPath) : satellitePath(cwd, taskSlug)

  console.log(`branch: ${branch}`)
  console.log(`path:   ${dest}`)
  gitExec(cwd, ['fetch', 'origin', 'main'])
  gitExec(cwd, ['worktree', 'add', '-b', branch, dest, 'origin/main'])
  const link = linkNodeModules(cwd, dest, { force: flags.force })
  console.log(`${link.action}: ${link.satelliteModules} → ${link.mainModules}`)
  console.log(`\nNext: cd ${dest} && git push -u origin ${branch}`)
}

function main() {
  const cwd = process.cwd()
  const { command, args } = parseArgs(process.argv.slice(2))
  const flags = { force: args.includes('--force') }
  const positional = args.filter((a) => a !== '--force')

  if (command === 'doctor') {
    cmdDoctor(cwd)
    return
  }
  if (command === 'link') {
    cmdLink(cwd, flags)
    return
  }
  if (command === 'add') {
    const [type, taskSlug, ...rest] = positional
    if (!type || !taskSlug) {
      usage()
      process.exit(1)
    }
    let targetPath = null
    const pathIdx = rest.indexOf('--path')
    if (pathIdx !== -1) {
      targetPath = rest[pathIdx + 1]
      if (!targetPath) {
        console.error('--path requires a directory')
        process.exit(1)
      }
    }
    cmdAdd(cwd, type, taskSlug, targetPath, flags)
    return
  }

  usage()
  process.exit(1)
}

main()