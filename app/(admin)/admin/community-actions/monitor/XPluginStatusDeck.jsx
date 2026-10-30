'use client'

import {
  X_DEFAULT_TASK_PRIORITY,
  X_RUNTIME_MODE_LABELS,
} from '../../../../../lib/community/xExtensionMonitorShared'
import { AdminButton, StatusPill } from '../../../components/ui'
import styles from './xMonitorDesk.module.css'

const MODE_LABEL = X_RUNTIME_MODE_LABELS
const TASK_PHASE = {
  running: ['运行中', 'info'],
  waiting: ['等待中', 'warning'],
  paused: ['等待中', 'warning'],
  stopping: ['等待中', 'warning'],
  idle: ['已停止', 'neutral'],
  unknown: ['需处理', 'warning'],
  blocked: ['需处理', 'warning'],
}
const COMMAND_LABEL = {
  'flow-start': '全流程启动',
  'flow-pause': '暂停全部',
  'task-start': '启动任务',
  'task-stop': '停止任务',
  'ext-update': '远程更新插件',
}
const COMMAND_STATUS = {
  pending: ['排队中', 'warning'],
  claimed: ['已下发', 'info'],
  done: ['已完成', 'success'],
  failed: ['失败', 'danger'],
  expired: ['已过期', 'neutral'],
}
const DEVICE_PHASE = {
  running: ['运行中', 'info'],
  paused: ['等待中', 'warning'],
  stopping: ['等待中', 'warning'],
  idle: ['已停止', 'neutral'],
  online: ['有心跳', 'info'],
  unknown: ['需处理', 'warning'],
  offline: ['离线', 'danger'],
}

const time = (value) => (value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—')
const clock = (value) => (value ? new Date(value).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '')
const waitCopy = (waitUntil, now) => {
  const remaining = Number(waitUntil) - Number(now)
  if (!(remaining > 0)) return ''
  const total = Math.ceil(remaining / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

function actionCount(mode, count) {
  const amount = Math.max(0, Number(count) || 0)
  if (['timeline', 'notifications', 'kol'].includes(mode)) return `${amount} 条回复`
  if (['likes-posts', 'likes-replies'].includes(mode)) return `${amount} 个点赞`
  if (['poster', 'poster-premium', 'poster-x'].includes(mode)) return `${amount} 条帖子`
  if (mode === 'article') return `${amount} 篇文章`
  if (mode === 'prune-posts') return `${amount} 条`
  return `${amount} 个账号`
}

function optedOut(task) {
  return task?.phase === 'idle' && /未参与/.test(task.detail || '')
}

function manualStop(task) {
  return task?.phase === 'idle' && /手动停止/.test(task.detail || '')
}

function dotState(task) {
  if (task?.phase === 'running') return 'running'
  if (task?.phase === 'waiting' || task?.phase === 'paused' || task?.phase === 'stopping') return 'waiting'
  if (task?.phase === 'unknown' || task?.phase === 'blocked' || manualStop(task)) return 'unknown'
  return 'missing'
}

function cardPulse(task) {
  if (!task) return ''
  if (task.phase === 'running') return 'running'
  if (task.phase === 'unknown' || task.phase === 'blocked' || manualStop(task)) return 'stopped'
  if (optedOut(task) || task.phase === 'idle') return ''
  if (task.phase === 'waiting' || task.phase === 'paused' || task.phase === 'stopping') return 'waiting'
  return ''
}

function statusText(task) {
  if (!task) return ''
  if (optedOut(task)) return '未参与'
  return (TASK_PHASE[task.phase] || TASK_PHASE.idle)[0]
}

function taskRank(task) {
  if (task.phase === 'waiting' || task.phase === 'paused' || task.phase === 'stopping') return 0
  if (task.phase === 'unknown' || task.phase === 'blocked' || manualStop(task)) return 1
  return 2
}

function buildDesk(groups, schedule) {
  const tasks = groups.flatMap((group) => group.tasks)
  const byMode = new Map(tasks.map((task) => [task.mode, task]))
  const running = tasks.find((task) => task.phase === 'running')
  const nowMode = running?.mode || schedule?.now?.mode || ''
  if (nowMode && !byMode.has(nowMode)) {
    byMode.set(nowMode, {
      mode: nowMode,
      phase: 'waiting',
      priority: X_DEFAULT_TASK_PRIORITY[nowMode] || 1,
      label: schedule?.now?.label || MODE_LABEL[nowMode] || nowMode,
      detail: '当前轮班占用中',
      waitUntil: 0,
      updatedAt: 0,
    })
  }
  const nextMode = schedule?.next?.mode && schedule.next.mode !== nowMode ? schedule.next.mode : ''
  if (nextMode && !byMode.has(nextMode)) {
    byMode.set(nextMode, {
      mode: nextMode,
      phase: 'waiting',
      priority: X_DEFAULT_TASK_PRIORITY[nextMode] || 1,
      label: schedule?.next?.label || MODE_LABEL[nextMode] || nextMode,
      detail: schedule?.next?.reason || '',
      waitUntil: Number(schedule?.next?.readyAt) || 0,
      updatedAt: 0,
    })
  }
  const rest = [...byMode.values()].filter((task) => task.mode !== nowMode && task.mode !== nextMode)
  rest.sort((a, b) => taskRank(a) - taskRank(b) || b.priority - a.priority || String(a.label).localeCompare(String(b.label), 'zh'))
  return {
    ordered: tasks,
    nowTask: nowMode ? byMode.get(nowMode) : null,
    nextTask: nextMode ? byMode.get(nextMode) : null,
    rest,
  }
}

function taskNote(task, now) {
  if (!task) return ''
  if (optedOut(task)) return '未勾选，不参与自动排班'
  const countdown = waitCopy(task.waitUntil, now)
  const detail = task.detail
    || (task.phase === 'waiting' || task.phase === 'paused' ? '后台排班等待'
      : task.phase === 'idle' ? '当前没有运行记录'
        : task.phase === 'unknown' ? '超过 90 秒没有状态更新'
          : task.phase === 'stopping' ? '正在结束当前任务'
            : '任务正在执行')
  return [detail, countdown ? `剩余 ${countdown}` : ''].filter(Boolean).join(' · ')
}

function pastNote(past) {
  if (!past) return '本机上一轮让出记录'
  return [actionCount(past.mode, past.actions), past.reason, past.endedAt ? clock(past.endedAt) : ''].filter(Boolean).join(' · ')
}

function facingSummary(facing) {
  if (!facing) return '暂无任务状态'
  const parts = [
    facing.running ? `${facing.running} 项运行中` : '',
    facing.waiting ? `${facing.waiting} 项等待中` : '',
    facing.needs ? `${facing.needs} 项需处理` : '',
    facing.stopped ? `${facing.stopped} 项已停止` : '',
  ].filter(Boolean)
  return parts.join(' · ') || '全部已停止'
}

function DeskCard({ phase, warmth, pulse, disabled, tag, title, note, status, action }) {
  const showDots = pulse === 'waiting' && phase !== 'now' && phase !== 'past'
  const showOrbit = pulse === 'running' && phase === 'now'
  return (
    <li className={`${styles.item} ${disabled ? styles.disabled : ''}`} data-phase={phase || undefined} data-pulse={pulse || undefined} data-warmth={warmth || undefined}>
      <i className={styles.mark} aria-hidden="true" />
      <div className={styles.body}>
        <div className={styles.itemHead}>
          <strong>
            {tag ? <span className={styles.tag}>{tag}</span> : null}
            <span>{title}</span>
          </strong>
          <div className={styles.side}>
            {status ? <span className={styles.status}>{status}</span> : null}
            {action}
          </div>
        </div>
        {note ? <small>{note}</small> : null}
      </div>
      {showOrbit ? <i className={styles.orbit} aria-hidden="true" /> : null}
      {showDots ? <span className={styles.dots} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((dot) => <i key={dot} />)}</span> : null}
    </li>
  )
}

function TaskControl({ task, deviceId, canControl, busyKey, flowBusy, send }) {
  if (!canControl || !task || task.phase === 'unknown') return null
  const taskBusy = busyKey === `${deviceId}:task-start:${task.mode}` || busyKey === `${deviceId}:task-stop:${task.mode}`
  if (task.phase === 'idle') {
    return <button type="button" className={styles.go} disabled={flowBusy} onClick={() => send('task-start', task.mode)}>{taskBusy ? '…' : '启动'}</button>
  }
  if (['running', 'waiting', 'paused'].includes(task.phase)) {
    return <button type="button" className={styles.stop} disabled={flowBusy} onClick={() => send('task-stop', task.mode)}>{taskBusy ? '…' : '停止'}</button>
  }
  return null
}

export default function XPluginStatusDeck({ device, now, latestExtensionVersion, onCommand, busyKey }) {
  const [label, tone] = DEVICE_PHASE[device.phase] || DEVICE_PHASE.unknown
  const quiet = device.phase === 'running' && (!device.lastAction || now - Number(device.lastAction.occurred_at) > 30 * 60 * 1000)
  const groups = Array.isArray(device.groups) ? device.groups : []
  const commands = Array.isArray(device.commands) ? device.commands : []
  const schedule = device.schedule
  const canControl = device.online && device.telemetry
  const installedVersion = String(device.extensionVersion || '').trim()
  const siteVersion = String(latestExtensionVersion || '').trim()
  const updateAvailable = Boolean(device.updateAvailable)
  const canReloadLocal = device.online && !updateAvailable && Boolean(installedVersion)
  const canUpdate = device.online && (updateAvailable ? Boolean(siteVersion) : Boolean(installedVersion))
  const updateBusy = busyKey === `${device.id}:ext-update:`
  const send = (command, mode = '') => onCommand?.({ deviceId: device.id, command, mode })
  const facing = device.facing || schedule?.facing
  const flowBusy = Boolean(busyKey)
  const desk = buildDesk(groups, schedule)
  let candidateWarmth = 0
  const versionTone = !device.online ? 'neutral' : updateAvailable ? 'warning' : installedVersion ? 'success' : 'neutral'
  const versionLabel = !device.online ? '离线' : updateAvailable ? '可更新' : installedVersion ? '已是最新' : '版本未知'
  const versionDetail = !device.online
    ? '上线后可远程比对并下发更新'
    : updateAvailable
      ? `本机 v${installedVersion || '未知'} 落后于站点 v${siteVersion}；下发后会停任务并重载本机已同步的新文件`
      : installedVersion
        ? `本机 v${installedVersion} · 站点最新 v${siteVersion || installedVersion}。更新本地会停掉当前任务，并重载本机目录里更新的文件`
        : `站点最新 v${siteVersion || '—'}；等待插件心跳上报版本`

  return (
    <article className="border-t border-[#e5e9e2] first:border-t-0 dark:border-[#263142]">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-[#273228] dark:text-gray-100">
            {device.accountHandle ? `@${device.accountHandle}` : '未识别账号'}
          </span>
          <span className="mt-0.5 block text-[12px] text-[#7a8479] dark:text-gray-400">
            插件实例 {device.id.slice(0, 12)}… · v{installedVersion || '未知'}
            {updateAvailable && siteVersion ? ` · 落后于 v${siteVersion}` : ''}
          </span>
        </span>
        <span className="text-[12px] text-[#697268] dark:text-gray-400">心跳 {time(device.lastSeenAt)}</span>
        <StatusPill size="sm" tone={versionTone}>{versionLabel}</StatusPill>
        <StatusPill size="sm" tone={tone}>{label}</StatusPill>
      </header>

      <div className="border-t border-[#e5e9e2] bg-[#fafbf8] px-4 py-4 text-[13px] dark:border-[#263142] dark:bg-[#101820]">
        <div className={`mb-4 overflow-hidden rounded-2xl border px-4 py-3 ${updateAvailable ? 'border-[#f0d0a8] bg-[#fff8ef] dark:border-amber-900/60 dark:bg-amber-950/20' : 'border-[#d7e3f4] bg-white dark:border-[#263142] dark:bg-[#0d141c]'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">插件版本</p>
              <p className="mb-0 mt-1 text-[13px] font-semibold text-[#0f1419] dark:text-gray-100">
                {updateAvailable ? `发现可远程更新 v${siteVersion}` : installedVersion ? `当前 v${installedVersion}` : '等待版本上报'}
              </p>
              <p className="mb-0 mt-1 text-[12px] leading-5 text-[#536471] dark:text-gray-400">{versionDetail}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canUpdate ? (
                <AdminButton size="sm" variant="primary" disabled={flowBusy} onClick={() => send('ext-update')}>
                  {updateBusy ? '排队中…' : (canReloadLocal ? '更新本地' : `远程更新到 v${siteVersion}`)}
                </AdminButton>
              ) : (
                <AdminButton size="sm" variant="ghost" disabled title={device.online ? '站点最新版未知' : '实例离线，无法下发'}>
                  {device.online ? '无法下发' : '离线不可更新'}
                </AdminButton>
              )}
            </div>
          </div>
        </div>

        {device.telemetry ? (
          <div className={styles.panel}>
            <div className={styles.head}>
              <strong className={styles.title}>排班台</strong>
              <div className={styles.corner}>
                {canControl ? (
                  schedule?.enabled ? (
                    <button type="button" className={styles.flow} disabled={flowBusy} onClick={() => send('flow-pause')}>暂停</button>
                  ) : (
                    <button type="button" className={`${styles.flow} ${styles.flowStart}`} disabled={flowBusy} onClick={() => send('flow-start')}>开始</button>
                  )
                ) : null}
              </div>
            </div>
            <div className={styles.overview}>
              <span className={styles.flowDots} aria-hidden="true">
                {desk.ordered.map((task) => (
                  <i key={task.mode} data-state={dotState(task)} title={`${task.label} · ${statusText(task)}`} />
                ))}
              </span>
              <p className={styles.hint}>{facingSummary(facing)}</p>
            </div>
            <ul className={styles.board}>
              <DeskCard
                phase="past"
                tag="上一任务"
                title={schedule?.past?.label || '暂无轮班记录'}
                note={pastNote(schedule?.past)}
                status={schedule?.past ? '已结束' : '暂无'}
              />
              {desk.nowTask ? (
                <DeskCard
                  phase="now"
                  pulse={cardPulse(desk.nowTask)}
                  tag="当前任务"
                  title={desk.nowTask.label || MODE_LABEL[desk.nowTask.mode]}
                  note={[taskNote(desk.nowTask, now), Number(schedule?.now?.actions) ? `本次已确认 ${actionCount(desk.nowTask.mode, schedule.now.actions)}` : ''].filter(Boolean).join(' · ')}
                  status={statusText(desk.nowTask)}
                  action={<TaskControl task={desk.nowTask} deviceId={device.id} canControl={canControl} busyKey={busyKey} flowBusy={flowBusy} send={send} />}
                />
              ) : (
                <DeskCard
                  phase="now"
                  pulse={schedule?.enabled ? 'waiting' : ''}
                  tag="当前任务"
                  title={schedule?.enabled ? '正在调度中' : '排班已暂停'}
                  note={schedule?.enabled ? '等待下一任务到期后自动切换' : '恢复排班后继续自动切换'}
                  status={schedule?.enabled ? '调度中' : '已暂停'}
                />
              )}
              {desk.nextTask ? (
                <DeskCard
                  phase="next"
                  pulse={cardPulse(desk.nextTask)}
                  tag="下一任务"
                  title={desk.nextTask.label || MODE_LABEL[desk.nextTask.mode]}
                  note={taskNote(desk.nextTask, now)}
                  status={statusText(desk.nextTask)}
                  action={<TaskControl task={desk.nextTask} deviceId={device.id} canControl={canControl} busyKey={busyKey} flowBusy={flowBusy} send={send} />}
                />
              ) : null}
              {desk.rest.map((task) => {
                const pulse = cardPulse(task)
                const waiting = pulse === 'waiting'
                const warmth = waiting ? String(Math.min(candidateWarmth += 1, 5)) : ''
                return (
                  <DeskCard
                    key={task.mode}
                    phase={waiting ? 'candidate' : ''}
                    warmth={warmth}
                    pulse={pulse}
                    disabled={optedOut(task) || (task.phase === 'idle' && !manualStop(task))}
                    tag={waiting ? '候选任务' : ''}
                    title={task.label || MODE_LABEL[task.mode] || task.mode}
                    note={taskNote(task, now)}
                    status={statusText(task)}
                    action={<TaskControl task={task} deviceId={device.id} canControl={canControl} busyKey={busyKey} flowBusy={flowBusy} send={send} />}
                  />
                )
              })}
            </ul>
            <p className={styles.note}>指令随下次心跳下发（通常 1 分钟内），执行后回写结果。</p>
          </div>
        ) : (
          <p className="m-0 text-[#697268] dark:text-gray-400">插件尚未上报任务状态；请更新到支持远程操控的版本并配置回执密钥。</p>
        )}

        {commands.length ? (
          <div className="mt-4">
            <h4 className="m-0 text-[12px] font-semibold text-[#273228] dark:text-gray-100">最近指令回执</h4>
            <ul className="mt-2 list-none space-y-1.5 p-0">
              {commands.slice(0, 5).map((item) => {
                const [statusLabel, statusTone] = COMMAND_STATUS[item.status] || COMMAND_STATUS.pending
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#e5e9e2] bg-white px-3 py-2 text-[12px] dark:border-[#263142] dark:bg-[#0d141c]">
                    <span className="font-medium text-[#273228] dark:text-gray-100">
                      {COMMAND_LABEL[item.command] || item.command}{item.modeLabel ? ` · ${item.modeLabel}` : ''}
                    </span>
                    <StatusPill size="sm" tone={statusTone}>{statusLabel}</StatusPill>
                    <span className="text-[#7a8479] dark:text-gray-400">{time(item.finishedAt || item.claimedAt || item.createdAt)}</span>
                    {item.result ? <span className="w-full text-[#536471] dark:text-gray-400">{item.result}</span> : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        <dl className="mb-0 mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[#7a8479] dark:text-gray-400">最近确认动作</dt>
            <dd className="m-0 mt-1">{device.lastAction ? `${time(device.lastAction.occurred_at)} · ${device.lastAction.taskLabel}` : '近 7 天无回执'}</dd>
          </div>
          <div>
            <dt className="text-[#7a8479] dark:text-gray-400">最近失败或受限</dt>
            <dd className="m-0 mt-1">{device.lastFailure ? `${time(device.lastFailure.occurred_at)} · ${device.lastFailure.taskLabel} · ${device.lastFailure.error_code || device.lastFailure.result}` : '近 7 天无异常回执'}</dd>
          </div>
        </dl>
        {quiet ? (
          <p className="mb-0 mt-3 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            任务声明运行中，但近 30 分钟没有确认动作。可检查插件任务页是否在等待或受阻。
          </p>
        ) : null}
      </div>
    </article>
  )
}
