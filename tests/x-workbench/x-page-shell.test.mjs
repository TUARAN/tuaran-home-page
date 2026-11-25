import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { xPageNeighbors } from '../../app/(x)/x-workbench/tabs.js'

const page = (rel) => readFile(new URL(`../../app/${rel}`, import.meta.url), 'utf8')

test('上一页 / 下一页按顶栏顺序串起六个入口', () => {
  assert.equal(xPageNeighbors('/x-workbench').group.label, '产品')
  assert.equal(xPageNeighbors('/x-workbench').next.href, '/docs')
  assert.equal(xPageNeighbors('/docs').group.label, '产品')
  assert.equal(xPageNeighbors('/docs').next.href, '/theory')
  assert.equal(xPageNeighbors('/theory').group.label, '读本')
  assert.equal(xPageNeighbors('/theory').prev.href, '/docs')
  assert.equal(xPageNeighbors('/calendar').next.href, '/roundtable')
  assert.equal(xPageNeighbors('/grokbot').next, null)
  assert.deepEqual(xPageNeighbors('/nope'), { group: null, prev: null, next: null })
})

test('六个入口页都用共用外壳，顶栏高亮指向自己，标题统一后缀', async () => {
  const pages = [
    ['(x)/x-workbench/WorkbenchClient.jsx', '/x-workbench', null],
    ['(site)/resources/x-reply-clipboard-extension/docs/page.jsx', '/docs', 'title'],
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

test('插件页用共用外壳，标题统一后缀', async () => {
  const source = await page('(site)/resources/x-reply-clipboard-extension/page.jsx')
  assert.match(source, /<XPage[\s\S]*?active="\/extension"/)
  assert.match(source, /intro=/)
  assert.doesNotMatch(source, /<XSiteFrame|<PageContainer|font-mono text-\[10px\]/)
  assert.match(source, /title: \{ absolute: 'X 大互动智能体插件｜X大互动' \}/)
})

test('后台入口收进账号菜单并标为开发中', async () => {
  const frame = await page('(x)/x-workbench/XSiteFrame.jsx')
  // 账号动作不再并排堆在顶栏：头像按钮 + role="menu" 弹层收纳账号、后台、退出
  assert.match(frame, /className=\{s\.avatarBtn\}[^>]*aria-haspopup="menu"/)
  assert.match(frame, /role="menu"/)
  assert.match(frame, /href="\/x-workbench\/ops"[^>]*>站长后台<span className=\{s\.beta\}>开发中<\/span>/)
  assert.match(frame, /href=\{logoutHref\}>退出登录</)
  assert.doesNotMatch(frame, /className=\{s\.accountBar\}|className=\{s\.cta\}/)
})
