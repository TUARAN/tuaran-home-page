#!/usr/bin/env node
// 从本地 git 历史导出首页「分支演进」动画的数据快照。
// 线上构建拿不到本机的分支与 archive 标签，所以快照提交进仓库；刷新时重跑：
//   npm run data:git-branch-evolution
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'public/data/git-branch-evolution.json')
const DAY = 86400

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 }).trim()
const tryGit = (...args) => { try { return git(...args) } catch { return '' } }
const lines = (s) => s.split('\n').filter(Boolean)

// 1. main 第一父链，附每个提交改动的文件（用于识别 squash 落点）
const SEP = '\x1e'
const main = []
for (const block of git('log', 'main', '--first-parent', '--name-only', `--format=${SEP}%H%x09%ct%x09%P%x09%s`).split(SEP).slice(1)) {
  const [head, ...files] = block.split('\n')
  const [h, t, parents, s] = head.split('\t')
  main.push({ h, t: +t, p: parents.split(' '), s, files: new Set(files.filter(Boolean)) })
}
main.reverse()
const mainByHash = new Map(main.map((c) => [c.h, c]))

const commitTimes = (hashes) => {
  if (!hashes.length) return []
  return lines(git('show', '-s', '--format=%ct', ...hashes)).map(Number).sort((a, b) => a - b)
}

const branches = []
const coveredTips = new Set()

// 2. 真合并：第二父链上独有的提交
for (const c of main) {
  if (c.p.length < 2) continue
  const p2 = c.p[1]
  coveredTips.add(p2)
  const times = lines(tryGit('rev-list', '--format=%ct', `${c.p[0]}..${p2}`)).filter((l) => /^\d+$/.test(l)).map(Number).sort((a, b) => a - b)
  if (!times.length) continue
  const base = mainByHash.get(tryGit('merge-base', c.p[0], p2))
  const raw = (c.s.match(/Merge (?:remote-tracking )?branch '([^']+)'(?: into (\S+))?/) || [])
  const merged = raw[2] && /(^|\/)main$/.test(raw[1]) ? raw[2] : raw[1]
  const name = (merged && /(^|\/)main$/.test(merged) ? '同步 origin/main' : merged)
    || (c.s.match(/Merge pull request #\d+ from [^/]+\/(\S+)/) || [])[1]
    || c.s.replace(/^merge:\s*/i, '').replace(/（[^）]*）$/, '')
  branches.push({ name, forkT: base ? base.t : times[0], endT: c.t, commits: times, status: 'merged' })
}

// 3. 其余引用：archive 标签、本地与远端分支
const refs = lines(git('for-each-ref', '--format=%(objectname)\t%(*objectname)\t%(refname)', 'refs/tags/archive', 'refs/heads', 'refs/remotes'))
  .map((l) => l.split('\t'))
  .map(([obj, peeled, ref]) => ({ tip: peeled || obj, ref }))
  .filter((r) => !/\/(main|HEAD)$/.test(r.ref))

const byTip = new Map()
for (const { tip, ref } of refs) {
  const name = ref.replace(/^refs\/(tags\/archive|heads|remotes\/[^/]+)\//, '')
  const e = byTip.get(tip) || { tip, name, published: false, live: false }
  if (ref.startsWith('refs/heads/')) e.live = true
  else { e.published = true; e.name = name }
  byTip.set(tip, e)
}

// 只保留尚未以等价补丁进入 main 的提交（git cherry 的 "+"）
const candidates = []
const seen = new Map()
for (const e of byTip.values()) {
  if (coveredTips.has(e.tip)) continue
  const unique = lines(tryGit('cherry', 'main', e.tip)).filter((l) => l.startsWith('+ ')).map((l) => l.slice(2))
  if (!unique.length) continue
  for (const h of unique) seen.set(h, (seen.get(h) || 0) + 1)
  candidates.push({ ...e, unique })
}

for (const e of candidates) {
  // 多条旧分支共享的一段历史不属于任何一条分支，丢掉
  const own = e.unique.filter((h) => seen.get(h) < 3)
  if (!own.length) continue
  const times = commitTimes(own)
  const firstT = times[0], tipT = times[times.length - 1]
  const base = mainByHash.get(tryGit('merge-base', 'main', e.tip))
  const forkT = base && base.t <= firstT && base.t >= firstT - 30 * DAY ? base.t : firstT - 600
  const files = new Set(lines(tryGit('show', '--name-only', '--format=', ...own)))

  // squash 落点：tip 之后 10 天内、改动文件重合度最高的 main 提交
  let best = null, bestScore = 0
  if (files.size) {
    for (const m of main) {
      if (m.t < tipT - 3600 || m.t > tipT + 10 * DAY || !m.files.size) continue
      let hit = 0
      for (const f of files) if (m.files.has(f)) hit++
      const score = hit / Math.max(files.size, m.files.size)
      if (score > bestScore) { bestScore = score; best = m }
    }
  }
  const name = e.published ? e.name : '本地分支'
  if (best && bestScore >= 0.5) branches.push({ name, forkT, endT: best.t, commits: times, status: 'merged' })
  else branches.push({ name, forkT, endT: tipT, commits: times, status: e.live ? 'open' : 'parked' })
}

branches.sort((a, b) => a.forkT - b.forkT)

// 4. 紧凑输出：时间统一减去起点，单位秒
const t0 = Math.min(main[0].t, ...branches.map((b) => b.forkT))
const data = {
  generatedAt: new Date().toISOString().slice(0, 10),
  t0,
  main: main.map((c) => [c.t - t0, c.p.length > 1 ? 1 : 0]),
  branches: branches.map((b) => [b.name, b.forkT - t0, b.endT - t0, b.status, b.commits.map((t) => t - t0)]),
}
writeFileSync(OUT, JSON.stringify(data) + '\n')

const count = (s) => branches.filter((b) => b.status === s).length
console.log(`main ${main.length} · branches ${branches.length} (merged ${count('merged')}, open ${count('open')}, parked ${count('parked')}) → ${OUT}`)
