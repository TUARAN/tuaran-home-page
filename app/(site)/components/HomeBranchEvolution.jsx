'use client'

import { useEffect, useRef, useState } from 'react'

import { drawBranchEvolution, prepareBranchEvolution } from '../../../lib/home/branchEvolution.mjs'
import { T } from './LocaleProvider'

const DATA_URL = '/data/git-branch-evolution.json'
const SPEEDS = [
  { value: 12, zh: '慢速' },
  { value: 30, zh: '1×' },
  { value: 80, zh: '快速' },
  { value: 200, zh: '极速' },
]
const WINDOWS = [
  { value: 0, zh: '全景' },
  { value: 800, zh: '近 800 提交' },
  { value: 300, zh: '近 300 提交' },
  { value: 120, zh: '近 120 提交' },
]
const DEFAULT_SPEED = 80
const DEFAULT_WINDOW = 0
const LEGEND = [
  { color: '#58a6ff', zh: 'main', en: 'main' },
  { color: '#d2a8ff', zh: '已合入', en: 'Merged' },
  { color: '#3fb950', zh: '进行中', en: 'Open' },
  { color: '#6e7681', zh: '已搁置', en: 'Parked' },
]

const fmtDate = (t) => new Date(t * 1000).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

export default function HomeBranchEvolution() {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const viewRef = useRef({ p: 0, playing: true, speed: DEFAULT_SPEED, win: DEFAULT_WINDOW, visible: false })
  const [model, setModel] = useState(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  const [win, setWin] = useState(DEFAULT_WINDOW)
  const [hud, setHud] = useState({ date: '', main: 0, active: 0, merged: 0, seek: 0 })

  // 滚动到附近才加载数据；离开视口时停止推进与绘制
  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    let loaded = false
    const io = new IntersectionObserver(([entry]) => {
      viewRef.current.visible = entry.isIntersecting
      if (entry.isIntersecting && !loaded) {
        loaded = true
        fetch(DATA_URL)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then((raw) => setModel(prepareBranchEvolution(raw)))
          .catch(() => setFailed(true))
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!model) return undefined
    const view = viewRef.current
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      view.p = model.p1
      view.playing = false
      setPlaying(false)
    }
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    let raf = 0, last = performance.now(), lastHud = 0, dirty = true

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const W = cv.clientWidth, H = cv.clientHeight
      if (!W || !H) return
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr)
        cv.height = Math.round(H * dpr)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const r = drawBranchEvolution(ctx, model, view, W, H)
      // 播放中节流 HUD；暂停、拖动、播完时每帧都要刷新，否则会停在旧日期
      if (!view.playing || performance.now() - lastHud > 120) {
        lastHud = performance.now()
        setHud({ date: fmtDate(r.T), main: r.mainCount, active: r.active, merged: r.merged, seek: Math.round(view.p / model.p1 * 1000) })
      }
    }

    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (view.visible) {
        if (view.playing) {
          view.p = Math.min(model.p1, view.p + dt * view.speed)
          if (view.p >= model.p1) { view.playing = false; setPlaying(false) }
          dirty = true
        }
        if (dirty || view.dirty) { render(); dirty = false; view.dirty = false }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const onResize = () => { view.dirty = true }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [model])

  const view = viewRef.current
  const togglePlay = () => {
    if (!model) return
    if (view.p >= model.p1) view.p = 0
    view.playing = !view.playing
    setPlaying(view.playing)
  }
  const restart = () => { view.p = 0; view.playing = true; setPlaying(true) }
  const onSeek = (e) => { if (model) { view.p = model.p1 * Number(e.target.value) / 1000; view.dirty = true } }
  const onSpeed = (e) => { view.speed = Number(e.target.value); setSpeed(view.speed) }
  const onWin = (e) => { view.win = Number(e.target.value); view.dirty = true; setWin(view.win) }

  if (failed) return null

  const controlClass = 'shrink-0 rounded-md border border-[#30363d] bg-[#161b22] px-2 py-0.5 text-[12px] text-[#c9d1d9] disabled:opacity-50'

  return (
    <section ref={rootRef} className="home-download-section home-branch-evolution" aria-labelledby="home-branch-evolution-title">
      <div className="home-work-heading">
        <div>
          <p className="home-kicker">Git · {model ? <T zh={`快照 ${model.generatedAt}`} en={`Snapshot ${model.generatedAt}`} /> : 'tuaran-home-page'}</p>
          <h2 id="home-branch-evolution-title" className="home-section-title">
            <T zh="本站分支演进" en="How this site branched" />
          </h2>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-[#252d36] bg-[#0d1117] text-[#c9d1d9]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 pt-2 text-[11px] tabular-nums text-[#8b949e]">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[13px] font-semibold text-[#f0f6fc]">{hud.date || '—'}</span>
            <span><T zh="main" en="main" /> <b className="text-[#f0f6fc]">{hud.main}</b></span>
            <span><T zh="并行" en="Active" /> <b className="text-[#f0f6fc]">{hud.active}</b></span>
            <span><T zh="已合入" en="Merged" /> <b className="text-[#f0f6fc]">{hud.merged}</b></span>
          </div>
          <div className="flex flex-wrap gap-x-2.5">
            {LEGEND.map((item) => (
              <span key={item.zh}>
                <i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />
                <T zh={item.zh} en={item.en} />
              </span>
            ))}
          </div>
        </div>
        <canvas ref={canvasRef} className="block h-[200px] w-full md:h-[240px]" role="img" aria-label="本站 Git 分支演进动画" />
        <div className="flex items-center gap-2 border-t border-[#21262d] px-3 py-2">
          <button type="button" className={controlClass} onClick={togglePlay} disabled={!model} aria-label={playing ? '暂停' : '播放'}>
            {playing ? '⏸' : '▶'}
          </button>
          <button type="button" className={controlClass} onClick={restart} disabled={!model} aria-label="重播">
            ⟲
          </button>
          <select className={`${controlClass} hidden sm:block`} value={speed} onChange={onSpeed} aria-label="播放速度">
            {SPEEDS.map((o) => <option key={o.value} value={o.value}>{o.zh}</option>)}
          </select>
          <select className={`${controlClass} hidden sm:block`} value={win} onChange={onWin} aria-label="镜头范围">
            {WINDOWS.map((o) => <option key={o.value} value={o.value}>{o.zh}</option>)}
          </select>
          <input
            type="range"
            min="0"
            max="1000"
            value={hud.seek}
            onChange={onSeek}
            disabled={!model}
            className="min-w-0 flex-1 accent-[#58a6ff]"
            aria-label="播放进度"
          />
        </div>
      </div>
    </section>
  )
}
