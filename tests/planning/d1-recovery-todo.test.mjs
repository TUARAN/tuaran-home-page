import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = new URL('../../migrations/0102_d1_quota_recovery_todo.sql', import.meta.url)
const boardPath = new URL('../../app/(admin)/admin/planning/PlanningTodoBoard.jsx', import.meta.url)

test('D1 quota recovery is seeded as an idempotent dated checklist', async () => {
  const sql = await readFile(migrationPath, 'utf8')

  assert.match(sql, /milestone:d1-quota-recovery-2026-10-01/)
  assert.equal((sql.match(/INSERT OR IGNORE INTO planning_tasks/g) || []).length, 5)
  assert.match(sql, /08:00｜确认 D1 已恢复写入/)
  assert.match(sql, /08:05｜应用 X 回复任务迁移 0103/)
  assert.match(sql, /0103_x_reply_tasks\.sql/)
  assert.match(sql, /x_reply_tasks 表可用/)
  assert.match(sql, /08:10｜观察 X 自动发布自行恢复/)
  assert.match(sql, /08:17｜观察舆情采集自行恢复/)
  assert.match(sql, /09:00｜检查首小时 D1 写入增量/)
  assert.doesNotMatch(sql, /12:00｜完成半日恢复复查/)
  assert.match(sql, /不要重跑 0100_fixed_ranbi_supply\.sql/)
  assert.match(sql, /历史失败任务不会自动重放/)
})

test('planning todo board explains automatic recovery and links to checks', async () => {
  const source = await readFile(boardPath, 'utf8')

  assert.match(source, /Cloudflare Pages、D1 和 GitHub Actions 都无需手动重启/)
  assert.match(source, /历史失败运行不会自动补跑/)
  assert.match(source, /D1_RECOVERY_NOTICE_FROM/)
  assert.match(source, /forceVisible={!d1RecoveryMilestone && showD1RecoveryFallback}/)
  assert.match(source, /08:00 确认 D1 恢复写入/)
  assert.match(source, /08:05 应用 X 回复任务迁移 0103/)
  assert.match(source, /09:00 检查首小时写入量/)
  assert.doesNotMatch(source, /12:00 完成半日复查/)
  assert.match(source, /href="\/admin\/site-health"/)
  assert.match(source, /href="\/admin\/ops"/)
  assert.match(source, /\['completed', 'cancelled', 'archived'\]\.includes\(milestone\.status\)/)
})
