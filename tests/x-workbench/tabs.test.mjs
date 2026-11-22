import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WORKBENCH_PAGE_TABS, WORKBENCH_TOOL_TABS } from '../../app/(x)/x-workbench/tabs.js'

test('X大互动顶部去掉排期和海报，并链到现有页面', () => {
  assert.deepEqual(WORKBENCH_TOOL_TABS.map((tab) => tab.label), ['推文榜', '账号榜', 'AI 改写', '智能体'])
  assert.equal(WORKBENCH_TOOL_TABS.some((tab) => tab.id === 'poster' || tab.id === 'schedule'), false)
  assert.deepEqual(WORKBENCH_PAGE_TABS.map((tab) => [tab.label, tab.href]), [
    ['大互动理论', '/resources/big-interaction-whitepaper'],
    ['黄皮书', '/resources/x-reply-clipboard-extension/docs'],
    ['AI分发大师', 'https://syncblog.cn/'],
    ['大互动日历', '/resources/big-interaction-whitepaper/calendar'],
    ['圆桌大会', '/resources/big-interaction-whitepaper/roundtable'],
  ])
})

test('工作台渲染这些标签，旧公开地址仍指向原页面', async () => {
  const [client, header, shortRoute, whitepaper, calendar, roundtable, yellowbook] = await Promise.all([
    readFile(new URL('../../app/(x)/x-workbench/WorkbenchClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/[code]/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/roundtable/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(client, /WORKBENCH_TOOL_TABS/)
  assert.match(client, /WORKBENCH_PAGE_TABS/)
  assert.doesNotMatch(client, /\['poster', '海报'\]|\['schedule', '排期'\]/)
  assert.match(header, /href: '\/x-workbench', label: 'X大互动'/)
  assert.match(shortRoute, /code === 'x'/)
  assert.match(shortRoute, /\/resources\/big-interaction-whitepaper/)
  assert.match(whitepaper, /const title = '大互动理论'/)
  assert.match(calendar, /const title = '大互动日历'/)
  assert.match(calendar, /export const runtime = 'edge'/)
  assert.match(roundtable, /圆桌大会/)
  assert.match(yellowbook, /const title = 'X 大互动智能体黄皮书'/)
})
