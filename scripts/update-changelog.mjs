import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { CHANGELOG } from '../lib/changelogData.js'
import { getChangelogPeriodSummary } from '../lib/changelogPeriodSummaries.js'
import {
  buildChangelogPrompt,
  CHANGELOG_MODEL_FALLBACK_CODES,
  entryDateRange,
  groupCommitsByIsoWeek,
  periodKeys,
  prependChangelogEntry,
  replaceLatestChangelogEntry,
  upsertPeriodSummary,
  validateGeneratedSummary,
} from '../lib/changelogAutomationCore.mjs'
import { callScanDeepSeekJson, FLASH_MODEL, PRO_MODEL } from './scan-deepseek.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHANGELOG_PATH = path.join(ROOT, 'lib/changelogData.js')
const PERIOD_SUMMARIES_PATH = path.join(ROOT, 'lib/changelogPeriodSummaries.js')
const BOT_COMMIT = /^chore\(changelog\):/i

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function readCommits(marker) {
  if (!/^[0-9a-f]{40}$/i.test(String(marker || ''))) {
    throw new Error('最新更新日志缺少有效 lastCommit，无法安全判断增量提交')
  }
  git('cat-file', '-e', `${marker}^{commit}`)
  const output = git(
    'log', '--reverse', '--no-merges',
    '--date=short', '--format=%H%x1f%ad%x1f%s%x1e',
    `${marker}..HEAD`,
  )
  return output
    .split('\x1e')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [sha, date, ...subjectParts] = row.split('\x1f')
      return { sha, date, subject: subjectParts.join('\x1f').trim().slice(0, 300) }
    })
    .filter((commit) => commit.sha && commit.date && commit.subject && !BOT_COMMIT.test(commit.subject))
}

function existingPeriod(view, key, overrides) {
  if (overrides[`${view}:${key}`]) return overrides[`${view}:${key}`]
  return getChangelogPeriodSummary({ key, entries: [] }, view)
}

async function generateWeekSummary(messages) {
  const attempts = [
    { model: PRO_MODEL, maxTokens: 8192, timeoutMs: 180000 },
    { model: FLASH_MODEL, maxTokens: 12000, timeoutMs: 120000 },
  ]
  let lastError = null
  for (const [index, attempt] of attempts.entries()) {
    try {
      return await callScanDeepSeekJson({
        messages,
        model: attempt.model,
        type: 'changelog',
        temperature: 0.2,
        maxTokens: attempt.maxTokens,
        timeoutMs: attempt.timeoutMs,
      })
    } catch (error) {
      lastError = error
      const canFallback = CHANGELOG_MODEL_FALLBACK_CODES.has(error?.code) && index < attempts.length - 1
      if (!canFallback) throw error
      console.warn(`[changelog] ${attempt.model} 失败（${error.code}），改用 ${attempts[index + 1].model}`)
    }
  }
  throw lastError
}

async function main() {
  let changelogSource = fs.readFileSync(CHANGELOG_PATH, 'utf8')
  let periodSource = fs.readFileSync(PERIOD_SUMMARIES_PATH, 'utf8')
  let latestEntry = { ...CHANGELOG[0] }
  const commits = readCommits(latestEntry.lastCommit)
  if (!commits.length) {
    console.log('没有需要写入更新日志的新提交。')
    return
  }

  const periodOverrides = {}
  for (const group of groupCommitsByIsoWeek(commits)) {
    const sameWeek = latestEntry.week === group.week
    const currentEntry = sameWeek ? latestEntry : null
    const firstDate = currentEntry ? entryDateRange(currentEntry)[0] : group.commits[0].date
    const lastDate = group.commits.at(-1).date
    const keys = periodKeys(firstDate)
    const existingPeriods = Object.fromEntries(
      Object.entries(keys).map(([view, key]) => [view, existingPeriod(view, key, periodOverrides)]),
    )
    const result = await generateWeekSummary(
      buildChangelogPrompt({ group, currentEntry, keys, existingPeriods }),
    )
    const generated = validateGeneratedSummary(result.json)
    const dates = currentEntry ? [...entryDateRange(currentEntry), lastDate] : [firstDate, lastDate]
    const range = dates[0] === dates.at(-1) ? dates[0] : `${dates[0]} 至 ${dates.at(-1)}`
    const entry = {
      version: group.week,
      week: group.week,
      range,
      commits: (currentEntry?.commits || 0) + group.commits.length,
      lastCommit: group.commits.at(-1).sha,
      ...generated.entry,
    }
    changelogSource = sameWeek
      ? replaceLatestChangelogEntry(changelogSource, entry)
      : prependChangelogEntry(changelogSource, entry)
    latestEntry = entry

    for (const [view, key] of Object.entries(keys)) {
      const constantName = `${view.toUpperCase()}_SUMMARIES`
      const summary = generated.periods[view]
      periodOverrides[`${view}:${key}`] = summary
      periodSource = upsertPeriodSummary(periodSource, constantName, key, summary)
    }
    console.log(`${group.week}: ${group.commits.length} 条提交，DeepSeek ${result.model}`)
  }

  fs.writeFileSync(CHANGELOG_PATH, changelogSource)
  fs.writeFileSync(PERIOD_SUMMARIES_PATH, periodSource)
  console.log(`更新完成：${commits.length} 条提交，游标 ${latestEntry.lastCommit}`)
}

await main()
