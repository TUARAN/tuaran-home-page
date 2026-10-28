const WAVE_WINDOWS = [
  { start: 7 * 60, end: 10 * 60, label: '早高峰', range: '07:00–10:00' },
  { start: 12 * 60 + 30, end: 13 * 60 + 30, label: '午间', range: '12:30–13:30' },
  { start: 18 * 60, end: 22 * 60, label: '晚高峰', range: '18:00–22:00' },
]

const PREMIUM_SLOTS = ['08:00', '09:30', '12:00', '15:00', '19:00']

const BANDS = [
  { key: 'peak', label: '高峰', hint: '间隔约 ×0.55', swatch: 'var(--site-green)' },
  { key: 'near', label: '过渡', hint: '距高峰 1 小时内', swatch: 'color-mix(in srgb, var(--site-green) 55%, var(--site-faint))' },
  { key: 'day', label: '日间低峰', hint: '约 ×2.0，仍会发', swatch: 'color-mix(in srgb, var(--site-faint) 70%, transparent)' },
  { key: 'night', label: '深夜更疏', hint: '约 ×2.4，仍会发', swatch: 'color-mix(in srgb, var(--site-faint) 40%, transparent)' },
]

function minutesToPeak(day) {
  const minutes = ((Number(day) % 1440) + 1440) % 1440
  for (const window of WAVE_WINDOWS) {
    if (minutes >= window.start && minutes < window.end) return 0
  }
  let best = 1440
  for (const window of WAVE_WINDOWS) {
    const distance = minutes < window.start
      ? window.start - minutes
      : Math.min(minutes - window.end, window.start + 1440 - minutes)
    best = Math.min(best, distance)
  }
  return best
}

function waveFactor(minutes) {
  const distance = minutesToPeak(minutes)
  if (distance === 0) return 0.55
  if (distance <= 60) return 0.55 + (distance / 60) * 0.45
  if (distance <= 180) return 1 + ((distance - 60) / 120) * 0.8
  if (minutes >= 22 * 60 || minutes < 7 * 60) return 2.4
  return 2.0
}

/** Relative posting density; peak = 1. */
function relativeDensity(minutes) {
  return 0.55 / waveFactor(minutes)
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

function slotToMinutes(slot) {
  const [hour, minute] = String(slot).split(':').map(Number)
  return hour * 60 + minute
}

function buildWavePoints(step = 10) {
  const points = []
  for (let minutes = 0; minutes <= 1440; minutes += step) {
    points.push({ minutes, density: relativeDensity(minutes) })
  }
  return points
}

const WAVE_POINTS = buildWavePoints(10)

function densityPath(width, height, padX, padY) {
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const coords = WAVE_POINTS.map((point) => {
    const x = padX + (point.minutes / 1440) * innerW
    const y = padY + (1 - point.density) * innerH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const first = coords[0]
  const last = coords[coords.length - 1]
  const baselineY = padY + innerH
  return {
    line: `M ${coords.join(' L ')}`,
    area: `M ${padX},${baselineY} L ${coords.join(' L ')} L ${padX + innerW},${baselineY} Z`,
    first,
    last,
  }
}

export default function PostWaveTimeline() {
  const width = 720
  const height = 248
  const padX = 28
  const padY = 28
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const { line, area } = densityPath(width, height, padX, padY)
  const hourMarks = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  return (
    <figure
      className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-panel)_92%,transparent)]"
      aria-labelledby="poster-wave-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--site-line)] px-4 py-3.5 md:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--site-faint)]">Beijing time · Asia/Shanghai</p>
          <h4 id="poster-wave-title" className="mt-1 text-[15px] font-semibold text-[var(--site-ink)]">普通发帖 · 一天波浪时间线</h4>
          <p className="mt-1 max-w-xl text-[12px] leading-5 text-[var(--site-muted)]">
            基础间隔按频率挡位随机抽取，再乘以时段系数：高峰更密、低峰更疏，整日仍会发帖，只是疏密像波浪起伏。
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BANDS.map((band) => (
            <span
              key={band.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--site-line)] bg-[var(--site-panel)] px-2.5 py-1 text-[11px] text-[var(--site-muted)]"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: band.swatch }} aria-hidden="true" />
              <span className="font-semibold text-[var(--site-ink)]">{band.label}</span>
              <span className="text-[var(--site-faint)]">{band.hint}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="px-2 pb-2 pt-3 md:px-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label="北京时间一天内普通发帖相对密度波浪图，早中晚高峰更高，深夜更低"
        >
          <defs>
            <linearGradient id="xrc-post-wave-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--site-green)" stopOpacity="0.38" />
              <stop offset="55%" stopColor="var(--site-green)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--site-green)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="xrc-post-wave-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--site-green) 55%, var(--site-faint))" />
              <stop offset="35%" stopColor="var(--site-green)" />
              <stop offset="55%" stopColor="color-mix(in srgb, var(--site-green) 70%, var(--site-accent, var(--site-green)))" />
              <stop offset="85%" stopColor="var(--site-green)" />
              <stop offset="100%" stopColor="color-mix(in srgb, var(--site-green) 45%, var(--site-faint))" />
            </linearGradient>
          </defs>

          {WAVE_WINDOWS.map((window) => {
            const x = padX + (window.start / 1440) * innerW
            const w = ((window.end - window.start) / 1440) * innerW
            return (
              <g key={window.label}>
                <rect
                  x={x}
                  y={padY}
                  width={w}
                  height={innerH}
                  fill="color-mix(in srgb, var(--site-green) 12%, transparent)"
                  stroke="color-mix(in srgb, var(--site-green) 28%, transparent)"
                  strokeWidth="1"
                  rx="6"
                />
                <text
                  x={x + w / 2}
                  y={padY - 8}
                  textAnchor="middle"
                  className="fill-[var(--site-ink)]"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {window.label}
                </text>
              </g>
            )
          })}

          {[0.25, 0.5, 0.75, 1].map((level) => {
            const y = padY + (1 - level) * innerH
            return (
              <line
                key={level}
                x1={padX}
                x2={padX + innerW}
                y1={y}
                y2={y}
                stroke="var(--site-line)"
                strokeDasharray={level === 1 ? undefined : '3 5'}
                strokeOpacity={level === 1 ? 0.9 : 0.65}
              />
            )
          })}

          <path d={area} fill="url(#xrc-post-wave-fill)" />
          <path d={line} fill="none" stroke="url(#xrc-post-wave-stroke)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

          {PREMIUM_SLOTS.map((slot) => {
            const minutes = slotToMinutes(slot)
            const x = padX + (minutes / 1440) * innerW
            const density = relativeDensity(minutes)
            const y = padY + (1 - density) * innerH
            return (
              <g key={slot}>
                <line x1={x} x2={x} y1={y + 5} y2={padY + innerH} stroke="color-mix(in srgb, var(--site-ink) 16%, transparent)" strokeDasharray="2 4" />
                <circle cx={x} cy={y} r="4.2" fill="var(--site-panel)" stroke="var(--site-ink)" strokeWidth="1.5" />
                <title>{`精品档位 ${slot}`}</title>
              </g>
            )
          })}

          {hourMarks.map((hour) => {
            const x = padX + (hour / 24) * innerW
            return (
              <g key={hour}>
                <line x1={x} x2={x} y1={padY + innerH} y2={padY + innerH + 5} stroke="var(--site-faint)" strokeOpacity="0.7" />
                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  className="fill-[var(--site-faint)]"
                  style={{ fontSize: 10, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                >
                  {formatHour(hour % 24)}
                </text>
              </g>
            )
          })}

          <text x={padX + 4} y={padY + 14} className="fill-[var(--site-faint)]" style={{ fontSize: 10 }}>
            密
          </text>
          <text x={padX + 4} y={padY + innerH - 6} className="fill-[var(--site-faint)]" style={{ fontSize: 10 }}>
            疏
          </text>
        </svg>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-2 pb-1 text-[11px] text-[var(--site-faint)] md:px-1">
          <span>横轴为北京时间 24 小时</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--site-ink)] bg-[var(--site-panel)]" aria-hidden="true" />
            圆点 = 精品发帖固定档位
          </span>
        </div>
      </div>

      <figcaption className="space-y-3 border-t border-[var(--site-line)] px-4 py-4 text-[12px] leading-5 text-[var(--site-muted)] md:px-5">
        <div className="grid gap-3 md:grid-cols-3">
          {WAVE_WINDOWS.map((window) => (
            <div key={window.label} className="rounded-xl border border-[var(--site-line)] bg-[var(--site-panel)] px-3 py-2.5">
              <p className="font-semibold text-[var(--site-ink)]">{window.label}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--site-faint)]">{window.range}</p>
              <p className="mt-1">高峰窗口内等待系数约 0.55：默认「中」挡基础 25～35 分钟，实际大约 14～19 分钟一帖。</p>
            </div>
          ))}
        </div>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>曲线表示相对发帖密度，不是绝对条数；频率挡位（慢 / 中 / 快 / 超快）只改基础间隔，波浪形状不变。</li>
          <li>距高峰 1 小时内逐渐加密，1～3 小时过渡到日间低峰；22:00–07:00 更疏，但仍会发帖。</li>
          <li>图中圆点是精品发帖的固定档位（每天最多 5 条），不走波浪系数；普通发帖与精品发帖各自独立窗口。</li>
        </ul>
      </figcaption>
    </figure>
  )
}
