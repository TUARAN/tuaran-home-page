// 首页「本站分支演进」动画：数据整理与逐帧绘制。
// 数据快照由 scripts/git-branch-evolution.mjs 生成到 public/data/git-branch-evolution.json。

export const DAY = 86400
const STATUS_COLOR = { open: '#3fb950', parked: '#6e7681' }
const laneColor = (i) => `hsl(${(i * 47) % 360} 70% 70%)`

// 横轴按提交序号等距排布：提交密集的时期自动拉开，稀疏期不留大片空白
export function prepareBranchEvolution(raw) {
  const t0 = raw.t0
  const main = raw.main.map(([t, m]) => [t + t0, m])
  const branches = raw.branches.map(([name, forkT, endT, status, commits]) => ({
    name, status, forkT: forkT + t0, endT: endT + t0, commits: commits.map((t) => t + t0),
  }))
  const S = [...new Set([...main.map((c) => c[0]), ...branches.flatMap((b) => [b.forkT, b.endT, ...b.commits])])]
    .sort((a, b) => a - b)
  const P = (t) => {
    if (t <= S[0]) return 0
    if (t >= S[S.length - 1]) return S.length - 1
    let lo = 0, hi = S.length - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= t) lo = m; else hi = m }
    return lo + (t - S[lo]) / (S[hi] - S[lo])
  }
  const Tinv = (p) => {
    const i = Math.max(0, Math.min(S.length - 2, Math.floor(p)))
    return S[i] + (S[i + 1] - S[i]) * Math.min(1, p - i)
  }
  // 泳道：时间上不重叠的分支复用同一条
  const ends = []
  for (const b of branches) {
    const s = P(b.forkT), e = P(Math.max(b.endT, b.commits[b.commits.length - 1]))
    let lane = ends.findIndex((x) => x + 4 < s)
    if (lane < 0) { lane = ends.length; ends.push(0) }
    ends[lane] = e
    b.lane = lane
  }
  return { main, branches, P, Tinv, p1: S.length - 1, laneCount: ends.length, generatedAt: raw.generatedAt }
}

// 画一帧。view = { p: 播放头序号, speed: 每秒推进的提交数, win: 镜头宽度（提交数，0 为全景） }
// 返回 HUD 数字。
export function drawBranchEvolution(ctx, model, view, W, H) {
  const { main, branches, P, Tinv, p1, laneCount } = model
  ctx.clearRect(0, 0, W, H)

  const p = view.p, T = Tinv(p)
  const ago = (t) => (P(T) - P(t)) / view.speed
  const top = 16, bottom = H - 30, midY = (top + bottom) / 2
  const rows = Math.ceil(laneCount / 2) || 1
  const gap = Math.max(3, Math.min(22, (bottom - top) / 2 / (rows + 0.5)))
  const laneY = (l) => midY + (l % 2 ? 1 : -1) * gap * (Math.floor(l / 2) + 1)

  let v0, v1
  if (!view.win) { v0 = 0; v1 = p1 } else { v1 = Math.max(p + view.win * 0.15, view.win); v0 = v1 - view.win }
  const L = 12, R = W - 12
  const X = (t) => L + (P(t) - v0) / (v1 - v0) * (R - L)
  const tv0 = Tinv(Math.max(0, v0)), tv1 = Tinv(Math.min(p1, v1))

  // 日期刻度：镜头宽度决定按天 / 周 / 月
  ctx.font = '11px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  const spanDays = (tv1 - tv0) / DAY
  const step = spanDays < 20 ? 1 : spanDays < 90 ? 7 : 0
  const d = new Date(tv0 * 1000)
  d.setHours(0, 0, 0, 0)
  if (!step) d.setDate(1)
  let lastX = -1e9
  for (let m = new Date(d); m.getTime() / 1000 < tv1; step ? m.setDate(m.getDate() + step) : m.setMonth(m.getMonth() + 1)) {
    const x = X(m.getTime() / 1000)
    if (x < L + 20 || x > R - 20 || x - lastX < 56) continue
    lastX = x
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom + 4); ctx.stroke()
    ctx.fillStyle = '#5b6573'
    ctx.fillText(step ? `${m.getMonth() + 1}.${m.getDate()}` : `${m.getFullYear()}.${m.getMonth() + 1}`, x, bottom + 20)
  }

  // main 主干
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#58a6ff'
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(Math.max(L, X(main[0][0])), midY); ctx.lineTo(X(T), midY); ctx.stroke()

  let active = 0, merged = 0
  const labels = []
  for (const b of branches) {
    if (b.forkT > T) continue
    const done = T >= b.endT
    if (done && b.status === 'merged') merged++
    if (!done || b.status === 'open') active++
    const tEnd = Math.min(T, b.status === 'merged' ? b.endT : Math.max(b.endT, b.commits[b.commits.length - 1]))
    if (P(tEnd) < v0 || P(b.forkT) > v1) continue
    const y = laneY(b.lane)
    const color = b.status === 'merged' ? laneColor(b.lane) : STATUS_COLOR[b.status]
    const xs = X(b.forkT), xe = X(tEnd)
    const bend = Math.min(16, Math.max(5, (xe - xs) / 3))
    const faded = b.status === 'parked' && done
    const mergedNow = done && b.status === 'merged'

    ctx.globalAlpha = faded ? 0.45 : 1
    ctx.strokeStyle = color
    ctx.lineWidth = 1.6
    ctx.setLineDash(faded ? [4, 4] : [])
    ctx.beginPath(); ctx.moveTo(xs, midY)
    ctx.bezierCurveTo(xs + bend * 0.6, midY, xs + bend * 0.4, y, xs + bend, y)
    if (mergedNow) {
      ctx.lineTo(Math.max(xs + bend, xe - bend), y)
      ctx.bezierCurveTo(xe - bend * 0.4, y, xe - bend * 0.6, midY, xe, midY)
    } else {
      ctx.lineTo(Math.max(xs + bend, xe), y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // 分支上的提交点
    ctx.fillStyle = color
    const xMax = mergedNow ? Math.max(xs + bend, xe - bend) : Infinity
    for (const ct of b.commits) {
      if (ct > T) break
      ctx.beginPath(); ctx.arc(Math.min(Math.max(X(ct), xs + bend), xMax), y, 2.2, 0, 7); ctx.fill()
    }
    // 合入瞬间的光圈
    const sinceEnd = ago(b.endT)
    if (mergedNow && sinceEnd < 1.2) {
      ctx.globalAlpha = 1 - sinceEnd / 1.2
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(xe, midY, 6 + sinceEnd * 22, 0, 7); ctx.stroke()
    }
    // 仍在推进的分支头
    if (!done || b.status === 'open') {
      ctx.globalAlpha = 1
      ctx.shadowColor = color
      ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(Math.max(xs + bend, xe), y, 3.4, 0, 7); ctx.fill()
      ctx.shadowBlur = 0
    }
    ctx.globalAlpha = 1

    // 分支名：分出后与合入后短暂显示，进行中常驻
    let alpha = 0
    if (!done) alpha = Math.min(1, ago(b.forkT) * 3)
    else if (b.status === 'open') alpha = 1
    else alpha = Math.max(0, 1 - sinceEnd / 1.5)
    if (alpha > 0.02) labels.push({ text: b.name, x: Math.max(xs + bend, xe) + 6, y, alpha, color })
  }

  // main 提交点，合并提交稍大
  let mainCount = 0
  for (const [t, isMerge] of main) {
    if (t > T) break
    mainCount++
    if (t < tv0) continue
    ctx.fillStyle = isMerge ? '#f0f6fc' : '#58a6ff'
    ctx.beginPath(); ctx.arc(X(t), midY, isMerge ? 3.4 : 2, 0, 7); ctx.fill()
  }
  const hx = X(T)
  ctx.fillStyle = '#58a6ff'
  ctx.shadowColor = '#58a6ff'
  ctx.shadowBlur = 14
  ctx.beginPath(); ctx.arc(hx, midY, 5, 0, 7); ctx.fill()
  ctx.shadowBlur = 0
  ctx.font = '600 12px -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('main', Math.min(hx + 10, W - 40), midY + 4)

  // 同一泳道只留最靠右的一条名称，避免叠字
  ctx.font = '11px -apple-system, "PingFang SC", sans-serif'
  const byRow = new Map()
  for (const l of labels) {
    const prev = byRow.get(l.y)
    if (!prev || l.x > prev.x) byRow.set(l.y, l)
  }
  // 不同泳道间距很小时（窄屏）名称仍会上下叠在一起：按显眼程度逐条放置，与已放置的矩形相交就跳过
  const placed = []
  const candidates = [...byRow.values()].sort((m, n) => n.alpha - m.alpha || n.x - m.x)
  for (const l of candidates) {
    const w = ctx.measureText(l.text).width
    const x = Math.max(4, Math.min(l.x, W - w - 8))
    const box = { x0: x - 2, x1: x + w + 2, y0: l.y - 8, y1: l.y + 6 }
    if (Math.abs(l.y - midY) < 8 || placed.some((q) => box.x0 < q.x1 && q.x0 < box.x1 && box.y0 < q.y1 && q.y0 < box.y1)) continue
    placed.push(box)
    ctx.globalAlpha = l.alpha
    ctx.fillStyle = l.color
    ctx.fillText(l.text, x, l.y + 4)
  }
  ctx.globalAlpha = 1

  return { T, mainCount, active, merged, labels: placed.length }
}
