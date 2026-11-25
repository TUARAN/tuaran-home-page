'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { COMMAND_STATUS_LABELS } from '../../../../lib/x/workbench/monitorPublic'
import { ago, call } from '../api'
import s from '../workbench.module.css'

const DEVICE_PHASE = {
  running: ['运行中', s.phaseOk],
  paused: ['已暂停', s.phaseWarn],
  stopping: ['停止中', s.phaseWarn],
  idle: ['空闲', s.phaseIdle],
  offline: ['离线', s.phaseOff],
  unknown: ['待心跳', s.phaseOff],
}

const TASK_PHASE = {
  running: '运行中',
  starting: '正在启动',
  waiting: '等待中',
  paused: '等待中',
  stopping: '停止中',
  idle: '已停止',
  unknown: '需处理',
  blocked: '需处理',
}

const COMMAND_LABEL = {
  'flow-start': '全流程启动',
  'flow-pause': '暂停全部',
  'task-start': '启动任务',
  'task-stop': '停止任务',
  'ext-update': '远程更新插件',
  'schedule-set': '排班',
}

const RESULT_LABEL = { success: '成功', failed: '失败', skipped: '跳过', limited: '受限' }
const RESULT_CLASS = { success: s.resultOk, failed: s.resultBad, skipped: s.resultMuted, limited: s.resultWarn }

const todayInShanghai = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const clock = (value) => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))

function tasksOf(device) {
  return (device.groups || []).flatMap((group) => (group.tasks || []).map((task) => ({ ...task, groupLabel: group.label })))
}

export default function PluginConsole() {
  const [date, setDate] = useState(todayInShanghai)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState('')
  const [note, setNote] = useState('')
  const [pendingRules, setPendingRules] = useState({})
  const requestRef = useRef(0)
  const dateRef = useRef(date)
  dateRef.current = date

  const load = useCallback(async ({ nextDate, quiet = false } = {}) => {
    const id = ++requestRef.current
    if (!quiet) setLoading(true)
    const res = await call(`/monitor?date=${encodeURIComponent(nextDate || dateRef.current)}`)
    if (id !== requestRef.current) return
    if (res.ok) {
      setData(res.data)
      setError('')
    } else {
      setError(res.data?.error === 'MIGRATION_REQUIRED' ? '插件数据表还没就绪' : '监控暂时读不到')
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

  const send = async (deviceId, command, mode = '', payload = null) => {
    const key = `${deviceId}:${command}:${mode}`
    setBusyKey(key)
    setNote('')
    try {
      const res = await fetch('/api/admin/community-actions/monitor', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deviceId, command, mode, ...(payload ? { payload } : {}) }),
        signal: AbortSignal.timeout(15000),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setNote(body?.error === 'MIGRATION_REQUIRED' ? '指令表还没就绪' : '指令下发失败')
        return { ok: false }
      }
      setNote(`${COMMAND_LABEL[command] || command}${mode ? ` · ${TASK_PHASE[mode] || ''}` : ''}已排队，等插件心跳执行`)
      load({ quiet: true })
      return { ok: true }
    } catch {
      setNote('指令下发失败')
      return { ok: false }
    } finally {
      setBusyKey('')
    }
  }

  const ruleEnabled = (device, mode) => {
    const key = `${device.id}:${mode}`
    if (key in pendingRules) return pendingRules[key]
    const rule = (device.schedule?.rules || []).find((item) => item.mode === mode)
    return rule ? rule.enabled !== false : true
  }

  const toggleRule = async (device, mode, enabled) => {
    const key = `${device.id}:${mode}`
    setPendingRules((current) => ({ ...current, [key]: enabled }))
    const result = await send(device.id, 'schedule-set', '', { rules: { [mode]: { enabled } } })
    if (!result.ok) {
      setPendingRules((current) => {
        const next = { ...current }
        delete next[key]
        return next
      })
    }
  }

  const devices = data?.devices || []
  const owner = Boolean(data?.owner)
  const events = data?.events || []
  const today = todayInShanghai()

  return (
    <section id="plugin-console" className={s.section}>
      <div className={s.sectionHead}>
        <span className={s.sectionMark} aria-hidden="true" />
        <h2 className={s.sectionTitle}>插件与排班</h2>
        <p className={s.sectionQ}>任务队列、远程启停与动作明细</p>
      </div>

      {error ? <p className={s.hint} role="status">{error}，稍后自动重试。</p> : null}
      {note ? <p className={s.hint} role="status">{note} · 更新于 {clock(Date.now())}</p> : null}
      {!loading && data && !owner ? <p className={s.hint}>排班与指令只对站长开放；这里只显示执行状态。</p> : null}

      <div className={s.consoleGrid}>
        {devices.map((device) => {
          const [phaseLabel, phaseClass] = DEVICE_PHASE[device.phase] || DEVICE_PHASE.unknown
          const tasks = tasksOf(device)
          const joined = tasks.filter((task) => ruleEnabled(device, task.mode)).length
          const flowBusy = busyKey.startsWith(`${device.id}:`)
          return (
            <article key={device.id || device.accountHandle} className={s.consoleDevice}>
              <div className={s.consoleHead}>
                <span className={s.consoleWho}>@{device.accountHandle || '账号待识别'}</span>
                <span className={`${s.phaseChip} ${phaseClass || ''}`}>{phaseLabel}</span>
              </div>
              <p className={s.consoleMetaRow}>
                <span>v{device.extensionVersion || '—'}</span>
                <span>心跳 {device.lastSeenAt ? ago(device.lastSeenAt) : '—'}</span>
                {device.updateAvailable ? <span className={s.deviceUpdate}>可更新到 v{data?.latestExtensionVersion}</span> : null}
              </p>

              {owner ? (
                <div className={s.consoleActions}>
                  {device.schedule?.enabled ? (
                    <button type="button" className={s.btn} disabled={flowBusy} onClick={() => send(device.id, 'flow-pause')}>暂停全部</button>
                  ) : (
                    <button type="button" className={`${s.btn} ${s.primary}`} disabled={flowBusy} onClick={() => send(device.id, 'flow-start')}>全流程启动</button>
                  )}
                  <button type="button" className={s.btn} disabled={flowBusy || busyKey === `${device.id}:ext-update:`} onClick={() => send(device.id, 'ext-update')}>更新插件</button>
                </div>
              ) : null}

              <p className={s.consoleNow}>
                当前：<strong>{device.schedule?.now?.label || (device.schedule?.enabled ? '调度中' : '排班已暂停')}</strong>
                {device.schedule?.next?.label ? <span> · 下一项 {device.schedule.next.label}</span> : null}
              </p>

              {tasks.length ? (
                <>
                  <h3 className={s.consoleSub}>任务 {owner ? `· ${joined}/${tasks.length} 项在排班` : ''}</h3>
                  <ul className={s.consoleTasks}>
                    {tasks.map((task) => {
                      const active = task.phase === 'running' || task.phase === 'starting'
                      const taskBusy = busyKey === `${device.id}:${active ? 'task-stop' : 'task-start'}:${task.mode}`
                      return (
                        <li key={task.mode} className={s.consoleTask}>
                          <span className={s.consoleTaskName}>{task.label || task.mode}</span>
                          <span className={s.consoleTaskState}>{TASK_PHASE[task.phase] || task.phase}</span>
                          {owner ? (
                            <>
                              <button
                                type="button"
                                className={s.consoleTaskBtn}
                                disabled={taskBusy || flowBusy && !active}
                                onClick={() => send(device.id, active ? 'task-stop' : 'task-start', task.mode)}
                              >
                                {taskBusy ? '…' : active ? '停止' : '启动'}
                              </button>
                              <label className={s.consoleJoin}>
                                <input
                                  type="checkbox"
                                  checked={ruleEnabled(device, task.mode)}
                                  disabled={flowBusy}
                                  aria-label={`${task.label || task.mode}参与排班`}
                                  onChange={(event) => toggleRule(device, task.mode, event.target.checked)}
                                />
                                排班
                              </label>
                            </>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </>
              ) : (
                <p className={s.hint}>{device.telemetry ? '插件还没上报任务列表。' : '等待插件上报任务状态。'}</p>
              )}

              {owner && (device.commands || []).length ? (
                <>
                  <h3 className={s.consoleSub}>最近指令</h3>
                  <ul className={s.consoleCommands}>
                    {device.commands.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        {clock(item.createdAt)} · {item.command === 'schedule-set' ? '排班' : (item.modeLabel || COMMAND_LABEL[item.command] || item.command)} · {COMMAND_STATUS_LABELS[item.status] || item.status}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </article>
          )
        })}
        {!devices.length ? <p className={s.hint}>{loading ? '正在读取插件实例。' : '还没有插件上报心跳。'}</p> : null}
      </div>

      <div className={s.consoleEvents}>
        <div className={s.calendarNav}>
          <h3 className={s.consoleSub}>动作明细 · {date === today ? '今天' : date}</h3>
          <input
            type="date"
            className={s.calendarInput}
            value={date}
            max={data?.maxDate || today}
            min={data?.minDate || undefined}
            aria-label="选择动作明细日期"
            onChange={(event) => {
              const next = event.target.value
              if (!next || next === date) return
              setDate(next)
              load({ nextDate: next })
            }}
          />
          <button type="button" className={s.calendarToday} disabled={date === today} onClick={() => { setDate(today); load({ nextDate: today }) }}>今天</button>
        </div>
        {owner ? (
          events.length ? (
            <div className={s.tableWrap}>
              <table className={s.taskTable}>
                <thead>
                  <tr><th scope="col">时间</th><th scope="col">任务</th><th scope="col">结果</th><th scope="col">错误码</th></tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <th scope="row">{clock(event.occurredAt)}</th>
                      <td>{event.taskLabel || event.task}</td>
                      <td><span className={`${s.resultChip} ${RESULT_CLASS[event.result] || ''}`}>{RESULT_LABEL[event.result] || event.result}</span></td>
                      <td>{event.errorCode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className={s.hint}>{loading ? '正在读取动作明细。' : '这一天没有确认动作。'}</p>
        ) : <p className={s.hint}>动作明细只对站长开放。</p>}
      </div>
    </section>
  )
}
