'use client'

import {
  X_DEFAULT_TASK_PRIORITY,
  X_RUNTIME_MODE_LABELS,
  X_SCHEDULE_PRIORITY_HINT,
  xPriorityLabel,
} from '../../../../../lib/community/xExtensionMonitorShared'
import { AdminButton, StatusPill } from '../../../components/ui'

const MODE_LABEL = X_RUNTIME_MODE_LABELS
const PRIORITY_HINT = X_SCHEDULE_PRIORITY_HINT
const priorityLabel = (mode, priority) => xPriorityLabel(Number(priority) || X_DEFAULT_TASK_PRIORITY[mode] || 1)
const TASK_PHASE = {
  running: ['运行中', 'info'],
  waiting: ['等待中', 'warning'],
  paused: ['等待中', 'warning'],
  stopping: ['等待中', 'warning'],
  idle: ['已停止', 'neutral'],
  unknown: ['需处理', 'warning'],
  blocked: ['需处理', 'warning'],
}
const GROUP_PHASE = {
  running: ['运行中', 'info'],
  waiting: ['等待中', 'warning'],
  stopping: ['等待中', 'warning'],
  idle: ['已停止', 'neutral'],
  unknown: ['需处理', 'warning'],
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

const toneDot = (phase) => {
  if (phase === 'running') return 'bg-emerald-400'
  if (phase === 'waiting' || phase === 'paused' || phase === 'stopping') return 'bg-amber-400'
  if (phase === 'unknown' || phase === 'blocked') return 'bg-rose-300'
  return 'bg-slate-300'
}

function railText(card, fallback) {
  if (!card) return fallback
  const bits = [card.label || MODE_LABEL[card.mode] || card.mode]
  if (Number(card.actions) > 0) bits.push(`${card.actions} 次`)
  if (card.status === 'ready') bits.push('可立即运行')
  else if (card.reason) bits.push(card.reason)
  else if (Number(card.readyAt) > 0) bits.push(`约 ${clock(card.readyAt)}`)
  else if (Number(card.endedAt) > 0) bits.push(clock(card.endedAt))
  return bits.filter(Boolean).join(' · ')
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

        {canControl ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {device.phase === 'idle' ? (
              <AdminButton size="sm" variant="primary" disabled={flowBusy} onClick={() => send('flow-start')}>全流程启动</AdminButton>
            ) : null}
            {['running', 'paused'].includes(device.phase) ? (
              <AdminButton size="sm" disabled={flowBusy} onClick={() => send('flow-pause')}>暂停全部</AdminButton>
            ) : null}
            <span className="self-center text-[11px] text-[#7a8479] dark:text-gray-400">指令随下次心跳下发（通常 1 分钟内），执行后回写结果。</span>
          </div>
        ) : null}

        {device.telemetry ? (
          <div className="overflow-hidden rounded-2xl border border-[#d7e3f4] bg-white shadow-[0_10px_30px_rgba(15,20,25,0.06)] dark:border-[#263142] dark:bg-[#0d141c]">
            <div className="flex items-start justify-between gap-3 border-b border-[#e8eef5] px-4 py-3 dark:border-[#263142]">
              <div>
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">排班台</p>
                <p className="mb-0 mt-1 text-[12px] text-[#536471] dark:text-gray-400">
                  {schedule?.enabled
                    ? `单页签轮班 · ${schedule.priorityHint || PRIORITY_HINT}`
                    : '排班未启用或尚未上报轮班快照'}
                </p>
                <p className="mb-0 mt-1 text-[12px] text-[#0f1419] dark:text-gray-100">{facingSummary(facing)}</p>
              </div>
              <div className="flex flex-wrap gap-1" aria-hidden="true">
                {groups.flatMap((group) => group.tasks).map((task) => (
                  <i
                    key={task.mode}
                    className={`block h-2 w-2 rounded-full ${toneDot(task.phase)}`}
                    title={`${task.label} · ${priorityLabel(task.mode, task.priority)} · ${(TASK_PHASE[task.phase] || TASK_PHASE.idle)[0]}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2 border-b border-[#e8eef5] px-4 py-3 dark:border-[#263142] sm:grid-cols-3">
              <div className="rounded-xl border border-[#eef3f8] bg-[#f8fbff] px-3 py-2.5 dark:border-[#263142] dark:bg-[#101820]">
                <em className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697268] not-italic">上一任务</em>
                <strong className="mt-1 block text-[12px] font-semibold text-[#0f1419] dark:text-gray-100">{railText(schedule?.past, '暂无轮班记录')}</strong>
              </div>
              <div className="rounded-xl border border-[#cfe3f5] bg-[#f0f8ff] px-3 py-2.5 dark:border-[#1d9bf0]/40 dark:bg-[#0f1a24]">
                <em className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1d9bf0] not-italic">当前任务</em>
                <strong className="mt-1 block text-[12px] font-semibold text-[#0f1419] dark:text-gray-100">{railText(schedule?.now, device.phase === 'running' ? '轮班占用中' : '当前空闲')}</strong>
              </div>
              <div className="rounded-xl border border-[#eef3f8] bg-[#f8fbff] px-3 py-2.5 dark:border-[#263142] dark:bg-[#101820]">
                <em className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#697268] not-italic">下一任务</em>
                <strong className="mt-1 block text-[12px] font-semibold text-[#0f1419] dark:text-gray-100">{railText(schedule?.next, '等待任务到期')}</strong>
              </div>
            </div>

            {groups.length ? (
              <div className="grid gap-0 sm:grid-cols-2">
                {groups.map((group) => {
                  const [groupLabel, groupTone] = GROUP_PHASE[group.phase] || GROUP_PHASE.idle
                  return (
                    <section key={group.id} className="border-t border-[#e8eef5] px-4 py-3 sm:border-r sm:odd:border-r dark:border-[#263142] sm:[&:nth-child(2n)]:border-r-0">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="m-0 text-[13px] font-semibold text-[#0f1419] dark:text-gray-100">{group.label}</h3>
                        <StatusPill size="sm" tone={groupTone}>{groupLabel}</StatusPill>
                      </div>
                      <ul className="m-0 list-none space-y-2 p-0">
                        {group.tasks.map((task) => {
                          const [taskLabel, taskTone] = TASK_PHASE[task.phase] || TASK_PHASE.idle
                          const countdown = waitCopy(task.waitUntil, now)
                          const detail = task.detail
                            || (task.phase === 'waiting' || task.phase === 'paused' ? '任务已启动，正在等待下一轮或冷却结束'
                              : task.phase === 'idle' ? '当前没有运行记录'
                                : task.phase === 'unknown' ? '超过 90 秒没有状态更新'
                                  : task.phase === 'stopping' ? '正在结束当前任务'
                                    : '任务正在执行')
                          const taskBusy = busyKey === `${device.id}:task-start:${task.mode}` || busyKey === `${device.id}:task-stop:${task.mode}`
                          return (
                            <li key={task.mode} className="rounded-xl border border-[#eef3f8] bg-[#f8fbff] px-3 py-2.5 dark:border-[#263142] dark:bg-[#101820]">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <strong className="text-[12px] text-[#0f1419] dark:text-gray-100">{task.label || MODE_LABEL[task.mode] || task.mode}</strong>
                                    <span className="rounded-md border border-[#d7e3f4] px-1.5 py-0.5 text-[10px] font-semibold text-[#536471] dark:border-[#354438] dark:text-gray-400">
                                      {priorityLabel(task.mode, task.priority)}
                                    </span>
                                    <StatusPill size="sm" tone={taskTone}>{taskLabel}</StatusPill>
                                    {countdown ? <span className="text-[11px] tabular-nums text-amber-700 dark:text-amber-300">{countdown}</span> : null}
                                  </div>
                                  <p className="mb-0 mt-1 text-[11px] leading-5 text-[#536471] dark:text-gray-400">
                                    {detail}{task.updatedAt ? ` · 最近更新 ${clock(task.updatedAt)}` : ''}
                                  </p>
                                </div>
                                {canControl && task.phase !== 'unknown' ? (
                                  <div className="flex shrink-0 gap-1">
                                    {task.phase === 'idle' ? (
                                      <button type="button" disabled={Boolean(busyKey)} onClick={() => send('task-start', task.mode)} className="rounded-md border border-[#cfe3f5] px-2 py-1 text-[11px] font-semibold text-[#1d9bf0] disabled:opacity-40 dark:border-[#354438]">
                                        {taskBusy ? '…' : '启动'}
                                      </button>
                                    ) : null}
                                    {['running', 'waiting', 'paused'].includes(task.phase) ? (
                                      <button type="button" disabled={Boolean(busyKey)} onClick={() => send('task-stop', task.mode)} className="rounded-md border border-[#f0d0d3] px-2 py-1 text-[11px] font-semibold text-[#f4212e] disabled:opacity-40 dark:border-[#354438]">
                                        {taskBusy ? '…' : '停止'}
                                      </button>
                                    ) : null}
                                    {task.phase === 'stopping' ? <span className="text-[11px] text-[#697268]">等待中…</span> : null}
                                  </div>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
              </div>
            ) : (
              <p className="m-0 px-4 py-3 text-[#697268] dark:text-gray-400">当前没有任务状态快照</p>
            )}
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
