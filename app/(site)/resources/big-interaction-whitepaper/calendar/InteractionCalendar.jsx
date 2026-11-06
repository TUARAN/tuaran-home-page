'use client'

import { useEffect, useMemo, useState } from 'react'

import {
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

export default function InteractionCalendar({ days, initialToday }) {
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days])
  const availableDates = useMemo(() => days.map((day) => day.date), [days])
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
                byDate.has(date) ? styles.recorded : '',
              ].filter(Boolean).join(' ')}
              onClick={() => choose(date)}
            >
              {Number(date.slice(-2))}
              {byDate.has(date) ? <i /> : null}
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
        {availableDates.length > 0 && (
          <div className={styles.recordedList}>
            <span>已收录</span>
            {availableDates.map((date) => (
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
            <p className={styles.windowLine}>窗口为前一日 21:00 至当日 21:00（Asia/Shanghai）。</p>
          )}
        </header>
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
                  <td className={styles.empty} colSpan={5}>{emptyStateCopy(selected, availableDates)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
