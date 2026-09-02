import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getD1AdminSnapshot, getD1TableDetail } from '../lib/dbAdmin.js'

function fakeD1() {
  const calls = []
  return {
    calls,
    prepare(sql) {
      const call = { sql, binds: [] }
      calls.push(call)
      const statement = {
        bind(...binds) {
          call.binds = binds
          return statement
        },
        async all() {
          if (/FROM sqlite_master/.test(sql)) return { results: [{ name: 'article_comments' }, { name: 'user_points' }] }
          if (/PRAGMA table_info/.test(sql)) return { results: [{ name: 'user_id', type: 'TEXT', notnull: 1, pk: 0 }] }
          return { results: [] }
        },
        async first() {
          if (/SELECT name FROM sqlite_master/.test(sql)) return { name: 'article_comments' }
          if (/COUNT\(\*\)/.test(sql)) return { value: 12 }
          if (/MAX\(/.test(sql)) return { value: 123 }
          if (/SUM\(/.test(sql)) return { value: 456 }
          return null
        },
      }
      return statement
    },
  }
}

test('数据库管理首屏只读取 sqlite_master，不扫描任何业务表', async () => {
  const db = fakeD1()
  const snapshot = await getD1AdminSnapshot(db)
  assert.equal(snapshot.tableCount, 2)
  assert.equal(db.calls.length, 1)
  assert.match(db.calls[0].sql, /FROM sqlite_master/)
  assert.doesNotMatch(db.calls[0].sql, /COUNT\(\*\)|MAX\(|SUM\(|PRAGMA/)
})

test('只有点开单表后才执行该表体检', async () => {
  const db = fakeD1()
  const detail = await getD1TableDetail(db, 'article_comments')
  assert.equal(detail.name, 'article_comments')
  assert.ok(db.calls.some((call) => /PRAGMA table_info\("article_comments"\)/.test(call.sql)))
  assert.ok(db.calls.some((call) => /COUNT\(\*\).*"article_comments"/.test(call.sql)))
  assert.ok(db.calls.every((call) => !/FROM "user_points"/.test(call.sql)))
})

test('数据库管理页提供诗词独立 D1 的安全迁移运行手册', async () => {
  const source = await readFile(new URL('../app/(admin)/admin/db/DbConsole.jsx', import.meta.url), 'utf8')
  assert.match(source, /独立 D1：china-poetry/)
  assert.match(source, /本页上方连接状态和下方表目录属于主站 D1，不包含诗词库/)
  assert.match(source, /零写入预检/)
  assert.match(source, /--confirm-version <manifest[.]version>/)
  assert.match(source, /新 D1 离线构建与切换/)
  assert.match(source, /EXPLAIN 出现意外全表扫描/)
  assert.match(source, /旧 D1 和旧 R2 release 暂不删除/)
})
