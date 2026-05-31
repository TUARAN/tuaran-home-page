'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'

const ThreeSolarSystem = dynamic(() => import('./ThreeSolarSystem'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[280px] w-full items-center justify-center rounded-[24px] border border-[#243244] bg-[#07101d] text-sm font-semibold text-[#dbeafe]">
      加载 3D 星球模型…
    </div>
  ),
})

const SYNODIC_MONTH = 29.53
const FOCUSED_LOCATION = {
  name: '广州',
  latitude: 23.13,
  longitude: 113.26,
  timezone: 'Asia/Shanghai',
}
const PHASES = [
  { at: 0, name: '朔 / 新月', note: '月球在太阳方向附近，夜空中不易看见' },
  { at: 3.7, name: '蛾眉月', note: '傍晚西方低空可见一弯亮边' },
  { at: 7.4, name: '上弦月', note: '右半边明亮，约中午升起、午夜落下' },
  { at: 11.1, name: '盈凸月', note: '亮面继续扩大，黄昏后东南方升起' },
  { at: 14.8, name: '望 / 满月', note: '太阳落下时月亮升起，整夜可见' },
  { at: 18.5, name: '亏凸月', note: '亮面开始缩小，后半夜更明显' },
  { at: 22.1, name: '下弦月', note: '左半边明亮，约午夜升起、中午落下' },
  { at: 25.8, name: '残月', note: '黎明前东方低空可见细弯月' },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatTime(hours) {
  const normalized = ((hours % 24) + 24) % 24
  const h = Math.floor(normalized)
  const m = Math.round((normalized - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m === 60 ? 0 : m).padStart(2, '0')}`
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: FOCUSED_LOCATION.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function getChinaHour(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: FOCUSED_LOCATION.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0)
  return (hour % 24) + minute / 60
}

function getDayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0))
  const diff = date - start
  return Math.floor(diff / 86400000)
}

function getSeasonFromDate(date) {
  const day = getDayOfYear(date)
  const declination = 23.44 * Math.sin(((day - 80) / 365.24) * Math.PI * 2)
  return clamp(declination / 23.44, -1, 1)
}

function getMoonAgeFromDate(date) {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const days = (date.getTime() - knownNewMoon) / 86400000
  return ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
}

function describePhase(day) {
  const age = ((day % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const phase = age / SYNODIC_MONTH
  const illumination = Math.round(((1 - Math.cos(phase * Math.PI * 2)) / 2) * 100)
  const current = PHASES.reduce((best, item) => {
    const distance = Math.min(Math.abs(age - item.at), SYNODIC_MONTH - Math.abs(age - item.at))
    return distance < best.distance ? { ...item, distance } : best
  }, { ...PHASES[0], distance: Infinity })

  return { age, phase, illumination, name: current.name, note: current.note }
}

function solarModel({ time, latitude, season }) {
  const lat = (latitude * Math.PI) / 180
  const declination = ((23.44 * season) * Math.PI) / 180
  const cosHourAngle = clamp(-Math.tan(lat) * Math.tan(declination), -1, 1)
  const dayLength = (2 * Math.acos(cosHourAngle) * 180) / Math.PI / 15
  const sunrise = 12 - dayLength / 2
  const sunset = 12 + dayLength / 2
  const maxAltitude = clamp(90 - Math.abs(latitude - 23.44 * season), 18, 88)
  const progress = clamp((time - sunrise) / dayLength, 0, 1)
  const visible = time >= sunrise && time <= sunset
  const altitude = visible ? Math.sin(progress * Math.PI) * maxAltitude : 0
  return { sunrise, sunset, dayLength, maxAltitude, progress, visible, altitude }
}

function moonSkyModel({ time, phase, maxAltitude }) {
  const moonRise = (6 + phase * 24) % 24
  const aboveHours = 12.4
  const elapsed = (time - moonRise + 24) % 24
  const visible = elapsed <= aboveHours
  const progress = clamp(elapsed / aboveHours, 0, 1)
  const altitude = visible ? Math.sin(progress * Math.PI) * clamp(maxAltitude - 8, 18, 72) : 0
  return { moonRise, moonSet: (moonRise + aboveHours) % 24, elapsed, progress, visible, altitude }
}

function PhaseIcon({ phase, size = 112 }) {
  const rawId = useId()
  const safeId = rawId.replaceAll(':', '')
  const darkId = `${safeId}-moon-dark`
  const lightId = `${safeId}-moon-light`
  const clipId = `${safeId}-moon-disc`
  const angle = phase * Math.PI * 2
  const terminatorX = 50 + Math.cos(angle) * 44
  const isWaxing = phase <= 0.5
  let lightPath = ''

  if (phase < 0.015 || phase > 0.985) {
    lightPath = ''
  } else if (Math.abs(phase - 0.5) < 0.015) {
    lightPath = 'M50 6A44 44 0 1 1 49.9 6Z'
  } else if (isWaxing) {
    lightPath = `M50 6A44 44 0 0 1 50 94Q${terminatorX.toFixed(2)} 50 50 6Z`
  } else {
    lightPath = `M50 6A44 44 0 0 0 50 94Q${terminatorX.toFixed(2)} 50 50 6Z`
  }

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="drop-shadow-[0_12px_26px_rgba(15,23,42,0.28)]" aria-hidden="true">
      <defs>
        <radialGradient id={darkId} cx="35%" cy="28%" r="74%">
          <stop offset="0%" stopColor="#7e8796" />
          <stop offset="58%" stopColor="#334155" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
        <radialGradient id={lightId} cx="34%" cy="26%" r="70%">
          <stop offset="0%" stopColor="#fff9d7" />
          <stop offset="62%" stopColor="#f1e7bb" />
          <stop offset="100%" stopColor="#b8a77a" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="44" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="44" fill={`url(#${darkId})`} />
      {lightPath ? <path d={lightPath} fill={`url(#${lightId})`} clipPath={`url(#${clipId})`} /> : null}
      <circle cx="37" cy="34" r="3.1" fill="rgba(255,255,255,0.18)" />
      <circle cx="61" cy="63" r="4.2" fill="rgba(0,0,0,0.14)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="1.2" />
    </svg>
  )
}

function IconButton({ children, label, onClick, active = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={[
        'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all',
        active
          ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-[0_10px_24px_rgba(30,58,95,0.22)]'
          : 'border-[#d9cfbd] bg-white/85 text-[#3b352c] hover:-translate-y-0.5 hover:border-[#b8aa90] dark:border-[#344152] dark:bg-[#121a24] dark:text-gray-100 dark:hover:border-[#536175]',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#e6ddcf] bg-white/78 px-4 py-3 dark:border-[#2b3542] dark:bg-[#121922]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8d806d] dark:text-[#95a0af]">{label}</div>
      <div className="mt-1 break-words text-[clamp(0.88rem,2vw,1.125rem)] font-semibold leading-tight text-[#211d17] dark:text-gray-100">{value}</div>
    </div>
  )
}

function CompactMetric({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#eadfce] py-2.5 last:border-b-0 dark:border-[#263341]">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8d806d] dark:text-[#95a0af]">{label}</span>
      <span className="min-w-0 text-right text-[15px] font-semibold leading-snug text-[#211d17] dark:text-gray-100">{value}</span>
    </div>
  )
}

function SpaceSystemView({ phaseInfo, season, time, yearProgress, orbitRunKey, location }) {
  return (
    <ThreeSolarSystem
      phase={phaseInfo.phase}
      season={season}
      time={time}
      yearProgress={yearProgress}
      orbitRunKey={orbitRunKey}
      location={location}
    />
  )
}

export default function SunMoonMotionClient() {
  const [time, setTime] = useState(8)
  const [moonDay, setMoonDay] = useState(5)
  const [latitude, setLatitude] = useState(Math.round(FOCUSED_LOCATION.latitude))
  const [season, setSeason] = useState(0.45)
  const [playing, setPlaying] = useState(false)
  const [currentDate, setCurrentDate] = useState(null)
  const [orbitRunKey, setOrbitRunKey] = useState(0)

  const syncToNow = useCallback(() => {
    const now = new Date()
    setCurrentDate(now)
    setTime(getChinaHour(now))
    setMoonDay(getMoonAgeFromDate(now))
    setLatitude(Math.round(FOCUSED_LOCATION.latitude))
    setSeason(getSeasonFromDate(now))
  }, [])

  useEffect(() => {
    syncToNow()
  }, [syncToNow])

  useEffect(() => {
    if (!playing) return undefined
    syncToNow()
    const id = window.setInterval(syncToNow, 1000)
    return () => window.clearInterval(id)
  }, [playing, syncToNow])

  const phaseInfo = useMemo(() => describePhase(moonDay), [moonDay])
  const sun = useMemo(() => solarModel({ time, latitude, season }), [time, latitude, season])
  const moon = useMemo(
    () => moonSkyModel({ time, phase: phaseInfo.phase, maxAltitude: sun.maxAltitude }),
    [time, phaseInfo.phase, sun.maxAltitude]
  )
  const presets = [
    { label: '新月', value: 0 },
    { label: '上弦', value: 7.4 },
    { label: '满月', value: 14.8 },
    { label: '下弦', value: 22.1 },
  ]
  const focusedStatus = sun.visible ? '白昼' : '夜晚'
  const currentDateLabel = currentDate ? formatDateTime(currentDate) : '同步中'
  const yearProgress = currentDate ? getDayOfYear(currentDate) / 365.24 : 0.42

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f5f0] px-4 py-6 text-[#28231c] dark:bg-[#0b1016] dark:text-gray-100 md:py-9">
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="mb-6 grid gap-5 rounded-[28px] border border-[#e2d8c7] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,241,232,0.9))] p-5 shadow-[0_18px_60px_rgba(86,70,42,0.08)] dark:border-[#26313f] dark:bg-[linear-gradient(135deg,rgba(18,25,35,0.96),rgba(10,15,23,0.92))] md:grid-cols-[minmax(0,1fr)_320px] md:p-7">
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[#9d8f76] dark:text-[#94a1b4]">Interactive Research</p>
            <h1 className="mb-3 max-w-[720px] font-serif text-[1.8rem] font-semibold tracking-[0.02em] text-[#1d1a16] dark:text-gray-100 md:text-[2.38rem]">
              日月运行交互可视化专题
            </h1>
            <p className="mb-0 max-w-[760px] text-[15px] leading-[1.85] text-[#5e5548] dark:text-gray-300">
              用日心视角把太阳、地球、月球放在同一个可操作模型里：太阳位于系统中心，地球绕太阳公转并自转，月球绕地运行形成月相循环。参数为近似模型，用于我自己的专题探索、现象复盘和长期专研记录。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="定位城市" value={FOCUSED_LOCATION.name} />
            <Stat label="广州时间" value={formatTime(time)} />
            <Stat label="月相" value={phaseInfo.name} />
            <Stat label="当前状态" value={focusedStatus} />
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <SpaceSystemView
              phaseInfo={phaseInfo}
              time={time}
              location={FOCUSED_LOCATION}
              season={season}
              yearProgress={yearProgress}
              orbitRunKey={orbitRunKey}
            />

            <div className="rounded-[24px] border border-[#e2d8c7] bg-[#fcfaf5] p-5 dark:border-[#283342] dark:bg-[#101720]">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9b8e78] dark:text-[#93a0b3]">Research Controls</p>
                  <h2 className="mb-0 border-b-0 pb-0 text-[1.15rem] font-semibold text-[#211d17] dark:text-gray-100">专题探索控制台</h2>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton label={playing ? '暂停实时同步' : '实时同步'} active={playing} onClick={() => setPlaying((value) => !value)}>
                    {playing ? (
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M6 4h2.5v12H6V4Zm5.5 0H14v12h-2.5V4Z" /></svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M6.5 4.8v10.4L15 10 6.5 4.8Z" /></svg>
                    )}
                  </IconButton>
                  <IconButton label="同步当前时间" onClick={syncToNow}>
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5.2 6.2A6 6 0 1 1 4 10" strokeLinecap="round" /><path d="M5.2 3.5v2.7h2.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </IconButton>
                  <IconButton label="运行一圈" onClick={() => setOrbitRunKey((value) => value + 1)}>
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                      <path d="M15.5 7.3A6 6 0 0 0 4.4 6.1" strokeLinecap="round" />
                      <path d="M15.5 4.4v2.9h-2.9" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.5 12.7a6 6 0 0 0 11.1 1.2" strokeLinecap="round" />
                      <path d="M4.5 15.6v-2.9h2.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 flex justify-between text-sm font-medium text-[#40382d] dark:text-gray-200"><span>一天中的时间</span><span>{formatTime(time)}</span></span>
                  <input className="w-full accent-[#1e3a5f]" type="range" min="0" max="23.99" step="0.05" value={time} onChange={(e) => setTime(Number(e.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-2 flex justify-between text-sm font-medium text-[#40382d] dark:text-gray-200"><span>月龄</span><span>{phaseInfo.age.toFixed(1)} 天</span></span>
                  <input className="w-full accent-[#1e3a5f]" type="range" min="0" max={SYNODIC_MONTH} step="0.1" value={moonDay} onChange={(e) => setMoonDay(Number(e.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-2 flex justify-between text-sm font-medium text-[#40382d] dark:text-gray-200"><span>观察纬度</span><span>{latitude}°N</span></span>
                  <input className="w-full accent-[#1e3a5f]" type="range" min="0" max="55" step="1" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} />
                </label>
                <label className="block">
                  <span className="mb-2 flex justify-between text-sm font-medium text-[#40382d] dark:text-gray-200"><span>季节倾向</span><span>{season < -0.35 ? '冬季' : season > 0.35 ? '夏季' : '春秋'}</span></span>
                  <input className="w-full accent-[#1e3a5f]" type="range" min="-1" max="1" step="0.05" value={season} onChange={(e) => setSeason(Number(e.target.value))} />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {presets.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMoonDay(item.value)}
                    className="rounded-full border border-[#d8cfbf] bg-white/78 px-3 py-1.5 text-[13px] font-medium text-[#4b4235] transition hover:-translate-y-0.5 hover:border-[#a99a82] dark:border-[#344152] dark:bg-[#121a24] dark:text-gray-100 dark:hover:border-[#536175]"
                  >
                    {item.label}
                  </button>
                ))}
                <span className="ml-auto rounded-full border border-[#d8cfbf] bg-white/70 px-3 py-1.5 text-[12px] font-medium text-[#5f5548] dark:border-[#344152] dark:bg-[#121a24] dark:text-gray-300">
                  3D 位置按当前时间与月龄同步
                </span>
              </div>
            </div>
          </div>

          <aside className="min-w-0 space-y-5">
            <div className="overflow-hidden rounded-[24px] border border-[#e5dccf] bg-[#fcfaf5] p-5 dark:border-[#283342] dark:bg-[#101720]">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9b8e78] dark:text-[#93a0b3]">Location State</p>
              <h2 className="mb-3 border-b-0 pb-0 text-[1.08rem] font-semibold leading-snug text-[#211d17] dark:text-gray-100">广州当前观测状态</h2>
              <div className="rounded-2xl border border-[#eadfce] bg-white/62 px-3 dark:border-[#263341] dark:bg-[#111923]">
                <CompactMetric label="时间" value={currentDateLabel} />
                <CompactMetric label="经纬度" value={`${FOCUSED_LOCATION.latitude.toFixed(2)}°N / ${FOCUSED_LOCATION.longitude.toFixed(2)}°E`} />
                <CompactMetric label="昼夜" value={focusedStatus} />
                <CompactMetric label="日出日落" value={`${formatTime(sun.sunrise)} / ${formatTime(sun.sunset)}`} />
                <CompactMetric label="太阳高度" value={sun.visible ? `${Math.round(sun.altitude)}°` : '地平线下'} />
                <CompactMetric label="月出月落" value={`${formatTime(moon.moonRise)} / ${formatTime(moon.moonSet)}`} />
                <CompactMetric label="月龄" value={`${phaseInfo.age.toFixed(1)} 天`} />
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#e5dccf] bg-[#fcfaf5] p-5 dark:border-[#283342] dark:bg-[#101720]">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <PhaseIcon phase={phaseInfo.phase} size={104} />
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9b8e78] dark:text-[#93a0b3]">Lunar Phase</p>
                  <h2 className="mb-1 border-b-0 pb-0 text-[1.18rem] font-semibold text-[#211d17] dark:text-gray-100">{phaseInfo.name}</h2>
                  <p className="mb-0 text-[13px] leading-6 text-[#655d50] dark:text-gray-300">{phaseInfo.note}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="亮面比例" value={`${phaseInfo.illumination}%`} />
                <Stat label="月落" value={formatTime(moon.moonSet)} />
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#e5dccf] bg-[#fcfaf5] p-5 dark:border-[#283342] dark:bg-[#101720]">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9b8e78] dark:text-[#93a0b3]">Research Notes</p>
              <h2 className="mb-3 border-b-0 pb-0 text-[1.15rem] font-semibold text-[#211d17] dark:text-gray-100">专研观察点</h2>
              <ul className="m-0 space-y-3 pl-4 text-[14px] leading-7 text-[#5e5548] dark:text-gray-300">
                <li>拖动时间，观察地球上的观察点如何从昼半球转入夜半球。</li>
                <li>讨论“太阳东升西落”为什么是地球自转造成的视运动。</li>
                <li>观察主图中的太阳中心、地球公转轨道，以及月球绕地运行位置。</li>
                <li>切换新月、上弦、满月、下弦，比较月亮升起时间的变化。</li>
                <li>拖动月龄，观察亮面从右侧变大、满月后从右侧亏缺的循环。</li>
                <li>改变纬度和季节，讨论地轴倾角如何影响日照时间。</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
