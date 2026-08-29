import assert from 'node:assert/strict'
import test from 'node:test'
import { buildLoanAnalysisBrief, extractLoanSnapshots, parseLoanNumber } from '../lib/longCompass/loans.js'
import { appendRecords, normalizeSource, pendingSources } from '../scripts/append-long-compass.mjs'
import { decryptPayload, encryptPayload } from '../lib/longCompass/crypto.js'
import { resolvePrivateRecordOwner } from '../scripts/private-record-owner.mjs'

// Synthetic fixtures only: never place the owner's balances in public source.
function fixture(date = '2026-01-05') {
  return { id: date, kind: 'snapshot', plain: {
    title: '示例贷款快照', summary: '测试数据', authoredBy: 'TEST', updatedAt: 1, theme: ['财务'], schemaVersion: 2,
    content: `| 快照日期 | 原图加权年化 | 原图预计月供(元) |
| --- | --- | --- |
| ${date} | 9% | 100.25 |

| 机构/产品 | 原始本金(元) | 待还本金(元) | 年化估算 | 状态 | 还款方式 | 剩余期数 |
| --- | --- | --- | --- | --- | --- | --- |
| 示例高息已结清 | 1000.00 | 0.00 | ≈18% | 已结清 | 分期 | 0 |
| 示例甲 | 1000.00 | 800.25 | ≈8% | 在还 | 按期还本付息 | 5 |
| 示例乙 | 2000.00 | 1200.75 | 4% | 在还 | 先息后本 | 未提供 |
| 合计 | 4000.00 | 2001.00 | — | — | — | — |

| 计划月份 | 原图计划金额(元) | 原图项目 |
| --- | --- | --- |
| 2026-02 | 99.25 | 待核实账单 |`,
  } }
}

test('loan parser preserves cents, rejects narrative/partial numbers, and does not turn missing data into zero', () => {
  assert.equal(parseLoanNumber('¥1,234.56'), 123456)
  assert.equal(parseLoanNumber('≈5.91%', true), 5.91)
  for (const invalid of ['未提供', '', '—', '约3万元', '-5', '200.001', '100元待核实', '2026-01-01']) assert.equal(parseLoanNumber(invalid), null)
})

test('snapshot totals exclude aggregates and weighted rates exclude settled loans', () => {
  const [snapshot] = extractLoanSnapshots([fixture()])
  assert.equal(snapshot.originalCents, 400000)
  assert.equal(snapshot.remainingCents, 200100)
  assert.equal(snapshot.repaidCents, 199900)
  assert.equal(snapshot.activeCount, 2)
  assert.equal(snapshot.settledCount, 1)
  assert.ok(Math.abs(snapshot.weightedRate - (80025 * 8 + 120075 * 4) / 200100) < 1e-10)
  assert.equal(snapshot.reportedRate, 9)
  assert.equal(snapshot.monthlyCents, 10025)
  assert.equal(snapshot.schedules[0].amountCents, 9925)
  assert.match(snapshot.warnings.join(' '), /不一致/)
})

test('historical snapshots are sorted by snapshot date, not combined or ordered by import time', () => {
  const records = [fixture(), fixture('2026-02-01')]
  records[0].updatedAt = Date.now()
  const snapshots = extractLoanSnapshots(records)
  assert.equal(snapshots[0].date, '2026-02-01')
  assert.equal(snapshots[0].remainingCents, 200100)
  assert.equal(snapshots.length, 2)
  assert.deepEqual(extractLoanSnapshots([fixture('2026-02-30'), { ...fixture(), kind: 'review' }]), [])
  assert.deepEqual(extractLoanSnapshots(null), [])
})

test('invalid balances suppress totals; missing active rates suppress weighted rate', () => {
  const record = fixture()
  record.plain.content = record.plain.content.replace('800.25', '未提供')
  const [snapshot] = extractLoanSnapshots([record])
  assert.equal(snapshot.remainingCents, null)
  assert.equal(snapshot.repaidCents, null)
  assert.equal(snapshot.weightedRate, null)
  assert.ok(snapshot.warnings.length)
  const noRate = fixture()
  noRate.plain.content = noRate.plain.content.replace('≈8%', '未提供')
  assert.equal(extractLoanSnapshots([noRate])[0].weightedRate, null)
})

test('all settled snapshots have zero outstanding principal, not a fabricated weighted rate', () => {
  const record = fixture()
  record.plain.content = record.plain.content.replace('800.25', '0.00').replace('1200.75', '0.00').replaceAll('在还', '已结清')
  const [snapshot] = extractLoanSnapshots([record])
  assert.equal(snapshot.remainingCents, 0)
  assert.equal(snapshot.activeCount, 0)
  assert.equal(snapshot.weightedRate, null)
})

test('analysis brief hides lender names by default and marks missing cashflow and unverified figures', () => {
  const [snapshot] = extractLoanSnapshots([fixture()])
  const brief = buildLoanAnalysisBrief(snapshot)
  assert.doesNotMatch(brief, /示例甲|示例乙|示例高息/)
  assert.match(brief, /借款 1/)
  assert.match(brief, /未核实/)
  assert.match(brief, /必要支出/)
  assert.match(brief, /不要调用交易/)
  assert.match(buildLoanAnalysisBrief(snapshot, { anonymize: false }), /示例甲/)
})

test('append normalization preserves historical time; duplicate or conflicting snapshots never overwrite', () => {
  const source = normalizeSource({ kind: 'snapshot', ...fixture().plain })
  assert.equal(source.plain.updatedAt, 1)
  assert.deepEqual(pendingSources([source, source], [source]), [])
  assert.throws(() => pendingSources([{ ...source, plain: { ...source.plain, content: 'changed' } }], [source]), /拒绝覆盖/)
  assert.throws(() => normalizeSource({ kind: 'snapshot', title: 'x', content: 'y', updatedAt: 0 }), /无效/)
})

test('append encrypts, verifies readback, and safely retries without writing twice', async () => {
  const password = 'synthetic-test-password'
  const ownerId = resolvePrivateRecordOwner([{ owner_id: 'acct_synthetic' }])
  const initial = fixture().plain
  const rows = [{ id: 1, record_kind: 'snapshot', encrypted_payload: JSON.stringify(await encryptPayload(initial, password)) }]
  const source = normalizeSource({ ...fixture('2026-02-01').plain, kind: 'snapshot', updatedAt: 2 })
  let writes = 0
  const io = {
    read: () => rows,
    write: (sql) => {
      writes += 1
      assert.doesNotMatch(sql, /示例甲|synthetic-test-password|DELETE|UPDATE/)
      const match = /SELECT 'acct_synthetic', 'snapshot', '([^']+)', 2, 2/.exec(sql)
      assert.ok(match)
      rows.push({ id: 2, record_kind: 'snapshot', encrypted_payload: match[1] })
    },
  }
  assert.equal(await appendRecords([source], password, { ...io, ownerId }), 1)
  assert.equal((await decryptPayload(JSON.parse(rows[1].encrypted_payload), password)).updatedAt, 2)
  assert.equal(await appendRecords([source], password, { ...io, ownerId }), 0)
  assert.equal(writes, 1)
  await assert.rejects(appendRecords([source], 'wrong-password', { ...io, ownerId }), /未写入/)
  assert.equal(writes, 1)
  await assert.rejects(appendRecords([source], password, { ownerId, read: () => [rows[0]], write: () => {} }), /回读验证失败/)
})

test('private record owner resolves to the canonical platform account', () => {
  assert.equal(resolvePrivateRecordOwner([{ owner_id: 'acct_123' }]), 'acct_123')
  assert.throws(() => resolvePrivateRecordOwner([]), /拒绝读写/)
  assert.throws(() => resolvePrivateRecordOwner([{ owner_id: 'github:25968749' }]), /拒绝读写/)
})
