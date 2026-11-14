/** Shared X plugin monitor labels and schedule defaults for admin UI + server. */

export const X_RUNTIME_MODE_LABELS = Object.freeze({
  timeline: '评论首页',
  notifications: '评论回复',
  kol: '评论大V',
  'likes-posts': '点赞帖子',
  'likes-replies': '点赞评论',
  poster: '纯文字帖',
  'poster-premium': '精品发帖',
  'poster-x': 'X主题发帖',
  'poster-xhs': '小红书发帖',
  article: '普通发文',
  'site-forward': '站长转发',
  'community-share': '社群分发',
  'prune-posts': '清理低质帖',
  'prune-replies': '清理低质评论',
  'mutual-unfollow': '清理未回关',
  'mutual-unfollowNonSc': '清理非简中',
  'mutual-followBack': '回关粉丝',
  'mutual-targetFollow': '关注候选',
})

/** Align with extension defaultTaskPriority (三项评论 8；关注未达日目标时临时加到 8.5). */
export const X_DEFAULT_TASK_PRIORITY = Object.freeze({
  notifications: 8,
  timeline: 8,
  kol: 8,
  'poster-premium': 8,
  poster: 7,
  'poster-x': 7,
  'poster-xhs': 7,
  article: 7,
  'site-forward': 7,
  'community-share': 7,
  'likes-posts': 6,
  'likes-replies': 6,
  'mutual-followBack': 7,
  'mutual-targetFollow': 7,
  'mutual-unfollow': 3,
  'mutual-unfollowNonSc': 3,
  'prune-posts': 2,
  'prune-replies': 2,
})

export const X_SCHEDULE_PRIORITY_HINT = '优先级 1～10 分，分值越大越重要'

export const X_PRIORITY_LABELS = Object.freeze(Object.fromEntries(
  Array.from({ length: 10 }, (_, index) => {
    const score = index + 1
    return [score, `${score}分`]
  }),
))

export function xPriorityLabel(priority) {
  const rank = Math.max(1, Math.min(10, Number(priority) || 1))
  return X_PRIORITY_LABELS[rank] || `${rank}分`
}

export const X_RUNTIME_GROUPS = Object.freeze([
  { id: 'reply', label: '评论 · 默认 8 分', modes: ['notifications', 'timeline', 'kol'] },
  { id: 'poster', label: '发帖与清理 · 默认 2～8 分', modes: ['poster-premium', 'poster', 'poster-x', 'poster-xhs', 'article', 'site-forward', 'prune-posts', 'prune-replies'] },
  { id: 'community', label: '社群 · 默认 7 分', modes: ['community-share'] },
  { id: 'likes', label: '点赞 · 默认 6 分（短轮约 3 分钟）', modes: ['likes-posts', 'likes-replies'] },
  { id: 'mutual', label: '关注 · 默认 3～7 分（未达日目标时临时 8.5）', modes: ['mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow', 'mutual-unfollowNonSc'] },
])

export function defaultXTaskPriority(mode) {
  return Number(X_DEFAULT_TASK_PRIORITY[mode]) || 1
}

/** 与插件排班时段选项一致。后台修改后由远程指令写回本机。 */
export const X_SCHEDULE_WINDOWS = Object.freeze([
  { id: 'all', label: '全天' },
  { id: 'day', label: '08–20' },
  { id: 'peak', label: '08–10 / 18–20' },
  { id: 'overnight', label: '22–06' },
])

const X_SCHEDULE_WINDOW_IDS = new Set(X_SCHEDULE_WINDOWS.map((item) => item.id))

export function isXScheduleWindow(value) {
  return X_SCHEDULE_WINDOW_IDS.has(value)
}

export function defaultXTaskWindow(mode) {
  return mode === 'poster-premium' ? 'day' : 'all'
}

export function defaultXTaskEnabled(mode) {
  return !['mutual-unfollow', 'mutual-unfollowNonSc', 'prune-posts', 'prune-replies', 'poster', 'poster-premium', 'poster-x', 'poster-xhs', 'article', 'site-forward', 'community-share'].includes(mode)
}

function situationName(device) {
  const handle = String(device?.accountHandle || '').replace(/^@+/u, '').trim()
  return handle ? `@${handle}` : '这个插件'
}

function situationLabel(task) {
  return task?.label || X_RUNTIME_MODE_LABELS[task?.mode] || task?.mode || '这项任务'
}

function situationCountdown(until, now) {
  const remaining = Number(until) - Number(now)
  if (!(remaining > 0)) return ''
  const total = Math.ceil(remaining / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

function situationDetail(value) {
  const text = String(value || '').replace(/\s+/gu, ' ').trim()
  if (!text) return ''
  return text.length > 80 ? `${text.slice(0, 79)}…` : text
}

function situationTasks(device) {
  const groups = Array.isArray(device?.groups) ? device.groups : []
  const fromGroups = groups.flatMap((group) => Array.isArray(group?.tasks) ? group.tasks : [])
  if (fromGroups.length) return fromGroups
  return Array.isArray(device?.tasks) ? device.tasks : []
}

function situationAccountKey(device) {
  const handle = String(device?.accountHandle || '').replace(/^@+/u, '').trim().toLowerCase()
  return handle || `__${device?.id || ''}`
}

/** One current install per account. A live heartbeat replaces older offline installs. */
export function selectXPluginSituationDevices(devices = []) {
  const groups = new Map()
  for (const device of devices) {
    const key = situationAccountKey(device)
    const list = groups.get(key) || []
    list.push(device)
    groups.set(key, list)
  }
  const picked = []
  for (const list of groups.values()) {
    const online = list.filter((device) => device?.online)
    const pool = online.length ? online : list
    pool.sort((left, right) => (Number(right?.lastSeenAt) || 0) - (Number(left?.lastSeenAt) || 0))
    picked.push(...(online.length ? pool : pool.slice(0, 1)))
  }
  return picked
}

/** One sentence for the admin monitor, using the latest heartbeat snapshot. */
export function describeXPluginSituation(device, now = Date.now()) {
  const name = situationName(device)
  if (!device?.online) {
    const seen = Number(device?.lastSeenAt) || 0
    const when = seen
      ? new Date(seen).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
      : ''
    return when ? `${name}已离线，最近心跳是 ${when}，现在看不到任务状态。` : `${name}已离线，现在看不到任务状态。`
  }
  if (!device?.telemetry) return `${name}有心跳，还没有上报任务状态。`

  const tasks = situationTasks(device)
  const schedule = device?.schedule || null
  const running = tasks.filter((task) => task.phase === 'running')
  const starting = tasks.filter((task) => task.phase === 'starting')
  const needs = tasks.filter((task) => task.phase === 'unknown' || task.phase === 'blocked')
  const waiting = tasks.filter((task) => task.phase === 'waiting' || task.phase === 'paused' || task.phase === 'stopping')
  if (schedule && schedule.enabled === false) {
    const first = needs[0]
    const detail = situationDetail(first?.detail)
    const needsNote = needs.length
      ? `；另有 ${needs.length} 项需处理，其中${situationLabel(first)}${detail ? `是${detail}` : ''}`
      : ''
    return `${name}：排班已暂停${needsNote}。`
  }

  const parts = []
  if (running.length === 1) {
    const detail = situationDetail(running[0].detail)
    parts.push(`正在跑${situationLabel(running[0])}${detail ? `，${detail}` : ''}`)
  } else if (running.length > 1) {
    parts.push(`正在跑${running.map(situationLabel).join('、')}`)
  } else if (starting.length) {
    const task = starting[0]
    const detail = situationDetail(task.detail)
    const left = situationCountdown(task.waitUntil, now)
    parts.push(`${situationLabel(task)}正在启动${detail ? `，${detail}` : '，等待执行页回报'}${left ? `，剩余约 ${left}` : ''}`)
  } else if (schedule?.current) {
    const current = tasks.find((task) => task.mode === schedule.current)
    const detail = situationDetail(current?.detail)
    const label = current ? situationLabel(current) : (X_RUNTIME_MODE_LABELS[schedule.current] || schedule.current)
    parts.push(`当前轮到${label}${detail ? `，${detail}` : ''}`)
  } else {
    parts.push('当前没有任务在执行')
  }

  const cooldown = waiting.filter((task) => /疑似自动化|限制冷却|X 限制|冷却后自动重试/u.test(String(task.detail || '')))
  if (cooldown.length) {
    const detail = situationDetail(cooldown[0].detail)
    const left = situationCountdown(Math.max(...cooldown.map((task) => Number(task.waitUntil) || 0)), now)
    parts.push(`${cooldown.map(situationLabel).join('、')}在限制冷却${detail ? `，原因是${detail}` : ''}${left ? `，剩余约 ${left}` : ''}`)
  }

  if (needs.length) {
    const detail = situationDetail(needs[0].detail)
    parts.push(`${needs.length} 项需处理，其中${situationLabel(needs[0])}${detail ? `是${detail}` : ''}`)
  }

  const mentioned = new Set([...running, ...starting, ...cooldown].map((task) => task.mode))
  const next = schedule?.next
  if (next?.mode && !mentioned.has(next.mode) && !running.some((task) => task.mode === next.mode)) {
    const left = situationCountdown(next.readyAt, now)
    const reason = situationDetail(next.reason)
    const label = next.label || X_RUNTIME_MODE_LABELS[next.mode] || next.mode
    parts.push(`下一项是${label}${reason ? `，${reason}` : ''}${left ? `，约 ${left}后开始` : ''}`)
  }

  return `${name}：${parts.join('；')}。`
}
