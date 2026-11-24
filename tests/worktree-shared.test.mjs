import assert from 'node:assert/strict'
import test from 'node:test'
import {
  branchName,
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