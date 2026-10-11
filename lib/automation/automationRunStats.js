import { formatAutomationLastRun } from './automationLastRun.js'

export const AUTOMATION_GITHUB_WORKFLOWS = Object.freeze({
  'changelog-deepseek-update': { repo: 'TUARAN/tuaran-home-page', file: 'changelog-update.yml' },
  'pages-deploy-alert': { repo: 'TUARAN/tuaran-home-page', file: 'pages-deploy-alert.yml' },
  'github-auto-follow': { repo: 'TUARAN/github-auto-follow', file: 'daily-follow.yml' },
  'autopilot-security-scan': { repo: 'TUARAN/tuaran-home-page', file: 'security-scan.yml' },
  'autopilot-perf-scan': { repo: 'TUARAN/tuaran-home-page', file: 'perf-scan.yml' },
  'autopilot-design-scan': { repo: 'TUARAN/tuaran-home-page', file: 'design-scan.yml' },
  'x-morning-greeting': { repo: 'TUARAN/tuaran-home-page', file: 'morning-greeting.yml' },
  'engagement-bot': { repo: 'TUARAN/tuaran-home-page', file: 'engagement-bot.yml' },
  'a-share-research-daily': { repo: 'TUARAN/tuaran-home-page', file: 'a-share-research.yml' },
  'crypto-research-daily': { repo: 'TUARAN/tuaran-home-page', file: 'crypto-research.yml' },
  'rss-feed-updates': { repo: 'TUARAN/tuaran-home-page', file: 'rss-updates.yml' },
})

const SAMPLE_LIMIT = 10
const workflowCache = new Map()

export function shanghaiDateKey(at) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at)
}

function shanghaiClock(at) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
}

function conclusionOf(run) {
  const status = String(run?.status || '').toLowerCase()
  const conclusion = String(run?.conclusion || '').toLowerCase()
  if (
    conclusion === 'running'
    || conclusion === 'in_progress'
    || status === 'in_progress'
    || status === 'queued'
    || status === 'waiting'
    || status === 'pending'
    || status === 'running'
  ) {
    return 'running'
  }
  if (conclusion === 'skipped' || conclusion === 'cancelled' || conclusion === 'canceled' || status === 'skipped') return 'skipped'
  if (conclusion === 'success' || conclusion === 'ok' || run?.ok === true) return 'success'
  if (conclusion === 'failure' || conclusion === 'failed' || conclusion === 'partial' || run?.ok === false) return 'failure'
  if (status === 'completed') return 'failure'
  return ''
}

export function normalizeAutomationRun(run) {
  const at = Number(run?.at || Date.parse(run?.run_started_at || run?.created_at || '') || 0)
  const conclusion = conclusionOf(run)
  if (!at || !conclusion) return null
  return {
    at,
    conclusion,
    error: String(run?.error || run?.detail || '').replace(/\s+/g, ' ').trim().slice(0, 80),
    dateOnly: Boolean(run?.dateOnly),
  }
}

export function runsFromGitHubPayload(payload) {
  return (payload?.workflow_runs || []).map((run) => normalizeAutomationRun({
    at: Date.parse(run.run_started_at || run.created_at || ''),
    status: run.status,
    conclusion: run.conclusion,
  })).filter(Boolean)
}

export function runsFromStatusRows(rows, { atKey = 'ran_at', statusKey = 'status', errorKey = 'error' } = {}) {
  return (rows || []).map((row) => normalizeAutomationRun({
    at: Number(row?.[atKey] || 0),
    conclusion: row?.[statusKey],
    ok: row?.[statusKey] === 'ok' || row?.[statusKey] === 'success',
    error: row?.[errorKey] || row?.detail || '',
  })).filter(Boolean)
}

export function runsFromDailyBriefs(list) {
  const dates = new Set(
    (list || [])
      .map((item) => String(item?.date || item || ''))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
  )
  if (!dates.size) return []
  const latest = [...dates].sort().at(-1)
  const end = Date.parse(`${latest}T16:00:00+08:00`)
  const runs = []
  for (let index = 0; index < SAMPLE_LIMIT; index += 1) {
    const at = end - index * 24 * 60 * 60 * 1000
    const key = shanghaiDateKey(at)
    runs.push(normalizeAutomationRun({
      at,
      conclusion: dates.has(key) ? 'success' : 'failure',
      dateOnly: true,
    }))
  }
  return runs.filter(Boolean)
}

export function runsFromRecentLogs(logs) {
  return (logs || []).map((run) => normalizeAutomationRun({
    at: Date.parse(run.startedAt || ''),
    conclusion: run.status === 'success' ? 'success' : run.status === 'failed' ? 'failure' : run.status,
    error: '',
  })).filter(Boolean)
}

export function summarizeAutomationRuns(runs) {
  const normalized = (runs || []).map((run) => normalizeAutomationRun(run)).filter(Boolean)
  normalized.sort((left, right) => right.at - left.at)
  const latest = normalized.find((run) => run.conclusion !== 'skipped') || normalized[0] || null
  const sample = normalized.filter((run) => run.conclusion === 'success' || run.conclusion === 'failure').slice(0, SAMPLE_LIMIT)
  return {
    lastRun: latest ? formatRunMoment(latest) : '',
    successRate: sample.length ? formatSuccessRate(sample) : '',
  }
}

function formatRunMoment(run) {
  if (run.dateOnly) {
    const date = shanghaiDateKey(run.at).replaceAll('-', '/')
    if (run.conclusion === 'failure') return `${date} 失败`
    if (run.conclusion === 'running') return `${date} 运行中`
    return `${date} 成功`
  }
  if (run.conclusion === 'running') return `${shanghaiClock(run.at)} 运行中`
  if (run.conclusion === 'skipped') return `${shanghaiClock(run.at)} 跳过`
  return formatAutomationLastRun({
    at: run.at,
    ok: run.conclusion === 'success',
    error: run.error,
  })
}

function formatSuccessRate(sample) {
  const success = sample.filter((run) => run.conclusion === 'success').length
  return `最近 ${sample.length} 次 ${success} 成功`
}

export function chooseAutomationRuns({ logRuns = [], githubRuns = [], recordedRuns = [] } = {}) {
  if (logRuns.length) return logRuns
  if (githubRuns.length) return githubRuns
  return recordedRuns
}

export function hasConcreteLastRun(text) {
  return /20\d{2}/.test(String(text || ''))
}

export function hasCountedSuccessRate(text) {
  return /最近\s*\d+\s*次/.test(String(text || ''))
}

export function resolveAutomationStats(item, sources = {}) {
  const summary = summarizeAutomationRuns(chooseAutomationRuns(sources))
  return {
    lastRun: summary.lastRun || (hasConcreteLastRun(item?.lastRun) ? item.lastRun : '尚无运行记录'),
    successRate: summary.successRate || (hasCountedSuccessRate(item?.successRate) ? item.successRate : '尚无记录'),
  }
}

export async function fetchGitHubWorkflowRuns(workflows, { fetchImpl = fetch, token = '', now = Date.now(), cacheMs = 3 * 60 * 1000 } = {}) {
  const entries = Object.entries(workflows || {})
  const results = await Promise.all(entries.map(async ([id, workflow]) => {
    const cacheKey = `${workflow.repo}/${workflow.file}`
    const cached = workflowCache.get(cacheKey)
    if (cached && now - cached.at < cacheMs) return [id, cached.runs]
    const runs = await requestWorkflowRuns(workflow, { fetchImpl, token })
    workflowCache.set(cacheKey, { at: now, runs })
    return [id, runs]
  }))
  return Object.fromEntries(results)
}

async function requestWorkflowRuns(workflow, { fetchImpl, token }) {
  const url = `https://api.github.com/repos/${workflow.repo}/actions/workflows/${workflow.file}/runs?per_page=100`
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'tuaran-ops-console',
  }
  if (token) headers.authorization = `Bearer ${token}`
  try {
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(5000) })
    if (!response.ok) return []
    return runsFromGitHubPayload(await response.json())
  } catch {
    return []
  }
}

export function clearAutomationRunStatsCache() {
  workflowCache.clear()
}
