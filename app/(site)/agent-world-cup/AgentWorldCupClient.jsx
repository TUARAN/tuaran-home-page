'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as echarts from 'echarts/core'
import { PieChart, MapChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, VisualMapComponent, GeoComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { WC_INFO, GROUPS, MATCHES, VENUES, NEWS } from './data'

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

/* ━━━ design tokens ━━━ */
const D = {
  bg: '#050810',
  bg2: '#0c1222',
  bg3: '#131b30',
  gold: '#d4a853',
  goldDim: '#8b7335',
  neon: '#00f0ff',
  neonDim: '#0a6e7a',
  fire: '#ff4d2e',
  green: '#00e676',
  text: '#eef0f6',
  text2: '#8a92a8',
  text3: '#555d75',
  line: '#1a2340',
  glass: 'rgba(12,18,34,0.75)',
}

/* ━━━ helpers ━━━ */
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

/* ━━━ animated background particles ━━━ */
function BgCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }))
    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = hexToRgba(D.gold, p.alpha)
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 -z-10 pointer-events-none" />
}

/* ━━━ tab buttons ━━━ */
const TABS = [
  { key: 'schedule', label: '赛程', icon: '⚽' },
  { key: 'groups', label: '分组', icon: '🏆' },
  { key: 'venues', label: '场馆', icon: '🏟️' },
  { key: 'news', label: '资讯', icon: '📰' },
]

/* ━━━ countdown hook ━━━ */
function useCountdown(targetStr) {
  const [diff, setDiff] = useState('')
  useEffect(() => {
    const target = new Date('2026-07-19T15:00:00-04:00')
    function tick() {
      const now = new Date()
      const ms = target - now
      if (ms <= 0) { setDiff('已开赛'); return }
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setDiff(`${d}d ${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetStr])
  return diff
}

/* ━━━ sub components ━━━ */

function HeroSection() {
  const countdown = useCountdown()
  return (
    <div className="relative overflow-hidden py-16 md:py-24 px-4 text-center">
      {/* decorative lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[var(--wc-gold)] to-transparent opacity-40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[var(--wc-gold)] to-transparent opacity-20" />

      <p
        className="text-[10px] tracking-[0.35em] uppercase mb-4"
        style={{ color: D.gold }}
      >
        FIFA World Cup 2026 · 48 Teams · 104 Matches
      </p>
      <h1
        className="text-[48px] md:text-[72px] font-black leading-[0.95] tracking-tight mb-2"
        style={{ color: D.text, textShadow: `0 0 60px ${hexToRgba(D.gold, 0.3)}` }}
      >
        AGENT
        <br />
        <span style={{ color: D.gold }}>WORLD CUP</span>
      </h1>
      <p className="text-[13px] mt-4 mb-8" style={{ color: D.text2 }}>
        🇺🇸 美国 · 🇨🇦 加拿大 · 🇲🇽 墨西哥 &nbsp;|&nbsp; {WC_INFO.dates}
      </p>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <div
          className="px-6 py-3 rounded-md text-[11px] tracking-[0.15em] uppercase font-bold"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(D.gold, 0.15)}, ${hexToRgba(D.gold, 0.05)})`,
            border: `1px solid ${hexToRgba(D.gold, 0.3)}`,
            color: D.gold,
          }}
        >
          决赛倒计时 &nbsp;{countdown}
        </div>
      </div>
      {/* stat row */}
      <div className="flex justify-center gap-8 mt-10 flex-wrap">
        {[
          { label: '参赛队伍', value: '48' },
          { label: '比赛场次', value: '104' },
          { label: '主办城市', value: '16' },
          { label: '比赛天数', value: '39' },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-[28px] font-black" style={{ color: D.gold }}>{s.value}</div>
            <div className="text-[10px] tracking-[0.1em] uppercase mt-1" style={{ color: D.text3 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchCard({ m }) {
  const isLive = m.status === 'live'
  const isDone = m.status === 'done'
  const borderColor = isLive ? D.fire : isDone ? D.green : D.line
  return (
    <div
      className="rounded-lg p-4 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: D.bg2,
        border: `1px solid ${borderColor}`,
        boxShadow: isLive ? `0 0 20px ${hexToRgba(D.fire, 0.15)}` : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.1em] uppercase font-bold" style={{ color: D.text3 }}>
          {m.group}组 · 第{m.round}轮
        </span>
        {isLive ? (
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse"
            style={{ background: hexToRgba(D.fire, 0.2), color: D.fire }}
          >
            ● LIVE
          </span>
        ) : isDone ? (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: hexToRgba(D.green, 0.15), color: D.green }}>
            已结束
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: D.neonDim }}>
            {m.date} {m.time}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[18px]">{m.homeFlag}</span>
          <span className="text-[14px] font-semibold truncate" style={{ color: D.text }}>{m.home}</span>
        </div>
        <div className="text-center px-3 shrink-0">
          {m.score ? (
            <span className="text-[20px] font-black" style={{ color: D.gold }}>{m.score}</span>
          ) : (
            <span className="text-[12px] font-bold" style={{ color: D.neon }}>VS</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-[14px] font-semibold truncate" style={{ color: D.text }}>{m.away}</span>
          <span className="text-[18px]">{m.awayFlag}</span>
        </div>
      </div>
      <div className="text-[10px] mt-2" style={{ color: D.text3 }}>📍 {m.venue}</div>
    </div>
  )
}

function ScheduleTab() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? MATCHES : MATCHES.filter((m) => m.status === filter)
  const rounds = [
    { key: 'all', label: '全部' },
    { key: 'done', label: '已结束' },
    { key: 'live', label: '进行中' },
    { key: 'upcoming', label: '未开始' },
  ]
  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {rounds.map((r) => (
          <button
            key={r.key}
            onClick={() => setFilter(r.key)}
            className="px-4 py-1.5 rounded text-[11px] font-bold tracking-[0.05em] transition-all"
            style={{
              background: filter === r.key ? hexToRgba(D.gold, 0.2) : D.bg3,
              color: filter === r.key ? D.gold : D.text3,
              border: `1px solid ${filter === r.key ? hexToRgba(D.gold, 0.4) : D.line}`,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((m) => (
          <MatchCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  )
}

function GroupCard({ group }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: D.bg2, border: `1px solid ${D.line}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-8 h-8 rounded-md flex items-center justify-center text-[14px] font-black"
          style={{ background: hexToRgba(D.gold, 0.15), color: D.gold, border: `1px solid ${hexToRgba(D.gold, 0.3)}` }}
        >
          {group.id}
        </span>
        <span className="text-[12px] font-bold tracking-[0.05em]" style={{ color: D.text2 }}>
          第 {group.id} 组
        </span>
      </div>
      <div className="space-y-2">
        {group.teams.map((team, i) => (
          <div
            key={team}
            className="flex items-center gap-3 px-3 py-2 rounded"
            style={{ background: D.bg3 }}
          >
            <span className="text-[18px]">{group.flags[i]}</span>
            <span className="text-[13px] font-medium" style={{ color: D.text }}>{team}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupsTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {GROUPS.map((g) => (
        <GroupCard key={g.id} group={g} />
      ))}
    </div>
  )
}

function VenueCard({ v }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: D.bg2, border: `1px solid ${D.line}` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-[20px] mr-2">{v.country}</span>
          <span className="text-[15px] font-bold" style={{ color: D.text }}>{v.city}</span>
        </div>
        {v.note && (
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
            style={{ background: hexToRgba(D.gold, 0.15), color: D.gold, border: `1px solid ${hexToRgba(D.gold, 0.3)}` }}
          >
            {v.note}
          </span>
        )}
      </div>
      <p className="text-[12px]" style={{ color: D.text2 }}>{v.name}</p>
      <p className="text-[11px] mt-1" style={{ color: D.text3 }}>容量: {v.capacity}</p>
    </div>
  )
}

function VenuesTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {VENUES.map((v) => (
        <VenueCard key={v.city} v={v} />
      ))}
    </div>
  )
}

function NewsCard({ n }) {
  return (
    <div
      className="rounded-lg p-5 transition-all hover:translate-x-1"
      style={{ background: D.bg2, borderLeft: `3px solid ${D.gold}` }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className="px-2 py-0.5 rounded text-[9px] font-bold"
          style={{ background: hexToRgba(D.neon, 0.1), color: D.neon }}
        >
          {n.tag}
        </span>
        <span className="text-[10px]" style={{ color: D.text3 }}>{n.date}</span>
      </div>
      <h3 className="text-[15px] font-bold mb-1" style={{ color: D.text }}>{n.title}</h3>
      <p className="text-[12px] leading-relaxed" style={{ color: D.text2 }}>{n.desc}</p>
    </div>
  )
}

function NewsTab() {
  return (
    <div className="space-y-3">
      {NEWS.map((n) => (
        <NewsCard key={n.id} n={n} />
      ))}
    </div>
  )
}

/* ━━━ milestones ticker ━━━ */
function MilestoneTicker() {
  return (
    <div
      className="overflow-hidden py-3 mb-8"
      style={{ borderTop: `1px solid ${D.line}`, borderBottom: `1px solid ${D.line}` }}
    >
      <div className="flex gap-8 animate-[scroll_30s_linear_infinite] whitespace-nowrap">
        {[...WC_INFO.milestones, ...WC_INFO.milestones].map((m, i) => (
          <span key={i} className="text-[11px] tracking-[0.05em]" style={{ color: D.text3 }}>
            <span style={{ color: D.gold }}>{m.date}</span> &nbsp;{m.event} &nbsp;📍{m.venue}
            &nbsp;&nbsp;|&nbsp;&nbsp;
          </span>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

/* ━━━ main ━━━ */
export default function AgentWorldCupClient() {
  const [tab, setTab] = useState('schedule')

  return (
    <div
      className="min-h-screen relative"
      style={{ background: D.bg, color: D.text, fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >
      <BgCanvas />

      <div className="max-w-[1100px] mx-auto px-4 relative z-10">
        <HeroSection />
        <MilestoneTicker />

        {/* tab bar */}
        <div className="flex gap-1 mb-8 p-1 rounded-lg" style={{ background: D.bg2 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[12px] font-bold tracking-[0.05em] transition-all"
              style={{
                background: tab === t.key ? hexToRgba(D.gold, 0.12) : 'transparent',
                color: tab === t.key ? D.gold : D.text3,
                border: tab === t.key ? `1px solid ${hexToRgba(D.gold, 0.3)}` : '1px solid transparent',
              }}
            >
              <span className="text-[14px]">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* content */}
        {tab === 'schedule' && <ScheduleTab />}
        {tab === 'groups' && <GroupsTab />}
        {tab === 'venues' && <VenuesTab />}
        {tab === 'news' && <NewsTab />}

        {/* footer */}
        <footer className="mt-16 py-8 text-center" style={{ borderTop: `1px solid ${D.line}` }}>
          <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color: D.text3 }}>
            Agent World Cup 2026 · 数据来源: FIFA & Open Source · 赛程以 FIFA 官方公布为准
          </p>
        </footer>
      </div>
    </div>
  )
}