'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * X 发帖时段热力图（受众本地时间口径）。
 *
 * 数据是综合 Buffer / Sprout Social / Hootsuite 等公开研究整理的通用矩阵，
 * 不是本站实测；页面文案里已标注口径。行 = 周一到周日，列 = 0–23 点，
 * 值 0–4：0 冷门 / 4 黄金时段。
 */
const HEAT = [
  [0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0], // 周一
  [0, 0, 0, 0, 0, 0, 1, 1, 2, 4, 4, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0], // 周二
  [0, 0, 0, 0, 0, 0, 1, 1, 2, 4, 4, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0], // 周三
  [0, 0, 0, 0, 0, 0, 1, 1, 2, 4, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0], // 周四
  [0, 0, 0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 4, 3, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0], // 周五
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // 周六
  [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 0, 0, 0], // 周日
]

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const SCORE_META = [
  { label: '冷门', alpha: 0 },
  { label: '一般', alpha: 0.14 },
  { label: '可以发', alpha: 0.32 },
  { label: '推荐', alpha: 0.56 },
  { label: '黄金时段', alpha: 0.88 },
]

const HEAT_COLOR = '29, 155, 240' // X 蓝，用透明度表示热度

const AUDIENCE_ZONES = [
  { id: 'America/New_York', label: '北美东部', hint: '英文主流受众，多数研究的默认口径' },
  { id: 'America/Los_Angeles', label: '北美西部', hint: '科技圈浓度高' },
  { id: 'Europe/London', label: '英国 / 西欧', hint: '欧洲英文受众' },
  { id: 'Asia/Shanghai', label: '中文时区', hint: '中文帖 / 华人受众' },
  { id: 'Asia/Tokyo', label: '日韩', hint: '日语 / 韩语受众' },
]

// 取某时区当前的 星期(周一=0)/时/分
function zoneNow(timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  )
  const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday)
  return { day: dayIndex, hour: Number(parts.hour) % 24, minute: Number(parts.minute) }
}

// 某时区相对 UTC 的偏移（分钟）
function zoneOffsetMinutes(timeZone) {
  const now = new Date()
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )
  return Math.round((asUTC - now.getTime()) / 60000)
}

// 受众本地 (day, hour) 换算成访问者本地时间
function toViewerTime(day, hour, hourShift) {
  let viewerHour = hour + hourShift
  let dayShift = 0
  while (viewerHour < 0) {
    viewerHour += 24
    dayShift -= 1
  }
  while (viewerHour >= 24) {
    viewerHour -= 24
    dayShift += 1
  }
  const viewerDay = (day + dayShift + 7) % 7
  return { day: viewerDay, hour: viewerHour, dayShift }
}

function fmtHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

// 从某时刻起向后找下一个 4 分时段
function nextGoldenSlot(day, hour) {
  for (let step = 0; step < 7 * 24; step += 1) {
    const total = day * 24 + hour + step
    const d = Math.floor(total / 24) % 7
    const h = total % 24
    if (HEAT[d][h] === 4) return { day: d, hour: h, hoursAway: step }
  }
  return null
}

function Stars({ score }) {
  return (
    <span className="font-mono text-xs tracking-widest" aria-label={`评分 ${score}/4`}>
      {'★'.repeat(score)}
      {'☆'.repeat(4 - score)}
    </span>
  )
}

export default function TimingHeatmapClient() {
  const [zoneId, setZoneId] = useState('America/New_York')
  const [selected, setSelected] = useState({ day: 1, hour: 11 })
  // 时间相关状态挂载后再算，避免静态页水合不一致
  const [clock, setClock] = useState(null)

  useEffect(() => {
    const tick = () => {
      const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
      const hourShift = Math.round((zoneOffsetMinutes(viewerZone) - zoneOffsetMinutes(zoneId)) / 60)
      setClock({ now: zoneNow(zoneId), hourShift, sameZone: hourShift === 0 })
    }
    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [zoneId])

  const zone = AUDIENCE_ZONES.find((z) => z.id === zoneId) || AUDIENCE_ZONES[0]
  const nowScore = clock ? HEAT[clock.now.day][clock.now.hour] : null
  const golden = clock ? nextGoldenSlot(clock.now.day, clock.now.hour) : null

  const selectedDetail = useMemo(() => {
    const score = HEAT[selected.day][selected.hour]
    const viewer = clock ? toViewerTime(selected.day, selected.hour, clock.hourShift) : null
    return { score, viewer }
  }, [selected, clock])

  return (
    <section className="rounded-[28px] border border-[#2f3336] bg-[#080808] p-5 shadow-[0_0_80px_rgba(29,155,240,0.08)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1d9bf0]">
            Weekly Heatmap
          </p>
          <h2 className="m-0 mt-1 text-xl font-semibold text-[#e7e9ea]">一周发帖时段热力图</h2>
          <p className="m-0 mt-1 text-xs leading-6 text-[#8b98a5]">
            横轴为受众本地时间。综合多份公开研究整理的通用口径，点任意格子看换算后的你的本地时间。
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="受众时区">
          {AUDIENCE_ZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setZoneId(z.id)}
              title={z.hint}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                z.id === zoneId
                  ? 'border-[#1d9bf0] bg-[#1d9bf0] text-white'
                  : 'border-[#2f3336] bg-black text-[#8b98a5] hover:border-[#1d9bf0]/70 hover:text-[#e7e9ea]'
              }`}
            >
              受众在{z.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <table className="w-full min-w-[720px] border-separate border-spacing-[2px]" role="grid" aria-label="一周 24 小时发帖热度">
          <thead>
            <tr>
              <th className="w-10" aria-hidden="true" />
              {Array.from({ length: 24 }, (_, h) => (
                <th
                  key={h}
                  className="pb-1 text-center font-mono text-[9px] font-normal text-[#71767b]"
                  scope="col"
                >
                  {h % 3 === 0 ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEAT.map((row, day) => (
              <tr key={day}>
                <th
                  scope="row"
                  className="pr-2 text-right font-mono text-[10px] font-normal text-[#8b98a5]"
                >
                  {DAY_LABELS[day]}
                </th>
                {row.map((score, hour) => {
                  const isNow = clock && clock.now.day === day && clock.now.hour === hour
                  const isSelected = selected.day === day && selected.hour === hour
                  return (
                    <td key={hour} className="p-0">
                      <button
                        type="button"
                        onClick={() => setSelected({ day, hour })}
                        aria-label={`${DAY_LABELS[day]} ${fmtHour(hour)}，${SCORE_META[score].label}`}
                        className={`block h-6 w-full min-w-[18px] rounded-[3px] border transition hover:scale-110 ${
                          isSelected
                            ? 'border-[#e7e9ea]'
                            : 'border-white/10'
                        } ${isNow ? 'ring-2 ring-[#1d9bf0] ring-offset-1 ring-offset-black' : ''}`}
                        style={{ backgroundColor: `rgba(${HEAT_COLOR}, ${SCORE_META[score].alpha})` }}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#8b98a5]">
        <span className="flex items-center gap-1.5">
          热度
          {SCORE_META.map((meta, score) => (
            <span
              key={score}
              className="inline-block h-3.5 w-3.5 rounded-[3px] border border-white/15"
              style={{ backgroundColor: `rgba(${HEAT_COLOR}, ${meta.alpha})` }}
              title={meta.label}
            />
          ))}
          由冷到热
        </span>
        {clock ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-[3px] border border-white/15 ring-2 ring-[#1d9bf0]" />
            受众时区的现在
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#2f3336] bg-black p-4">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1d9bf0]">
            Selected Slot
          </p>
          <p className="m-0 mt-2 text-sm font-semibold text-[#e7e9ea]">
            {DAY_LABELS[selected.day]} {fmtHour(selected.hour)}–{fmtHour((selected.hour + 1) % 24)}（受众{zone.label}时间）
          </p>
          <p className="m-0 mt-1 flex items-center gap-2 text-sm text-[#8b98a5]">
            <Stars score={selectedDetail.score} />
            {SCORE_META[selectedDetail.score].label}
          </p>
          {selectedDetail.viewer && !clock?.sameZone ? (
            <p className="m-0 mt-2 text-xs leading-6 text-[#71767b]">
              换算成你的本地时间：{DAY_LABELS[selectedDetail.viewer.day]} {fmtHour(selectedDetail.viewer.hour)} 发出
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[#2f3336] bg-black p-4">
          <p className="m-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[#71767b]">
            Right Now
          </p>
          {clock ? (
            <>
              <p className="m-0 mt-2 text-sm font-semibold text-[#e7e9ea]">
                受众{zone.label}现在是 {DAY_LABELS[clock.now.day]} {fmtHour(clock.now.hour).slice(0, 3)}
                {String(clock.now.minute).padStart(2, '0')} · <Stars score={nowScore} /> {SCORE_META[nowScore].label}
              </p>
              {golden && golden.hoursAway > 0 ? (
                <p className="m-0 mt-2 text-xs leading-6 text-[#71767b]">
                  下一个黄金时段：{DAY_LABELS[golden.day]} {fmtHour(golden.hour)}（约 {golden.hoursAway} 小时后
                  {clock.sameZone
                    ? ''
                    : `，即你的 ${DAY_LABELS[toViewerTime(golden.day, golden.hour, clock.hourShift).day]} ${fmtHour(
                        toViewerTime(golden.day, golden.hour, clock.hourShift).hour,
                      )}`}
                  ）
                </p>
              ) : (
                <p className="m-0 mt-2 text-xs leading-6 text-[#71767b]">
                  现在就在黄金时段里，写好了直接发。
                </p>
              )}
            </>
          ) : (
            <p className="m-0 mt-2 text-sm text-[#71767b]">正在读取你的本地时间…</p>
          )}
        </div>
      </div>
    </section>
  )
}
