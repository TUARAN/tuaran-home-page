import assert from 'node:assert/strict'
import test from 'node:test'
import {
  branchName,
  isAgentSlotBranch,
  isAgentSlotPath,
  isNoiseStatusLine,
  parseWorktreeList,
  satellitePath,
} from '../scripts/worktree-shared.mjs'

test('branchName joins type and task slug', () => {
  assert.equal(branchName('feat', 'h5-drawer-settings'), 'feat/h5-drawer-settings')
})

test('satellitePath derives sibling directory name', () => {
  assert.equal(
    satellitePath('/Users/me/GitHub/tuaran-home-page', 'pay-copy'),
    '/Users/me/GitHub/tuaran-home-page-pay-copy',
  )
})

test('parseWorktreeList reads porcelain output', () => {
  const fixture = `worktree /repo/main
HEAD abc
branch refs/heads/main

worktree /repo/main-feat-x
HEAD def
branch refs/heads/feat/x
`
  const list = parseWorktreeList(fixture)
  assert.equal(list.length, 2)
  assert.equal(list[0].path, '/repo/main')
  assert.equal(list[1].branch, 'refs/heads/feat/x')
})

test('isNoiseStatusLine ignores memory snapshots and node_modules', () => {
  assert.equal(isNoiseStatusLine('?? node_modules'), true)
  assert.equal(isNoiseStatusLine(' M app/foo.js'), false)
  assert.equal(isNoiseStatusLine('?? public/data/memory/foo.enc'), true)
})

test('agent slot paths and branches are protected from prune', () => {
  assert.equal(isAgentSlotBranch('chore/slot-cursor'), true)
  assert.equal(isAgentSlotBranch('feat/foo'), false)
  assert.equal(isAgentSlotPath('/repo/tuaran-home-page-slot-cursor'), true)
  assert.equal(isAgentSlotPath('/repo/tuaran-home-page-fix-x'), false)
})