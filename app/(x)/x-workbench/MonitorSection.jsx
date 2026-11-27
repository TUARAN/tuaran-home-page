'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { ACTION_LABELS, OBSERVED_AGENTS } from '../../../lib/x/workbench/observeCore'
import { summarizeReports } from '../../../lib/x/workbench/monitorPublic'
import { ago, call } from './api'
import s from './workbench.module.css'

const DEFAULT_MONITOR_ACCOUNT = OBSERVED_AGENTS[0]?.handle || ''

const PHASES = {
  running: ['运行中', 'ok'],
  paused: ['已暂停', 'warn'],
  stopping: ['停止中', 'warn'],
  idle: ['空闲', 'idle'],
  offline: ['离线', 'off'],
  unknown: ['待心跳', 'off'],
}

const RESULTS = [['success', '成功'], ['failed', '失败'], ['skipped', '跳过'], ['limited', '受限']]

// CSS Modules 的类名必须逐字写进源码，模板拼接的类不会进编译产物。
const PHASE_CLASS = { ok: s.phaseOk, warn: s.phaseWarn, idle: s.phaseIdle, off: s.phaseOff }
const RESULT_LABEL = { success: '成功', failed: '失败', skipped: '跳过', limited: '受限' }
const RESULT_CLASS = { success: s.resultOk, failed: s.resultBad, skipped: s.resultMuted, limited: s.resultWarn }

const todayInShanghai = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const adjacentDate = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)

function EventLine({ label, event }) {
  if (!event) return null
  return (
    <p className={s.deviceEvent}>
      {label}：{event.taskLabel || event.task}
      <span className={`${s.resultChip} ${RESULT_CLASS[event.result] || ''}`}>{RESULT_LABEL[event.result] || event.result}</span>
      {event.occurredAt ? <span className={s.deviceAgo}>{ago(event.occurredAt)}</span> : null}
    </p>
  )
}

export default function MonitorSection() {
  const [date, setDate] = useState(todayInShanghai)
  const [account, setAccount] = useState(DEFAULT_MONITOR_ACCOUNT)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(true)
  const requestRef = useRef(0)
  const dateRef = useRef(date)
  const accountRef = useRef(account)
  dateRef.current = date
  accountRef.current = account

  const load = useCallback(async ({ nextDate, nextAccount, quiet = false } = {}) => {
    const id = ++requestRef.current
    if (!quiet) setLoading(true)
    const queryDate = nextDate || dateRef.current
    const queryAccount = nextAccount || accountRef.current
    const res = await call(`/monitor?date=${encodeURIComponent(queryDate)}&account=${encodeURIComponent(queryAccount)}`)
    if (id !== requestRef.current) return
    if (res.ok) {
      setData(res.data)
      setError('')
      if (res.data?.accountHandle && res.data.accountHandle.toLowerCase() !== accountRef.current.toLowerCase()) {
        setAccount(res.data.accountHandle)
      }
    } else {
      setError(res.data?.error === 'MIGRATION_REQUIRED' ? '监控数据表还没就绪' : '监控暂时读不到')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load({ quiet: true })
    }, 60000)
    return () => clearInterval(timer)
  }, [load])

  const changeDate = (next) => {
    if (!next || next === date) return
    setDate(next)
    load({ nextDate: next })
  }

  const changeAccount = (next) => {
    const handle = String(next || '').trim()
    if (!handle || handle.toLowerCase() === account.toLowerCase()) return
    setAccount(handle)
    load({ nextAccount: handle })
  }

  const activeAgent = OBSERVED_AGENTS.find((agent) => agent.handle.toLowerCase() === account.toLowerCase())
  const calendarAccountLabel = activeAgent ? `${activeAgent.name} · @${activeAgent.handle}` : `@${account}`

  const devices = data?.devices || []
  const tasks = data?.tasks || []
  const reports = data?.reports || []
  const trend = data?.trend || []
  const online = devices.filter((device) => device.online).length
  const running = devices.filter((device) => device.phase === 'running').length
  const updateable = devices.filter((device) => device.updateAvailable).length
  const successes = tasks.reduce((sum, task) => sum + task.success, 0)
  const dayActions = summarizeReports(reports)
  const activeTasks = tasks.filter((task) => task.success + task.failed + task.skipped + task.limited > 0)
  const maxBar = Math.max(1, ...trend.map((day) => day.success + day.failed + day.skipped + day.limited))
  const minDate = data?.minDate || adjacentDate(todayInShanghai(), -365)
  const maxDate = data?.maxDate || todayInShanghai()
  const today = todayInShanghai()

  return (
    <section id="monitor" className={s.section}>
      <div className={s.sectionHead}>
        <span className={s.sectionMark} aria-hidden="true" />
        <h2 className={s.sectionTitle}>插件现场</h2>
        <p className={s.sectionQ}>X 账号的实时状态与历史</p>
      </div>

      {error ? <p className={s.hint} role="status">{error}，稍后自动重试。</p> : null}

      <div className={s.monitorBoard}>
        <dl className={s.monitorMetrics}>
          {[
            ['在线实例', loading && !data ? '—' : online, '5 分钟内有心跳'],
            ['运行中', loading && !data ? '—' : running, '任务正在执行'],
            ['可更新', loading && !data ? '—' : updateable, `站点 v${data?.latestExtensionVersion || '—'}`],
            ['当日确认成功', loading && !data ? '—' : successes, date === today ? `@${account} 今日回执` : `@${account} · ${date}`],
          ].map(([label, value, detail]) => (
            <div key={label} className={s.monitorMetric}>
              <dt>{label}</dt>
              <dd>{value}</dd>
              <p>{detail}</p>
            </div>
          ))}
        </dl>

        {devices.length ? (
          <ul className={s.deviceList}>
            {devices.map((device) => {
              const [phaseLabel, tone] = PHASES[device.phase] || PHASES.unknown
              return (
                <li key={device.id || device.accountHandle} className={s.deviceRow}>
                  <div className={s.deviceHead}>
                    <span className={s.deviceWho}>@{device.accountHandle || '账号待识别'}</span>
                    <span className={`${s.phaseChip} ${PHASE_CLASS[tone] || ''}`}>{phaseLabel}</span>
                  </div>
                  <div className={s.deviceMeta}>
                    <span>心跳 {device.lastSeenAt ? ago(device.lastSeenAt) : '—'}</span>
                    <span>v{device.extensionVersion || '—'}</span>
                    {device.updateAvailable ? <span className={s.deviceUpdate}>可更新到 v{data?.latestExtensionVersion}</span> : null}
                  </div>
                  <EventLine label="最近动作" event={device.lastAction} />
                  <EventLine label="最近失败" event={device.lastFailure} />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={s.hint}>{loading ? '正在读取插件实例。' : '还没有插件上报心跳。'}</p>
        )}
      </div>

      <div className={s.calendarPanel}>
        <button
          type="button"
          className={s.calendarToggle}
          aria-expanded={calendarOpen}
          aria-controls="x-monitor-calendar"
          onClick={() => setCalendarOpen((open) => !open)}
        >
          <span>日历 · {calendarAccountLabel} · {date === today ? '今天' : date}</span>
          <span className={s.calendarHint}>{calendarOpen ? '收起' : '展开近 14 天与单日明细'}</span>
        </button>
        {calendarOpen ? (
          <div id="x-monitor-calendar" className={s.calendarBody}>
            <div className={s.calendarAccounts} role="tablist" aria-label="日历账号">
              {OBSERVED_AGENTS.map((agent) => {
                const on = agent.handle.toLowerCase() === account.toLowerCase()
                return (
                  <button
                    key={agent.handle}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    className={`${s.pill} ${on ? s.pillOn : ''}`}
                    onClick={() => changeAccount(agent.handle)}
                  >
                    {agent.name}
                  </button>
                )
              })}
            </div>
            <div className={s.calendarNav}>
              <button type="button" className={s.calendarStep} onClick={() => changeDate(adjacentDate(date, -1))} disabled={date <= minDate} aria-label="前一天">←</button>
              <input
                type="date"
                className={s.calendarInput}
                value={date}
                min={minDate}
                max={maxDate}
                aria-label="选择日期"
                onChange={(event) => changeDate(event.target.value)}
              />
              <button type="button" className={s.calendarStep} onClick={() => changeDate(adjacentDate(date, 1))} disabled={date >= maxDate} aria-label="后一天">→</button>
              <button type="button" className={s.calendarToday} onClick={() => changeDate(today)} disabled={date === today}>今天</button>
            </div>

            <div className={s.trendScroll}>
              <div className={s.trendRow} role="group" aria-label={`${calendarAccountLabel} 近 14 天确认回执`}>
                {trend.map((day) => {
                  const total = day.success + day.failed + day.skipped + day.limited
                  const detail = RESULTS.map(([key, label]) => `${label} ${day[key]}`).join('，')
                  const selected = day.date === date
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={`${s.trendDay} ${selected ? s.trendDayOn : ''}`}
                      title={`${day.date}：${detail}`}
                      aria-label={`${day.date}，${detail}`}
                      aria-current={selected ? 'date' : undefined}
                      onClick={() => changeDate(day.date)}
                    >
                      <span className={s.trendCount}>{total || ''}</span>
                      <span className={s.trendBar} aria-hidden="true">
                        <i style={{ height: `${Math.round((total / maxBar) * 100)}%` }} />
                      </span>
                      <span className={s.trendDate}>{day.date.slice(5)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={s.daySummary}>
              <h3 className={s.subHead}>{date === today ? `@${account} 今日动作` : `@${account} · ${date} 动作`}</h3>
              <dl className={s.actionGrid}>
                {ACTION_LABELS.map(([key, label]) => (
                  <div key={key}>
                    <dd>{reports.length ? dayActions[key] : '—'}</dd>
                    <dt>{label}</dt>
                  </div>
                ))}
              </dl>
              <p className={s.hint}>{reports.length ? `@${account} 当日自动同步日报。` : `@${account} 这一天还没有同步日报，任务结果见下。`}</p>

              {activeTasks.length ? (
                <div className={s.tableWrap}>
                  <table className={s.taskTable}>
                    <thead>
                      <tr><th scope="col">任务</th><th scope="col">成功</th><th scope="col">失败</th><th scope="col">跳过</th><th scope="col">受限</th></tr>
                    </thead>
                    <tbody>
                      {activeTasks.map((task) => (
                        <tr key={task.task}>
                          <th scope="row">{task.label}</th>
                          <td>{task.success}</td>
                          <td>{task.failed}</td>
                          <td>{task.skipped}</td>
                          <td>{task.limited}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className={s.hint}>这一天没有确认动作。</p>}
            </div>
          </div>
        ) : null}
      </div>

    </section>
  )
}
