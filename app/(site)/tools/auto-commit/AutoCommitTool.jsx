'use client'

import { useMemo, useState } from 'react'

const INTENSITIES = {
  low: { label: '低', min: 1, max: 2, probability: 0.4, description: '约 40% 的日期有提交，每天 1–2 个' },
  medium: { label: '中', min: 1, max: 4, probability: 0.7, description: '约 70% 的日期有提交，每天 1–4 个' },
  high: { label: '高', min: 2, max: 6, probability: 0.95, description: '约 95% 的日期有提交，每天 2–6 个' },
}

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-800'

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addMonths(date, amount) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function generateCommitDates(startDate, endDate, intensity, seed) {
  const profile = INTENSITIES[intensity]
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  if (!profile || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return []
  const dayCount = Math.floor((end - start) / 86400000) + 1
  if (dayCount > 366) return []

  const random = seededRandom(seed)
  const dates = []
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (random() > profile.probability) continue
    const count = Math.floor(random() * (profile.max - profile.min + 1)) + profile.min
    for (let index = 0; index < count; index += 1) {
      const date = new Date(cursor)
      date.setHours(9 + Math.floor(random() * 15), Math.floor(random() * 60), Math.floor(random() * 60), 0)
      dates.push(date)
    }
  }
  return dates.sort((a, b) => a - b)
}

function countByDay(dates) {
  const counts = new Map()
  for (const date of dates) {
    const key = localDateString(date)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || `GitHub 请求失败（${response.status}）`)
  return data
}

async function fetchContributions(token) {
  const user = await githubRequest('/user', token)
  const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`
  const result = await githubRequest('/graphql', token, {
    method: 'POST',
    body: JSON.stringify({ query, variables: { login: user.login } }),
  })
  if (result.errors?.length) throw new Error(result.errors[0].message)
  const calendar = result.data?.user?.contributionsCollection?.contributionCalendar
  if (!calendar) throw new Error('GitHub 没有返回贡献图数据')
  return {
    login: user.login,
    total: calendar.totalContributions,
    days: calendar.weeks.flatMap((week) => week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount }))),
  }
}

async function pushCommits({ token, owner, repo, branch, message, dates, onProgress }) {
  const user = await githubRequest('/user', token)
  const author = {
    name: user.name || user.login,
    email: `${user.id}+${user.login}@users.noreply.github.com`,
  }
  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  const refPath = `${repoPath}/git/ref/heads/${encodeURIComponent(branch)}`
  const ref = await githubRequest(refPath, token)
  let parentSha = ref.object.sha
  const baseCommit = await githubRequest(`${repoPath}/git/commits/${parentSha}`, token)
  const treeSha = baseCommit.tree.sha
  let pushed = 0

  try {
    for (const date of dates) {
      const isoDate = date.toISOString()
      const commit = await githubRequest(`${repoPath}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: treeSha,
          parents: [parentSha],
          author: { ...author, date: isoDate },
          committer: { ...author, date: isoDate },
        }),
      })
      parentSha = commit.sha
      pushed += 1
      onProgress(pushed, dates.length)
    }
  } finally {
    if (pushed > 0) {
      await githubRequest(`${repoPath}/git/refs/heads/${encodeURIComponent(branch)}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ sha: parentSha, force: false }),
      })
    }
  }
  return pushed
}

function Heatmap({ days, title, totalLabel }) {
  if (!days.length) return null
  const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  const level = (count) => count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4
  const padding = new Date(`${days[0].date}T12:00:00`).getDay()
  const cells = [...Array(padding).fill(null), ...days]
  const weeks = []
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7))

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">{title}</span>
        <span className="text-slate-400">{totalLabel}</span>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const day = week[dayIndex]
                return day ? (
                  <span key={day.date} title={`${day.date}: ${day.count} 次`} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: colors[level(day.count)] }} />
                ) : <span key={dayIndex} className="h-[11px] w-[11px]" />
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="block space-y-1.5">
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{hint ? <span className="text-xs font-normal">{hint}</span> : null}
      </span>
      {children}
    </div>
  )
}

export default function AutoCommitTool() {
  const today = useMemo(() => new Date(), [])
  const [token, setToken] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [branch, setBranch] = useState('main')
  const [message, setMessage] = useState('update')
  const [startDate, setStartDate] = useState(localDateString(addMonths(today, -3)))
  const [endDate, setEndDate] = useState(localDateString(today))
  const [intensity, setIntensity] = useState('medium')
  const [seed, setSeed] = useState(() => Date.now() & 0xffffffff)
  const [calendar, setCalendar] = useState(null)
  const [calendarState, setCalendarState] = useState({ loading: false, error: '' })
  const [runState, setRunState] = useState({ kind: 'idle', message: '', done: 0, total: 0 })

  const plannedDates = useMemo(
    () => generateCommitDates(startDate, endDate, intensity, seed),
    [startDate, endDate, intensity, seed],
  )
  const previewDays = useMemo(() => {
    if (!calendar) return []
    const additions = countByDay(plannedDates)
    return calendar.days.map((day) => ({ ...day, count: day.count + (additions.get(day.date) || 0) }))
  }, [calendar, plannedDates])
  const previewTotal = previewDays.reduce((sum, day) => sum + day.count, 0)
  const running = runState.kind === 'running'

  async function loadCalendar() {
    if (!token) {
      setCalendarState({ loading: false, error: '请先填写 Token' })
      return
    }
    setCalendarState({ loading: true, error: '' })
    try {
      setCalendar(await fetchContributions(token))
      setCalendarState({ loading: false, error: '' })
    } catch (error) {
      setCalendarState({ loading: false, error: error.message || String(error) })
    }
  }

  async function run() {
    const [owner, repo] = repoPath.split('/').map((part) => part.trim())
    if (!token || !owner || !repo) {
      setRunState({ kind: 'error', message: '请填写 Token 和 owner/repo', done: 0, total: 0 })
      return
    }
    if (!plannedDates.length) {
      setRunState({ kind: 'error', message: '日期无效、超过一年，或当前随机结果没有提交', done: 0, total: 0 })
      return
    }
    if (!window.confirm(`将向 ${owner}/${repo} 的 ${branch} 分支创建并推送 ${plannedDates.length} 个历史提交。确定继续吗？`)) return

    setRunState({ kind: 'running', message: '', done: 0, total: plannedDates.length })
    try {
      const pushed = await pushCommits({
        token, owner, repo, branch, message, dates: plannedDates,
        onProgress: (done, total) => setRunState({ kind: 'running', message: '', done, total }),
      })
      setRunState({ kind: 'success', message: `成功推送 ${pushed} 个提交`, done: pushed, total: plannedDates.length })
      await loadCalendar()
    } catch (error) {
      setRunState((current) => ({ ...current, kind: 'error', message: error.message || String(error) }))
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <Field
          label="Personal Access Token"
          hint={<a href="https://github.com/settings/tokens/new?scopes=repo&description=AutoCommit" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">生成 Token ↗</a>}
        >
          <input aria-label="Personal Access Token" type="password" value={token} onChange={(event) => { setToken(event.target.value); setCalendar(null) }} placeholder="ghp_..." autoComplete="off" className={fieldClass} />
        </Field>
        <Field label="仓库"><input aria-label="仓库" value={repoPath} onChange={(event) => setRepoPath(event.target.value)} placeholder="owner/repo" className={fieldClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="起始日期"><input aria-label="起始日期" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClass} /></Field>
          <Field label="结束日期"><input aria-label="结束日期" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldClass} /></Field>
        </div>
        <Field label="强度">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(INTENSITIES).map(([id, item]) => (
              <button key={id} type="button" onClick={() => setIntensity(id)} className={`rounded-lg py-2 text-sm font-medium transition ${intensity === id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-normal text-slate-500">{INTENSITIES[intensity].description}</p>
        </Field>
        <details className="text-sm text-slate-500 dark:text-slate-400">
          <summary className="cursor-pointer select-none">高级设置</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="分支"><input aria-label="分支" value={branch} onChange={(event) => setBranch(event.target.value)} className={fieldClass} /></Field>
            <Field label="提交信息"><input aria-label="提交信息" value={message} onChange={(event) => setMessage(event.target.value)} className={fieldClass} /></Field>
          </div>
        </details>
        <button type="button" onClick={run} disabled={running} className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
          {running ? `推送中 ${runState.done}/${runState.total}` : `开始填充（计划 ${plannedDates.length} 个提交）`}
        </button>
        {runState.kind === 'success' ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{runState.message}</p> : null}
        {runState.kind === 'error' ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{runState.message}</p> : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">贡献图预览</h2>
          <div className="flex items-center gap-2">
            {calendar ? <button type="button" onClick={() => setSeed((value) => value + 1)} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">重新随机</button> : null}
            <button type="button" onClick={loadCalendar} disabled={calendarState.loading || !token} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              {calendarState.loading ? '拉取中…' : calendar ? '刷新' : '拉取当前贡献图'}
            </button>
          </div>
        </div>
        {calendarState.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">{calendarState.error}</p> : null}
        {!calendar ? <p className="text-xs leading-5 text-slate-400">填好 Token 后拉取过去一年的真实贡献图。预览使用固定随机种子，看到的计划与实际推送一致。</p> : (
          <div className="space-y-5">
            <Heatmap days={calendar.days} title={`当前 @${calendar.login}`} totalLabel={`${calendar.total} 次贡献`} />
            <Heatmap days={previewDays} title="填充后预览" totalLabel={`${previewTotal} 次（+${previewTotal - calendar.total}）`} />
          </div>
        )}
      </section>

      <p className="px-2 text-center text-xs leading-5 text-slate-400">
        Token 只保存在当前页面内存，并由浏览器直接发送给 GitHub；本站不会接收或保存。建议使用专用空仓库，避免给正式项目制造无意义提交。
      </p>
    </div>
  )
}
