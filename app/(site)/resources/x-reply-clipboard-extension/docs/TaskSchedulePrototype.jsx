'use client'

import { useState } from 'react'

const TASKS = [
  { id: 'timeline', label: '评论帖子', group: '评论', page: 'X 首页' },
  { id: 'notifications', label: '评论通知', group: '评论', page: 'X 通知' },
  { id: 'like-posts', label: '点赞帖子', group: '点赞', page: 'X 首页' },
  { id: 'like-replies', label: '点赞评论', group: '点赞', page: 'X 通知 / 帖子' },
  { id: 'poster', label: '普通发帖', group: '发帖', page: 'X 首页' },
  { id: 'premium-poster', label: '精品发帖', group: '发帖', page: 'X 首页' },
  { id: 'follow-back', label: '回关粉丝', group: '关注', page: 'Followers', cadence: '夜间 22–06；每 15 个冷却 30 分钟' },
  { id: 'unfollow', label: '清理未回关', group: '关注', page: 'Following', cadence: '约每 7 天一轮' },
]

const WINDOWS = {
  all: { label: '全天', allows: () => true },
  day: { label: '白天 08–20', allows: (hour) => hour >= 8 && hour < 20 },
  peak: { label: '高峰 08–10 / 18–20', allows: (hour) => (hour >= 8 && hour < 10) || (hour >= 18 && hour < 20) },
  overnight: { label: '夜间 22–06', allows: (hour) => hour >= 22 || hour < 6 },
}

const MOMENTS = [
  { label: '09:30 · 精品发帖档', hour: 9, premium: true },
  { label: '13:00 · 日常轮转', hour: 13, premium: false },
  { label: '21:00 · 夜间轮转', hour: 21, premium: false },
  { label: '23:00 · 夜间回关', hour: 23, premium: false },
  { label: '05:00 · 清晨回关', hour: 5, premium: false },
]

const PREMIUM_SLOTS = '08:00 / 09:30 / 12:00 / 15:00 / 19:00'

function createPlan() {
  return Object.fromEntries(TASKS.map((task) => [task.id, {
    enabled: true,
    priority: task.group === '评论' || task.group === '点赞' ? 3 : task.group === '发帖' ? 2 : 1,
    window: task.id === 'premium-poster' ? 'day' : task.id === 'follow-back' ? 'overnight' : 'all',
  }]))
}

const INITIAL_PLANS = { a: createPlan(), b: createPlan() }

function buildPreview(plan, moment, coolingTask) {
  const eligible = []
  const excluded = []
  TASKS.forEach((task, index) => {
    const settings = plan[task.id]
    let reason = ''
    if (!settings.enabled) reason = '已停用'
    else if (task.id === coolingTask) reason = '冷却中'
    else if (task.id === 'premium-poster' && !moment.premium) reason = '未到发帖档位'
    else if (!WINDOWS[settings.window].allows(moment.hour)) reason = '不在可运行时段'
    if (reason) excluded.push({ ...task, reason })
    else eligible.push({ ...task, priority: settings.priority, index })
  })
  eligible.sort((a, b) => {
    if (moment.premium) {
      if (a.id === 'premium-poster') return -1
      if (b.id === 'premium-poster') return 1
    }
    return b.priority - a.priority || a.index - b.index
  })
  return { eligible, excluded }
}

const selectClass = 'rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] px-2 py-1.5 text-[11px] text-[var(--site-ink)] focus-visible:outline-2 focus-visible:outline-[var(--site-green)]'

export default function TaskSchedulePrototype() {
  const [plans, setPlans] = useState(INITIAL_PLANS)
  const [account, setAccount] = useState('a')
  const [momentIndex, setMomentIndex] = useState(0)
  const [coolingTask, setCoolingTask] = useState('')
  const [slice, setSlice] = useState(30)
  const plan = plans[account]
  const moment = MOMENTS[momentIndex]
  const { eligible, excluded } = buildPreview(plan, moment, coolingTask)

  function updateTask(id, field, value) {
    setPlans((current) => ({
      ...current,
      [account]: { ...current[account], [id]: { ...current[account][id], [field]: value } },
    }))
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--site-line)] bg-[var(--site-panel)]" aria-labelledby="task-schedule-prototype-title">
      <div className="border-b border-[var(--site-line)] p-4 md:p-5">
        <span className="inline-flex rounded-full border border-[var(--site-line)] px-2 py-0.5 text-[10px] font-semibold text-[var(--site-green)]">可交互原型 · 设置仅保留在当前页面</span>
        <h4 id="task-schedule-prototype-title" className="mt-2 text-[15px] font-semibold text-[var(--site-ink)]">单页签排班管理</h4>
        <p className="mt-1 text-[12px] leading-5 text-[var(--site-muted)]">按账号决定哪些任务参与轮班、何时可以运行，以及同一页签一次交给哪个任务。这里的操作不会修改扩展设置或正在运行的任务。</p>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[var(--site-ink)]">排班账号</span>
          {['a', 'b'].map((id) => (
            <button key={id} type="button" aria-pressed={account === id} onClick={() => setAccount(id)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${account === id ? 'border-[var(--site-green)] bg-[var(--site-green)] text-white' : 'border-[var(--site-line)] text-[var(--site-muted)]'}`}>
              账号 {id.toUpperCase()}
            </button>
          ))}
          <button type="button" onClick={() => setPlans((current) => ({ ...current, [account]: createPlan() }))} className="ml-auto rounded-lg border border-[var(--site-line)] px-2.5 py-1.5 text-[11px] text-[var(--site-muted)] hover:text-[var(--site-ink)]">重置此账号</button>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {TASKS.map((task) => {
            const settings = plan[task.id]
            return (
              <div key={task.id} className={`rounded-xl border p-3 ${settings.enabled ? 'border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-green)_3%,var(--site-panel))]' : 'border-[var(--site-line)] opacity-60'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-[var(--site-faint)]">{task.group} · {task.page}</span>
                    <div className="text-[12px] font-semibold text-[var(--site-ink)]">{task.label}</div>
                    {task.cadence ? <div className="text-[10px] text-[var(--site-faint)]">{task.cadence}</div> : null}
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-[var(--site-muted)]">
                    <input type="checkbox" checked={settings.enabled} onChange={(event) => updateTask(task.id, 'enabled', event.target.checked)} className="accent-[var(--site-green)]" />参与
                  </label>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-[10px] text-[var(--site-faint)]">优先级
                    <select aria-label={`${task.label}优先级`} value={settings.priority} onChange={(event) => updateTask(task.id, 'priority', Number(event.target.value))} className={selectClass}>
                      <option value={1}>常规</option><option value={2}>优先</option><option value={3}>最高</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-[var(--site-faint)]">时段
                    <select aria-label={`${task.label}可运行时段`} value={settings.window} onChange={(event) => updateTask(task.id, 'window', event.target.value)} className={selectClass}>
                      {Object.entries(WINDOWS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-xl border border-[var(--site-line)] bg-[color-mix(in_srgb,var(--site-green)_5%,var(--site-panel))] p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[12px] text-[var(--site-ink)]">运行预览</strong>
            <span className="text-[10px] text-[var(--site-faint)]">账号 {account.toUpperCase()} · 同时最多 1 项</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="flex items-center gap-1 text-[11px] text-[var(--site-muted)]">模拟时间
              <select value={momentIndex} onChange={(event) => setMomentIndex(Number(event.target.value))} className={selectClass}>
                {MOMENTS.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-1 text-[11px] text-[var(--site-muted)]">单次占用
              <select value={slice} onChange={(event) => setSlice(Number(event.target.value))} className={selectClass}>
                <option value={20}>20 秒</option><option value={30}>30 秒</option><option value={45}>45 秒</option>
              </select>
            </label>
            <label className="flex items-center gap-1 text-[11px] text-[var(--site-muted)]">模拟冷却
              <select value={coolingTask} onChange={(event) => setCoolingTask(event.target.value)} className={selectClass}>
                <option value="">无</option>{TASKS.map((task) => <option key={task.id} value={task.id}>{task.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_1fr]" aria-live="polite">
            <div className="rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] p-3">
              <div className="text-[10px] font-semibold text-[var(--site-faint)]">当前可运行队列 · {eligible.length} 项</div>
              {eligible.length ? <ol className="mt-2 space-y-1.5">
                {eligible.map((task, index) => <li key={task.id} className="flex items-center gap-2 text-[11px] text-[var(--site-muted)]"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${index === 0 ? 'bg-[var(--site-green)] text-white' : 'bg-[var(--site-panel-strong)] text-[var(--site-faint)]'}`}>{index + 1}</span><span className={index === 0 ? 'font-semibold text-[var(--site-ink)]' : ''}>{task.label}</span><span className="ml-auto text-[10px] text-[var(--site-faint)]">{index === 0 ? `执行 ≤ ${slice} 秒` : '等待轮换'}</span></li>)}
              </ol> : <p className="mt-2 text-[11px] text-[var(--site-muted)]">当前没有可运行任务；页签保持空闲，等待下一次到期检查。</p>}
            </div>
            <div className="rounded-lg border border-[var(--site-line)] bg-[var(--site-panel)] p-3">
              <div className="text-[10px] font-semibold text-[var(--site-faint)]">暂不进入队列 · {excluded.length} 项</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{excluded.length ? excluded.map((task) => <span key={task.id} className="rounded-full border border-[var(--site-line)] px-2 py-1 text-[10px] text-[var(--site-muted)]">{task.label} · {task.reason}</span>) : <span className="text-[11px] text-[var(--site-muted)]">全部任务均可参与</span>}</div>
              <p className="mt-3 text-[10px] leading-5 text-[var(--site-faint)]">精品发帖保留现有五个北京时间档位：{PREMIUM_SLOTS}。未到档位或冷却中的任务不会抢占页签。</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="border-t border-[var(--site-line)] px-4 py-3 text-[11px] leading-5 text-[var(--site-faint)] md:px-5">原型只演示单次候选顺序：默认先评论、再点赞、再发帖、最后关注；精品发帖到固定档位时优先。回关默认在夜间 22:00–06:00 进行，每确认 15 个冷却 30 分钟，夜间到期后继续；清理未回关约每 7 天重新入队。正式调度还会参考最近执行时间与冷却截止时间。设置与预览均不会写入浏览器存储。</figcaption>
    </figure>
  )
}
