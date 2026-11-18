import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { loadGrokbotExecutions } from '../../lib/interaction/grokbotExecutions/load.js'
import {
  GROKBOT_EXECUTION_ACTOR,
  GROKBOT_EXECUTION_TITLE,
  HANZI_DETECTION_COPY,
  batchesOnDate,
  derivedSeriesStatus,
  executionDates,
  hasPrivateOrForbiddenPayload,
  resultStatusLabel,
  seriesStatusLabel,
  validateGrokbotExecutions,
  verificationStatusLabel,
} from '../../lib/interaction/grokbotExecutions/model.js'

const CALENDAR_DIR = new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/', import.meta.url)

async function readCalendar(name) {
  return readFile(new URL(name, CALENDAR_DIR), 'utf8')
}

test('shipped records are a public Grokbot ledger cut off at the verified audit', () => {
  const records = loadGrokbotExecutions()
  assert.equal(records.actor, GROKBOT_EXECUTION_ACTOR)
  assert.equal(records.timezone, 'Asia/Shanghai')
  assert.equal(records.asOfAsiaShanghai, '2026-11-18 08:22:41 Asia/Shanghai')
  assert.equal(records.ownerAccount.username, 'tarsixseveneig1')
  assert.equal(records.ownerAccount.id, '1059979808292069376')
  assert.match(records.hanziDetection, /CJK 表意文字/)
  assert.match(records.hanziDetection, /不能用它判定地区/)
  assert.match(records.method, /先拉黑再立即解除拉黑/)
  assert.equal(hasPrivateOrForbiddenPayload(records), false)
  assert.doesNotMatch(JSON.stringify(records), /Grokbox|\/workspace|x-unfollow-audit|pendingAccounts|pendingHandles|DAILY_TOP_INGEST/)

  const [yearInactive, noHanzi] = records.series
  assert.equal(yearInactive.actor, 'Grokbot')
  assert.equal(yearInactive.status, 'completed')
  assert.equal(yearInactive.counts.succeeded, 84)
  assert.equal(yearInactive.counts.failed, 0)
  assert.equal(yearInactive.counts.pending, 0)
  assert.equal(yearInactive.batches.reduce((sum, batch) => sum + batch.accounts.length, 0), 84)
  assert.equal(yearInactive.verification.status, 'verified')
  assert.equal(yearInactive.followingCountReconciliation.formula, '9112 - 84 - 3 + 65 = 9090')
  assert.equal(derivedSeriesStatus(yearInactive), 'completed')
  assert.equal(seriesStatusLabel(yearInactive), '已完成')

  assert.equal(noHanzi.actor, 'Grokbot')
  assert.equal(noHanzi.status, 'in_progress')
  assert.equal(noHanzi.queue.startSize, 264)
  assert.equal(noHanzi.queue.pending, 254)
  assert.equal(noHanzi.queue.done, 10)
  assert.equal(noHanzi.queue.snapshotCandidates, 268)
  assert.equal(noHanzi.queue.excluded, 4)
  assert.equal(noHanzi.counts.pending, 254)
  assert.equal(noHanzi.batches.length, 1)
  assert.equal(noHanzi.batches[0].accounts.length, 10)
  assert.equal(noHanzi.batches[0].verificationStatus, 'verified')
  assert.equal(derivedSeriesStatus(noHanzi), 'in_progress')
  assert.equal(seriesStatusLabel(noHanzi), '进行中')
  assert.ok(!JSON.stringify(noHanzi.queue).includes('@'))
  assert.equal(Object.hasOwn(noHanzi.queue, 'accounts'), false)

  assert.deepEqual(executionDates(records), ['2026-11-17', '2026-11-18'])
  assert.equal(batchesOnDate(records, '2026-11-17').length, 1)
  assert.ok(batchesOnDate(records, '2026-11-18').length >= 2)
  assert.deepEqual(batchesOnDate(records, '2026-11-16'), [])
  assert.ok(records.series.every((series) => series.batches.every((batch) => batch.accounts.every((account) => (
    account.profileUrl === `https://x.com/${account.username}`
    && account.resultStatus === 'success'
    && account.verificationStatus === 'verified'
  )))))
})

test('pending work cannot be labeled completed, and result states stay distinct', () => {
  const records = loadGrokbotExecutions()
  const inProgress = records.series.find((series) => series.id === 'no-cjk-name-bio-no-followback')
  assert.equal(seriesStatusLabel(inProgress), '进行中')
  assert.throws(
    () => validateGrokbotExecutions({
      ...records,
      series: records.series.map((series) => (
        series.id === inProgress.id ? { ...series, status: 'completed' } : series
      )),
    }),
    /不得标为已完成/,
  )
  assert.equal(resultStatusLabel('success'), '成功')
  assert.equal(resultStatusLabel('failure'), '失败')
  assert.equal(resultStatusLabel('skipped'), '跳过')
  assert.equal(verificationStatusLabel('verified'), '已核验')
  assert.equal(verificationStatusLabel('pending'), '待核验')

  const mixed = {
    ...inProgress.batches[0],
    accounts: [
      { ...inProgress.batches[0].accounts[0], resultStatus: 'success', verificationStatus: 'verified' },
      { ...inProgress.batches[0].accounts[1], username: 'skip_user', profileUrl: 'https://x.com/skip_user', resultStatus: 'skipped', verificationStatus: 'pending' },
      { ...inProgress.batches[0].accounts[2], username: 'fail_user', profileUrl: 'https://x.com/fail_user', resultStatus: 'failure', verificationStatus: 'pending' },
    ],
  }
  mixed.accounts.forEach((account) => {
    assert.equal(['success', 'failure', 'skipped'].includes(account.resultStatus), true)
    assert.equal(['verified', 'pending'].includes(account.verificationStatus), true)
  })
  assert.notEqual(mixed.accounts[0].resultStatus, mixed.accounts[1].resultStatus)
  assert.notEqual(mixed.accounts[0].verificationStatus, mixed.accounts[2].verificationStatus)
})

test('validator rejects Grokbox, private paths, and pending account lists', () => {
  const records = loadGrokbotExecutions()
  assert.throws(
    () => validateGrokbotExecutions({ ...records, actor: 'Grokbox' }),
    /Grokbot|Grokbox/,
  )
  assert.throws(
    () => validateGrokbotExecutions({
      ...records,
      privacyNote: `${records.privacyNote} /workspace/x-unfollow-audit/secret`,
    }),
    /私有路径/,
  )
  assert.throws(
    () => validateGrokbotExecutions({
      ...records,
      series: records.series.map((series) => (
        series.queue ? { ...series, queue: { ...series.queue, accounts: ['hidden'] } } : series
      )),
    }),
    /待执行不得附账号名单/,
  )
})

test('calendar page keeps daily-top intact and renders a separate Grokbot section', async () => {
  const [page, view, ledger, css] = await Promise.all([
    readCalendar('page.jsx'),
    readCalendar('InteractionCalendar.jsx'),
    readCalendar('GrokbotExecutionRecords.jsx'),
    readCalendar('calendar.module.css'),
  ])
  const sources = [page, view, ledger, css].join('\n')
  assert.match(page, /loadCombinedDailyTopDays/)
  assert.match(page, /loadOwnActivityDays/)
  assert.match(page, /loadGrokbotExecutions/)
  assert.doesNotMatch(page, /dailyTop\/load/)
  assert.doesNotMatch(page, /\/api\/interaction\/daily-top/)
  assert.match(page, /Grokbot 批次取关执行记录/)
  assert.match(view, /互动前十/)
  assert.match(view, /本账号互动/)
  assert.match(view, /GrokbotExecutionRecords/)
  assert.match(view, /executionByDate/)
  assert.match(ledger, new RegExp(GROKBOT_EXECUTION_TITLE))
  assert.match(ledger, /执行者 Grokbot/)
  assert.match(ledger, /CJK 表意文字|hanziDetection|HANZI_DETECTION_COPY/)
  assert.match(ledger, /成功/)
  assert.match(ledger, /失败/)
  assert.match(ledger, /跳过/)
  assert.match(ledger, /已核验/)
  assert.match(ledger, /待核验/)
  assert.match(ledger, /进行中/)
  assert.match(css, /\.executions/)
  assert.match(css, /#1d6840/)
  assert.match(css, /#c6dac7/)
  assert.match(css, /max-height: 320px/)
  assert.doesNotMatch(sources, /Grokbox/)
  assert.doesNotMatch(ledger, /非简体中文区|非中国账号/)
  assert.equal(HANZI_DETECTION_COPY.includes('不能用它判定地区、国籍'), true)
})
