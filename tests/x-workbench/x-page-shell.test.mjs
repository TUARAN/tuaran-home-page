import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { xPageNeighbors } from '../../app/(x)/x-workbench/tabs.js'

const page = (rel) => readFile(new URL(`../../app/${rel}`, import.meta.url), 'utf8')

test('上一页 / 下一页按顶栏顺序串起五个入口', () => {
  assert.equal(xPageNeighbors('/x-workbench').group.label, '产品')
  assert.equal(xPageNeighbors('/x-workbench').next.href, '/theory')
  assert.equal(xPageNeighbors('/theory').group.label, '读本')
  assert.equal(xPageNeighbors('/theory').prev.href, '/x-workbench#agents')
  assert.equal(xPageNeighbors('/calendar').next.href, '/roundtable')
  assert.equal(xPageNeighbors('/grokbot').next, null)
  assert.deepEqual(xPageNeighbors('/nope'), { group: null, prev: null, next: null })
})

test('五个入口页都用共用外壳，顶栏高亮指向自己，标题统一后缀', async () => {
  const pages = [
    ['(x)/x-workbench/WorkbenchClient.jsx', '/x-workbench', null],
    ['(site)/resources/big-interaction-whitepaper/page.jsx', '/theory', 'bookTitle'],
    ['(site)/resources/big-interaction-whitepaper/calendar/page.jsx', '/calendar', 'title'],
    ['(site)/resources/big-interaction-whitepaper/roundtable/page.jsx', '/roundtable', 'title'],
    ['(site)/resources/big-interaction-whitepaper/grokbot/page.jsx', '/grokbot', 'title'],
  ]
  for (const [rel, active, titleVar] of pages) {
    const source = await page(rel)
    assert.match(source, new RegExp(`<XPage[\\s\\S]*?active="${active}"`), rel)
    assert.match(source, /intro=/, rel)
    assert.doesNotMatch(source, /<XSiteFrame|<ManualPaper|BookIdentity/, rel)
    if (titleVar) assert.ok(source.includes(`title: { absolute: \`\${${titleVar}}｜X大互动\` }`), rel)
  }
})
