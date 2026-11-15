'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  DAILY_TOP_SUBJECT,
  emptyStateCopy,
  formatWindowLabel,
  monthMatrix,
  resolveSelectedDate,
  shanghaiDateKey,
  shiftMonth,
} from '../../../../../lib/interaction/dailyTop/model.js'
import styles from './calendar.module.css'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function monthTitle(yearMonth) {
  const [year, month] = yearMonth.split('-')
  return `${year}年${Number(month)}月`
}

export default function InteractionCalendar({ days, activities = [], initialToday }) {
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days])
  const activityByDate = useMemo(() => new Map(activities.map((day) => [day.date, day])), [activities])
  const topDates = useMemo(() => days.map((day) => day.date), [days])
  const availableDates = useMemo(
    () => [...new Set([...topDates, ...activities.map((day) => day.date)])].sort(),
    [topDates, activities],
  )
  const initialSelected = resolveSelectedDate(null, initialToday, availableDates)
  const [today, setToday] = useState(initialToday)
  const [selected, setSelected] = useState(initialSelected)
  const [visibleMonth, setVisibleMonth] = useState(initialSelected.slice(0, 7))

  useEffect(() => {
    const liveToday = shanghaiDateKey()
    const query = new URLSearchParams(window.location.search).get('date')
    const next = resolveSelectedDate(query, liveToday, availableDates)
    setToday(liveToday)
    setSelected(next)
    setVisibleMonth(next.slice(0, 7))
  }, [availableDates])

  function choose(date) {
    setSelected(date)
    setVisibleMonth(date.slice(0, 7))
    const url = new URL(window.location.href)
    url.searchParams.set('date', date)
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  const day = byDate.get(selected) || null
  const activity = activityByDate.get(selected) || null
  const cells = monthMatrix(visibleMonth)

  return (
    <div className={styles.layout}>
      <section className={styles.picker} aria-label="选择日期">
        <div className={styles.monthBar}>
          <button type="button" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))}>上个月</button>
          <strong>{monthTitle(visibleMonth)}</strong>
          <button type="button" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))}>下个月</button>
        </div>
        <div className={styles.weekdays} aria-hidden="true">
          {WEEKDAYS.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className={styles.grid} role="grid" aria-label={monthTitle(visibleMonth)}>
          {cells.map((date, index) => date ? (
            <button
              key={date}
              type="button"
              role="gridcell"
              aria-label={date}
              aria-pressed={date === selected}
              aria-current={date === today ? 'date' : undefined}
              className={[
                date === selected ? styles.selected : '',
                date === today ? styles.today : '',
                byDate.has(date) || activityByDate.has(date) ? styles.recorded : '',
              ].filter(Boolean).join(' ')}
              onClick={() => choose(date)}
            >
              {Number(date.slice(-2))}
              {byDate.has(date) || activityByDate.has(date) ? <i /> : null}
            </button>
          ) : <span key={`empty-${index}`} />)}
        </div>
        <label className={styles.dateLabel}>
          直接选日
          <input
            type="date"
            value={selected}
            onChange={(event) => {
              if (event.target.value) choose(event.target.value)
            }}
          />
        </label>
        {topDates.length > 0 && (
          <div className={styles.recordedList}>
            <span>已收录</span>
            {topDates.map((date) => (
              <button key={date} type="button" aria-pressed={date === selected} onClick={() => choose(date)}>{date}</button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.board} aria-live="polite">
        <header className={styles.boardHead}>
          <p className={styles.eyebrow}>互动前十</p>
          <h2><time dateTime={selected}>{selected}</time></h2>
          {day ? (
            <p className={styles.windowLine}>
              窗口 {formatWindowLabel(day.window)}（Asia/Shanghai） · 对手 {day.opponents} · 事件 {day.events}
            </p>
          ) : (
            <p className={styles.windowLine}>每天 09:00（Asia/Shanghai）收录前一自然日 00:00 至当日 00:00，记在当天。</p>
          )}
        </header>
        <section className={styles.ownActivity} aria-label="本账号互动次数">
          <p className={styles.eyebrow}>本账号互动</p>
          {activity ? (
            <>
              <p className={styles.windowLine}>统计日 {activity.sourceDate} · @{activity.accountHandle} 完成的次数，与这一格的互动前十同一天。</p>
              <div className={styles.ownGrid}>
                {activity.metrics.map((metric) => (
                  <div key={metric.key} className={styles.ownMetric}>
                    <span>{metric.label}</span>
                    <strong>{metric.count}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={styles.windowLine}>这一天还没有同步 @{DAILY_TOP_SUBJECT} 的任务次数。次数来自后台日报，记在次日。</p>
          )}
        </section>
        <div className={styles.tableWrap}>
          <table>
            <caption className="sr-only">{selected} 互动前十</caption>
            <thead>
              <tr>
                <th scope="col">排名</th>
                <th scope="col">账号</th>
                <th scope="col">互动次数</th>
                <th scope="col">构成简述</th>
                <th scope="col">主页链接</th>
              </tr>
            </thead>
            <tbody>
              {day ? day.top.map((row) => (
                <tr key={row.handle}>
                  <td>{row.rank}</td>
                  <td>
                    <a href={row.profileUrl} target="_blank" rel="noopener noreferrer">@{row.handle}</a>
                    <span>{row.displayName}</span>
                  </td>
                  <td>{row.count}</td>
                  <td>{row.breakdown}</td>
                  <td><a href={row.profileUrl} target="_blank" rel="noopener noreferrer">x.com/{row.handle}</a></td>
                </tr>
              )) : (
                <tr>
                  <td className={styles.empty} colSpan={5}>{emptyStateCopy(selected, topDates)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
