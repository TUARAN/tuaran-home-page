'use client'

import { useEffect, useMemo, useState } from 'react'

import { findInteractionAgent, X_INTERACTION_AGENT_POOL } from '../../../../../lib/interaction/agentPool.js'
import {
  canonicalDailyTopSubject,
  dailyTopSubjectKey,
  DAILY_TOP_SUBJECT,
  emptyStateCopy,
  formatWindowLabel,
  isDailyTopSubject,
  monthMatrix,
  resolveCalendarSelectedDate,
  shanghaiDateKey,
  shiftMonth,
} from '../../../../../lib/interaction/dailyTop/model.js'
import styles from './calendar.module.css'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const DEFAULT_ACCOUNT = DAILY_TOP_SUBJECT

function monthTitle(yearMonth) {
  const [year, month] = yearMonth.split('-')
  return `${year}年${Number(month)}月`
}

function readAccountFromQuery() {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT
  const account = canonicalDailyTopSubject(new URLSearchParams(window.location.search).get('account') || DEFAULT_ACCOUNT)
  return isDailyTopSubject(account) ? account : DEFAULT_ACCOUNT
}

export default function InteractionCalendar({ days, activities = [], initialToday }) {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT)
  const accountKey = dailyTopSubjectKey(account)
  const topDaysForAccount = useMemo(
    () => days.filter((day) => dailyTopSubjectKey(day.subject) === accountKey),
    [days, accountKey],
  )
  const byDate = useMemo(() => new Map(topDaysForAccount.map((day) => [day.date, day])), [topDaysForAccount])
  const topDates = useMemo(() => topDaysForAccount.map((day) => day.date), [topDaysForAccount])
  const activityDatesForAccount = useMemo(
    () => new Set(
      activities
        .filter((entry) => dailyTopSubjectKey(entry.accountHandle) === accountKey)
        .map((entry) => entry.date),
    ),
    [activities, accountKey],
  )
  const initialSelected = resolveCalendarSelectedDate(null, initialToday)
  const [today, setToday] = useState(initialToday)
  const [selected, setSelected] = useState(initialSelected)
  const [visibleMonth, setVisibleMonth] = useState(initialSelected.slice(0, 7))

  useEffect(() => {
    const liveToday = shanghaiDateKey()
    const params = new URLSearchParams(window.location.search)
    const query = params.get('date')
    const nextAccount = readAccountFromQuery()
    const next = resolveCalendarSelectedDate(query, liveToday)
    setToday(liveToday)
    setAccount(nextAccount)
    setSelected(next)
    setVisibleMonth(next.slice(0, 7))
  }, [])

  function syncUrl({ date, nextAccount }) {
    const url = new URL(window.location.href)
    url.searchParams.set('date', date)
    url.searchParams.set('account', canonicalDailyTopSubject(nextAccount))
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  }

  function choose(date) {
    setSelected(date)
    setVisibleMonth(date.slice(0, 7))
    syncUrl({ date, nextAccount: account })
  }

  function chooseAccount(next) {
    const handle = canonicalDailyTopSubject(next)
    if (!isDailyTopSubject(handle) || dailyTopSubjectKey(handle) === accountKey) return
    setAccount(handle)
    syncUrl({ date: selected, nextAccount: handle })
  }

  const day = byDate.get(selected) || null
  const activeAgent = findInteractionAgent(account)
  const activitiesForDay = useMemo(
    () => activities.filter((entry) => entry.date === selected && dailyTopSubjectKey(entry.accountHandle) === accountKey),
    [activities, selected, accountKey],
  )
  const cells = monthMatrix(visibleMonth)

  return (
    <>
    <div className={styles.layout}>
      <section className={styles.picker} aria-label="选择日期">
        <AccountBar account={account} onChoose={chooseAccount} />
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
                byDate.has(date) || activityDatesForAccount.has(date) ? styles.recorded : '',
              ].filter(Boolean).join(' ')}
              onClick={() => choose(date)}
            >
              {Number(date.slice(-2))}
              {byDate.has(date) || activityDatesForAccount.has(date) ? <i /> : null}
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
      </section>

      <section className={styles.board} aria-live="polite">
        <header className={styles.boardHead}>
          <p className={styles.eyebrow}>互动前十</p>
          <h2>
            <time dateTime={selected}>{selected}</time>
            {' · '}
            @{account}
            {activeAgent?.name ? `（${activeAgent.name}）` : ''}
          </h2>
          {day ? (
            <p className={styles.windowLine}>
              窗口 {formatWindowLabel(day.window)}（Asia/Shanghai） · 对手 {day.opponents} · 事件 {day.events}
            </p>
          ) : (
            <p className={styles.windowLine}>前一自然日 00:00 至当日 00:00（Asia/Shanghai）。</p>
          )}
        </header>
        <section className={styles.ownActivity} aria-label="智能体任务次数">
          <p className={styles.eyebrow}>任务次数</p>
          {activitiesForDay.length ? (
            <div className={styles.ownAccountStack}>
              {activitiesForDay.map((activity) => (
                <article key={activity.accountHandle} className={styles.ownAccountBlock}>
                  <p className={styles.windowLine}>
                    {activity.sourceDate} · @{activity.accountHandle}
                  </p>
                  <div className={styles.ownGrid}>
                    {activity.metrics.map((metric) => (
                      <div key={`${activity.accountHandle}-${metric.key}`} className={styles.ownMetric}>
                        <span>{metric.label}</span>
                        <strong>{metric.count}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.windowLine}>这一天还没有 @{account} 的插件任务次数。</p>
          )}
        </section>
        <div className={styles.tableWrap}>
          <table>
            <caption className="sr-only">{selected} @{account} 互动前十</caption>
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
                  <td className={styles.empty} colSpan={5}>
                    {emptyStateCopy(selected, topDates, { subjectLabel: `@${account}` })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </>
  )
}

function AccountBar({ account, onChoose }) {
  return (
    <div className={styles.accountBar} role="tablist" aria-label="互动前十账号">
      {X_INTERACTION_AGENT_POOL.map((agent) => {
        const on = dailyTopSubjectKey(agent.handle) === dailyTopSubjectKey(account)
        return (
          <button
            key={agent.handle}
            type="button"
            role="tab"
            aria-selected={on}
            className={on ? styles.accountOn : styles.accountBtn}
            onClick={() => onChoose(agent.handle)}
          >
            {agent.name}
          </button>
        )
      })}
    </div>
  )
}