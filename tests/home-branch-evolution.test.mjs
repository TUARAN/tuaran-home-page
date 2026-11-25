import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { drawBranchEvolution, prepareBranchEvolution } from '../lib/home/branchEvolution.mjs'

const raw = JSON.parse(readFileSync(new URL('../public/data/git-branch-evolution.json', import.meta.url), 'utf8'))

// 记录所有数值参数的假 canvas 上下文
function mockCtx() {
  const bad = []
  const ctx = new Proxy({}, {
    get(target, key) {
      if (key === 'measureText') return (s) => ({ width: String(s).length * 6 })
      if (key in target) return target[key]
      return (...args) => {
        for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) bad.push([key, args])
      }
    },
    set(target, key, value) { target[key] = value; return true },
  })
  return { ctx, bad }
}

test('快照结构完整', () => {
  assert.ok(Number.isFinite(raw.t0))
  assert.ok(raw.main.length > 100)
  assert.ok(raw.branches.length > 10)
  for (const [name, forkT, endT, status, commits] of raw.branches) {
    assert.equal(typeof name, 'string')
    assert.ok(['merged', 'open', 'parked'].includes(status), status)
    assert.ok(commits.length > 0, name)
    assert.ok(forkT <= commits[0] + 1, `${name} 分出时间晚于首个提交`)
    if (status === 'merged') assert.ok(endT >= forkT, `${name} 合入早于分出`)
  }
})

test('序号轴单调且可逆', () => {
  const m = prepareBranchEvolution(raw)
  let prev = -1
  for (const [t] of m.main) {
    const p = m.P(t)
    assert.ok(p >= prev, 'P 非单调')
    prev = p
    assert.ok(Math.abs(m.Tinv(p) - t) < 1, 'Tinv(P(t)) ≠ t')
  }
  assert.ok(m.laneCount >= 1)
})

for (const win of [0, 120, 800]) {
  test(`逐帧绘制无异常数值（镜头 ${win || '全景'}）`, () => {
    const m = prepareBranchEvolution(raw)
    const { ctx, bad } = mockCtx()
    let lastMain = 0
    let r
    for (let i = 0; i <= 40; i++) {
      r = drawBranchEvolution(ctx, m, { p: m.p1 * i / 40, speed: 80, win }, 1200, 440)
      assert.ok(r.mainCount >= lastMain, 'main 计数回退')
      lastMain = r.mainCount
    }
    assert.deepEqual(bad.slice(0, 3), [])
    assert.equal(r.mainCount, m.main.length)
    assert.equal(r.merged, m.branches.filter((b) => b.status === 'merged').length)
  })
}
