import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WORKBENCH_MENU_GROUPS, WORKBENCH_MENU_ITEMS } from '../../app/(x)/x-workbench/tabs.js'

test('X大互动顶部按组显示，不再单列 AI 改写、排期和海报', () => {
  assert.deepEqual(WORKBENCH_MENU_GROUPS.map((group) => [group.label, group.items.map((item) => item.label)]), [
    ['正在发生', ['推文榜', '账号榜', '智能体', '黄皮书']],
    ['大互动运营', ['大互动理论', '大互动日历', '大互动圆桌']],
    ['分发', ['AI分发大师']],
  ])
  const labels = WORKBENCH_MENU_ITEMS.map((item) => item.label)
  for (const removed of ['AI 改写', '排期', '海报']) {
    assert.equal(labels.includes(removed), false)
  }
  assert.deepEqual(WORKBENCH_MENU_ITEMS.filter((item) => item.href).map((item) => [item.label, item.href, Boolean(item.external)]), [
    ['黄皮书', '/docs', false],
    ['大互动理论', '/theory', false],
    ['大互动日历', '/calendar', false],
    ['大互动圆桌', '/roundtable', false],
    ['AI分发大师', 'https://syncblog.cn/', true],
  ])
})

test('工作台渲染分组菜单，旧公开地址仍指向原页面', async () => {
  const [client, header, shortRoute, whitepaper, calendar, roundtable, yellowbook] = await Promise.all([
    readFile(new URL('../../app/(x)/x-workbench/WorkbenchClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/[code]/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/roundtable/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(client, /WORKBENCH_MENU_GROUPS/)
  assert.match(client, /group\.label/)
  assert.doesNotMatch(client, /import RewriteTab|tab === 'rewrite'/)
  assert.match(client, /rel: 'noopener noreferrer'/)
  assert.match(client, /item\.beta/)
  assert.doesNotMatch(whitepaper, /查看智能体与获取方式|走进圆桌会场|打开日历/)
  assert.match(whitepaper, /href="https:\/\/x\.2aran\.com\/docs#daily-volume"/)
  assert.match(yellowbook, /https:\/\/x\.2aran\.com\/docs/)
  assert.match(yellowbook, /XSiteFrame active="\/docs"/)
  assert.equal(WORKBENCH_MENU_GROUPS.some((group) => ['工作', '实践', '理论'].includes(group.label)), false)
  assert.equal(WORKBENCH_MENU_ITEMS.some((item) => item.label === '大互动理论'), true)
  assert.match(roundtable, /大互动圆桌/)
  assert.match(header, /href: 'https:\/\/x\.2aran\.com\/', label: 'X大互动'/)
  assert.doesNotMatch(client, /推文榜、账号榜和智能体需要登录/)
  assert.match(shortRoute, /code === 'x'/)
  assert.match(shortRoute, /https:\/\/x\.2aran\.com\/theory/)
  assert.match(whitepaper, /const title = '大互动理论'/)
  assert.match(calendar, /const title = '大互动日历'/)
  assert.match(calendar, /export const runtime = 'edge'/)
  assert.match(roundtable, /大互动圆桌/)
  assert.doesNotMatch(roundtable, /圆桌大会/)
  assert.match(yellowbook, /const title = 'X 大互动智能体黄皮书'/)
})
