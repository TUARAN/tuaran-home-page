'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  yellow: '#ffd54a',
  red: '#ff5252',
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

function fmtRelativeTime(unixSec) {
  if (!unixSec) return '从未更新'
  const diff = Math.floor(Date.now() / 1000 - unixSec)
  if (diff < 60) return `${diff} 秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${Math.floor(diff / 86400)} 天前`
}

function flag(team) {
  // 优先用 skeleton 的 flag 映射,API 的 logo 太占字节
  return team?.flag || ''
}

/* ━━━ tabs ━━━ */
const TABS = [
  { key: 'schedule', label: '赛程', icon: '⚽' },
  { key: 'groups', label: '分组', icon: '🏆' },
  { key: 'standings', label: '积分榜', icon: '📊' },
  { key: 'rankings', label: '排行榜', icon: '🏅' },
  { key: 'venues', label: '场馆', icon: '🏟️' },
]

/* ━━━ countdown hook ━━━ */
function useCountdown() {
  const [diff, setDiff] = useState('')
  useEffect(() => {
    const target = new Date('2026-07-19T15:00:00-04:00')
    function tick() {
      const now = new Date()
      const ms = target - now
      if (ms <= 0) {
        setDiff('已开赛')
        return
      }
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setDiff(`${d}d ${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return diff
}

/* ━━━ BgCanvas (粒子背景) ━━━ */
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

/* ━━━ fetch hook ━━━ */
function useWorldCupData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/wc/data', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setErr(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // 每 60s 自动刷新
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  return { data, loading, err, reload: load }
}

/* ━━━ components ━━━ */

function MetaBar({ data }) {
  if (!data) return null
  const { meta, source } = data
  const lastAt = fmtRelativeTime(meta.lastCollectAt)
  const isStale = meta.isStale
  const status = meta.lastCollectStatus
  let badge
  if (status === 'ok' && !isStale) {
    badge = { label: 'LIVE', color: D.green }
  } else if (status === 'ok' && isStale) {
    badge = { label: 'STALE', color: D.yellow }
  } else if (status === 'error') {
    badge = { label: 'ERROR', color: D.red }
  } else {
    badge = { label: 'PENDING', color: D.text3 }
  }
  return (
    <div
      className="flex items-center justify-center gap-3 py-2 px-4 mb-6 rounded-md text-[10px] tracking-[0.1em] uppercase flex-wrap"
      style={{ background: D.bg2, border: `1px solid ${D.line}` }}
    >
      <span
        className="px-2 py-0.5 rounded font-bold"
        style={{ background: hexToRgba(badge.color, 0.15), color: badge.color }}
      >
        ● {badge.label}
      </span>
      <span style={{ color: D.text2 }}>最后更新: {lastAt}</span>
      {isStale && (
        <span style={{ color: D.yellow }}>
          ⚠ 采集器已 2 小时未上报,显示的可能不是最新数据
        </span>
      )}
      {meta.lastCollectError && (
        <span style={{ color: D.red }}>采集错误: {meta.lastCollectError.slice(0, 80)}</span>
      )}
    </div>
  )
}

function HeroSection({ data }) {
  const countdown = useCountdown()
  const skel = data?.skeleton
  return (
    <div className="relative overflow-hidden py-16 md:py-24 px-4 text-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[var(--wc-gold)] to-transparent opacity-40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[var(--wc-gold)] to-transparent opacity-20" />

      <p className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: D.gold }}>
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
        🇺🇸 美国 · 🇨🇦 加拿大 · 🇲🇽 墨西哥 &nbsp;|&nbsp; {skel?.info?.dates || '2026.06.11 – 07.19'}
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

function statusBucket(m) {
  if (['1H', '2H', 'HT', 'LIVE', 'ET', 'P', 'BREAK'].includes(m.status_short)) return 'live'
  if (['FT', 'AET', 'PEN'].includes(m.status_short)) return 'done'
  return 'upcoming'
}

function formatMatchScore(m) {
  if (m.home_goals == null || m.away_goals == null) return null
  if (m.status_short === 'AET' || m.status_short === 'PEN') {
    const et = `${m.home_goals_et ?? 0}-${m.away_goals_et ?? 0}`
    const base = `${m.home_goals}-${m.away_goals}`
    if (m.status_short === 'PEN') {
      return `${base} (加时 ${et}) [点球 ${m.home_goals_pen ?? 0}-${m.away_goals_pen ?? 0}]`
    }
    return `${base} (加时 ${et})`
  }
  return `${m.home_goals}-${m.away_goals}`
}

function MatchCard({ m }) {
  const bucket = statusBucket(m)
  const isLive = bucket === 'live'
  const isDone = bucket === 'done'
  const borderColor = isLive ? D.fire : isDone ? D.green : D.line
  const score = formatMatchScore(m)
  return (
    <div
      className="rounded-lg p-4 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: D.bg2,
        border: `1px solid ${borderColor}`,
        boxShadow: isLive ? `0 0 20px ${hexToRgba(D.fire, 0.15)}` : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-[0.1em] uppercase font-bold" style={{ color: D.text3 }}>
          {m.group_label ? `${m.group_label}组` : m.round} · {m.match_date} {m.match_time}
        </span>
        {isLive ? (
          <span
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase animate-pulse"
            style={{ background: hexToRgba(D.fire, 0.2), color: D.fire }}
          >
            ● {m.status_elapsed ? `${m.status_elapsed}'` : 'LIVE'}
          </span>
        ) : isDone ? (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: hexToRgba(D.green, 0.15), color: D.green }}>
            已结束
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: D.neonDim }}>
            {m.match_date} {m.match_time}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {m.home_flag && /^https?:\/\//.test(m.home_flag) ? (
            <img src={m.home_flag} alt="" className="w-[20px] h-[14px] object-cover rounded-sm" />
          ) : (
            <span className="text-[18px]">{m.home_flag}</span>
          )}
          <span className="text-[14px] font-semibold truncate" style={{ color: D.text }}>{m.home_team}</span>
        </div>
        <div className="text-center px-3 shrink-0">
          {score ? (
            <span className="text-[20px] font-black" style={{ color: D.gold }}>{score}</span>
          ) : (
            <span className="text-[12px] font-bold" style={{ color: D.neon }}>VS</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-[14px] font-semibold truncate" style={{ color: D.text }}>{m.away_team}</span>
          {m.away_flag && /^https?:\/\//.test(m.away_flag) ? (
            <img src={m.away_flag} alt="" className="w-[20px] h-[14px] object-cover rounded-sm" />
          ) : (
            <span className="text-[18px]">{m.away_flag}</span>
          )}
        </div>
      </div>
      <div className="text-[10px] mt-2" style={{ color: D.text3 }}>📍 {m.city || m.venue}</div>
    </div>
  )
}

function ScheduleTab({ data }) {
  const [filter, setFilter] = useState('all')
  const matches = data?.matches || []
  const enriched = matches.map((m) => ({ ...m, _bucket: statusBucket(m) }))
  const filtered = filter === 'all' ? enriched : enriched.filter((m) => m._bucket === filter)
  const rounds = [
    { key: 'all', label: '全部' },
    { key: 'done', label: '已结束' },
    { key: 'live', label: '进行中' },
    { key: 'upcoming', label: '未开始' },
  ]
  if (!matches.length) {
    return (
      <div className="py-12 text-center" style={{ color: D.text3 }}>
        采集器尚未拉到赛程数据 · 等待 {fmtRelativeTime(data?.meta?.lastCollectAt)} 后首次同步
      </div>
    )
  }
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
          <MatchCard key={m.fixture_id} m={m} />
        ))}
      </div>
    </div>
  )
}

function GroupCard({ group }) {
  return (
    <div className="rounded-lg p-5" style={{ background: D.bg2, border: `1px solid ${D.line}` }}>
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
          <div key={team} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: D.bg3 }}>
            <span className="text-[18px]">{group.flags[i]}</span>
            <span className="text-[13px] font-medium" style={{ color: D.text }}>{team}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupsTab({ data }) {
  const groups = data?.skeleton?.groups || []
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {groups.map((g) => (
        <GroupCard key={g.id} group={g} />
      ))}
    </div>
  )
}

function StandingsTab({ data }) {
  const standings = data?.standings || []
  if (!standings.length) {
    return (
      <div className="py-12 text-center" style={{ color: D.text3 }}>
        小组赛尚未开始,或采集器暂未拉到积分
      </div>
    )
  }
  // 按 group 分组
  const byGroup = {}
  for (const row of standings) {
    if (!byGroup[row.group_label]) byGroup[row.group_label] = []
    byGroup[row.group_label].push(row)
  }
  const groupIds = Object.keys(byGroup).sort()
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groupIds.map((gid) => {
        const rows = byGroup[gid]
        return (
          <div key={gid} className="rounded-lg overflow-hidden" style={{ background: D.bg2, border: `1px solid ${D.line}` }}>
            <div
              className="px-4 py-2 text-[12px] font-bold tracking-[0.1em] uppercase flex items-center gap-2"
              style={{ background: hexToRgba(D.gold, 0.1), color: D.gold }}
            >
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-black"
                style={{ background: hexToRgba(D.gold, 0.2), color: D.gold }}
              >
                {gid}
              </span>
              第 {gid} 组
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ color: D.text3 }} className="border-b" >
                  <th className="text-left py-2 px-3 w-6">#</th>
                  <th className="text-left py-2 px-2">球队</th>
                  <th className="text-center py-2 px-1 w-7">赛</th>
                  <th className="text-center py-2 px-1 w-7">胜</th>
                  <th className="text-center py-2 px-1 w-7">平</th>
                  <th className="text-center py-2 px-1 w-7">负</th>
                  <th className="text-center py-2 px-1 w-9">净</th>
                  <th className="text-center py-2 px-2 w-8 font-bold" style={{ color: D.gold }}>分</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.group_label}-${r.team_id}`} style={{ borderTop: `1px solid ${D.line}` }}>
                    <td className="py-2 px-3" style={{ color: D.text3 }}>{r.rank}</td>
                    <td className="py-2 px-2 truncate max-w-[100px]" style={{ color: D.text }} title={r.team_name}>
                      {r.team_name}
                    </td>
                    <td className="text-center py-2 px-1" style={{ color: D.text2 }}>{r.played}</td>
                    <td className="text-center py-2 px-1" style={{ color: D.text2 }}>{r.win}</td>
                    <td className="text-center py-2 px-1" style={{ color: D.text2 }}>{r.draw}</td>
                    <td className="text-center py-2 px-1" style={{ color: D.text2 }}>{r.lose}</td>
                    <td className="text-center py-2 px-1" style={{ color: r.goal_diff > 0 ? D.green : r.goal_diff < 0 ? D.red : D.text2 }}>
                      {r.goal_diff > 0 ? `+${r.goal_diff}` : r.goal_diff}
                    </td>
                    <td className="text-center py-2 px-2 font-black" style={{ color: D.gold }}>{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function RankingsTabs({ data }) {
  const [sub, setSub] = useState('scorers')
  const scorers = data?.scorers || []
  const assists = data?.assists || []
  const cards = data?.cards || []
  const subs = [
    { key: 'scorers', label: '射手榜', icon: '⚽' },
    { key: 'assists', label: '助攻榜', icon: '🎯' },
    { key: 'cards', label: '红黄牌', icon: '🟨' },
  ]
  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: D.bg2 }}>
        {subs.map((s) => (
          <button
            key={s.key}
            onClick={() => setSub(s.key)}
            className="px-4 py-2 rounded-md text-[11px] font-bold tracking-[0.05em] transition-all"
            style={{
              background: sub === s.key ? hexToRgba(D.gold, 0.12) : 'transparent',
              color: sub === s.key ? D.gold : D.text3,
              border: sub === s.key ? `1px solid ${hexToRgba(D.gold, 0.3)}` : '1px solid transparent',
            }}
          >
            <span className="mr-1">{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {sub === 'scorers' && <ScorersList rows={scorers} />}
      {sub === 'assists' && <AssistsList rows={assists} />}
      {sub === 'cards' && <CardsList rows={cards} />}
    </div>
  )
}

function PlayerRow({ rank, row, primaryKey, secondaryKey, emptyMsg, badgeColor }) {
  if (!rank && rank !== 0) {
    return (
      <div className="py-12 text-center" style={{ color: D.text3 }}>
        {emptyMsg}
      </div>
    )
  }
  return (
    <tr style={{ borderTop: `1px solid ${D.line}` }}>
      <td className="py-2.5 px-3 text-center font-black" style={{ color: badgeColor }}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </td>
      <td className="py-2.5 px-2 truncate max-w-[180px]" style={{ color: D.text }} title={row.player_name}>
        {row.player_name}
      </td>
      <td className="py-2.5 px-2 truncate max-w-[120px]" style={{ color: D.text2 }} title={row.team_name}>
        {row.team_name}
      </td>
      <td className="text-center py-2.5 px-2 font-black" style={{ color: D.gold }}>{row[primaryKey]}</td>
      {secondaryKey && (
        <td className="text-center py-2.5 px-2" style={{ color: D.text2 }}>{row[secondaryKey] ?? 0}</td>
      )}
      <td className="text-center py-2.5 px-3" style={{ color: D.text3 }}>{row.played ?? 0}</td>
    </tr>
  )
}

function ScorersList({ rows }) {
  if (!rows.length) {
    return <Empty msg="小组赛尚未进球,或采集器暂未拉到射手数据" />
  }
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: D.bg2, border: `1px solid ${D.line}` }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ color: D.text3, background: hexToRgba(D.gold, 0.05) }}>
            <th className="text-center py-2 px-3 w-12">#</th>
            <th className="text-left py-2 px-2">球员</th>
            <th className="text-left py-2 px-2">球队</th>
            <th className="text-center py-2 px-2 w-12">进球</th>
            <th className="text-center py-2 px-2 w-12">助攻</th>
            <th className="text-center py-2 px-3 w-12">出场</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <PlayerRow key={r.player_id} rank={i + 1} row={r} primaryKey="goals" secondaryKey="assists" badgeColor={D.gold} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AssistsList({ rows }) {
  if (!rows.length) {
    return <Empty msg="小组赛尚未有助攻,或采集器暂未拉到助攻数据" />
  }
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: D.bg2, border: `1px solid ${D.line}` }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ color: D.text3, background: hexToRgba(D.gold, 0.05) }}>
            <th className="text-center py-2 px-3 w-12">#</th>
            <th className="text-left py-2 px-2">球员</th>
            <th className="text-left py-2 px-2">球队</th>
            <th className="text-center py-2 px-2 w-12">助攻</th>
            <th className="text-center py-2 px-3 w-12">出场</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.player_id} style={{ borderTop: `1px solid ${D.line}` }}>
              <td className="py-2.5 px-3 text-center font-black" style={{ color: D.gold }}>
                {i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
              </td>
              <td className="py-2.5 px-2 truncate max-w-[180px]" style={{ color: D.text }} title={r.player_name}>{r.player_name}</td>
              <td className="py-2.5 px-2 truncate max-w-[120px]" style={{ color: D.text2 }} title={r.team_name}>{r.team_name}</td>
              <td className="text-center py-2.5 px-2 font-black" style={{ color: D.gold }}>{r.assists}</td>
              <td className="text-center py-2.5 px-3" style={{ color: D.text3 }}>{r.played ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CardsList({ rows }) {
  if (!rows.length) {
    return <Empty msg="小组赛尚未有红黄牌,或采集器暂未抓到 events" />
  }
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: D.bg2, border: `1px solid ${D.line}` }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ color: D.text3, background: hexToRgba(D.gold, 0.05) }}>
            <th className="text-center py-2 px-3 w-12">#</th>
            <th className="text-left py-2 px-2">球员</th>
            <th className="text-left py-2 px-2">球队</th>
            <th className="text-center py-2 px-2 w-16">类型</th>
            <th className="text-center py-2 px-3 w-12">张数</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const cardLabel = r.card_type === 'red' ? '红牌' : r.card_type === 'yellow_red' ? '两黄' : '黄牌'
            const cardColor = r.card_type === 'red' ? D.red : D.yellow
            return (
              <tr key={`${r.player_id}-${r.card_type}`} style={{ borderTop: `1px solid ${D.line}` }}>
                <td className="py-2.5 px-3 text-center font-black" style={{ color: D.text3 }}>{i + 1}</td>
                <td className="py-2.5 px-2 truncate max-w-[180px]" style={{ color: D.text }} title={r.player_name}>{r.player_name}</td>
                <td className="py-2.5 px-2 truncate max-w-[120px]" style={{ color: D.text2 }} title={r.team_name}>{r.team_name}</td>
                <td className="text-center py-2.5 px-2" style={{ color: cardColor, fontWeight: 700 }}>{cardLabel}</td>
                <td className="text-center py-2.5 px-3 font-black" style={{ color: cardColor }}>{r.count}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Empty({ msg }) {
  return (
    <div className="py-12 text-center" style={{ color: D.text3 }}>
      {msg}
    </div>
  )
}

function VenueCard({ v }) {
  return (
    <div className="rounded-lg p-4" style={{ background: D.bg2, border: `1px solid ${D.line}` }}>
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

function VenuesTab({ data }) {
  const venues = data?.skeleton?.venues || []
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {venues.map((v) => (
        <VenueCard key={v.city} v={v} />
      ))}
    </div>
  )
}

function MilestoneTicker({ data }) {
  const items = data?.skeleton?.milestones || []
  if (!items.length) return null
  return (
    <div
      className="overflow-hidden py-3 mb-8"
      style={{ borderTop: `1px solid ${D.line}`, borderBottom: `1px solid ${D.line}` }}
    >
      <div className="flex gap-8 animate-[scroll_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((m, i) => (
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
  const { data, loading, err } = useWorldCupData()

  return (
    <div
      className="min-h-screen relative"
      style={{ background: D.bg, color: D.text, fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
    >
      <BgCanvas />

      <div className="max-w-[1100px] mx-auto px-4 relative z-10">
        <HeroSection data={data} />
        <MilestoneTicker data={data} />
        <MetaBar data={data} />

        {err && (
          <div className="mb-4 px-4 py-2 rounded text-[11px]" style={{ background: hexToRgba(D.red, 0.1), color: D.red, border: `1px solid ${hexToRgba(D.red, 0.3)}` }}>
            数据拉取失败: {err} · 页面将在 60s 后自动重试
          </div>
        )}

        <div className="flex gap-1 mb-8 p-1 rounded-lg overflow-x-auto" style={{ background: D.bg2 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-[12px] font-bold tracking-[0.05em] transition-all whitespace-nowrap"
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

        {loading && !data ? (
          <div className="py-20 text-center" style={{ color: D.text3 }}>
            加载中…
          </div>
        ) : (
          <>
            {tab === 'schedule' && <ScheduleTab data={data} />}
            {tab === 'groups' && <GroupsTab data={data} />}
            {tab === 'standings' && <StandingsTab data={data} />}
            {tab === 'rankings' && <RankingsTabs data={data} />}
            {tab === 'venues' && <VenuesTab data={data} />}
          </>
        )}

        <footer className="mt-16 py-8 text-center" style={{ borderTop: `1px solid ${D.line}` }}>
          <p className="text-[10px] tracking-[0.1em] uppercase" style={{ color: D.text3 }}>
            Agent World Cup 2026 · 数据来源: openfootball · 定时每 10 分钟自动同步
          </p>
        </footer>
      </div>
    </div>
  )
}
