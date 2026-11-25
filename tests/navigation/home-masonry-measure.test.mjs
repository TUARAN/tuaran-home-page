import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../../app/(site)/components/HomeMasonry.jsx', import.meta.url), 'utf8')

test('首页瀑布流同时观察卡片外框，子内容后出现时会重新计算行跨度', () => {
  assert.match(source, /observer\.observe\(item\)\s*\n\s*if \(item\.firstElementChild\) observer\.observe\(item\.firstElementChild\)/)
})

test('首页瀑布流行跨度取内容与外框的较大高度，避免下一张卡片压住上一张', () => {
  assert.match(source, /Math\.max\(content\.getBoundingClientRect\(\)\.height, item\.getBoundingClientRect\(\)\.height\)/)
})
