import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const helpPage = await readFile(new URL('../../app/(site)/help/page.jsx', import.meta.url), 'utf8')

test('public help page excludes internal design and engineering documentation', () => {
  for (const internalTopic of [
    '界面与设计',
    '这个站点配色与样式的取舍',
    '加载与等待反馈',
    '后台与自动化的统一规矩',
  ]) {
    assert.doesNotMatch(helpPage, new RegExp(internalTopic))
  }

  assert.doesNotMatch(helpPage, /ENGINEERING_CONVENTIONS|DESIGN_PRINCIPLES|LoadingPrimitives/)
})

test('help page keeps the topic scroller inside the site content width', () => {
  assert.match(helpPage, /grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-\[240px_minmax\(0,1fr\)\]/)
  assert.match(helpPage, /<aside className="min-w-0/)
  assert.match(helpPage, /flex w-full min-w-0 gap-3 overflow-x-auto/)
})
