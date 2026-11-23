import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WORKBENCH_MENU_GROUPS, WORKBENCH_MENU_ITEMS } from '../../app/(x)/x-workbench/tabs.js'

test('X大互动顶部按观察、资料、分发展示，公开菜单没有站长工具', () => {
  assert.deepEqual(WORKBENCH_MENU_GROUPS.map((group) => [group.label, group.items.map((item) => item.label)]), [
    ['观察', ['市场流量', '智能体表现', '理论基础']],
    ['资料', ['绿皮书', '黄皮书', '大互动日历', '大互动圆桌']],
    ['分发', ['AI分发大师']],
  ])
  const labels = WORKBENCH_MENU_ITEMS.map((item) => item.label)
  for (const removed of ['AI 改写', '排期', '海报', '智能体', '推文榜', '账号榜']) {
    assert.equal(labels.includes(removed), false)
  }
  assert.deepEqual(WORKBENCH_MENU_ITEMS.filter((item) => item.href).map((item) => [item.label, item.href, Boolean(item.external)]), [
    ['市场流量', '/x-workbench#market', false],
    ['智能体表现', '/x-workbench#agents', false],
    ['理论基础', '/x-workbench#basis', false],
    ['绿皮书', '/theory', false],
    ['黄皮书', '/docs', false],
    ['大互动日历', '/calendar', false],
    ['大互动圆桌', '/roundtable', false],
    ['AI分发大师', 'https://syncblog.cn/', true],
  ])
  assert.equal(WORKBENCH_MENU_GROUPS.some((group) => ['工作', '实践', '理论'].includes(group.label)), false)
})

test('公开首页是三栏观察，配对和排期留在登录后的二级页', async () => {
  const [client, operator, frame, header, shortRoute, whitepaper, calendar, roundtable, yellowbook] = await Promise.all([
    readFile(new URL('../../app/(x)/x-workbench/WorkbenchClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(x)/x-workbench/OperatorClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(x)/x-workbench/XSiteFrame.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/[code]/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/roundtable/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(frame, /观察、跟进、智能/)
  assert.doesNotMatch(`${client}\n${frame}`, /爆点、改写、发布/)
  assert.match(frame, /WORKBENCH_MENU_GROUPS/)
  assert.match(frame, /group\.label/)
  assert.match(frame, /item\.beta/)
  assert.match(frame, /noopener noreferrer/)
  assert.match(client, /id="market"/)
  assert.match(client, /id="agents"/)
  assert.match(client, /id="basis"/)
  assert.match(client, /今天流量去哪了/)
  assert.match(client, /推文观察/)
  assert.match(client, /账号观察/)
  assert.match(client, /未采集/)
  assert.match(client, /https:\/\/2aran\.com\/resources\/big-interaction-whitepaper/)
  assert.match(client, /roundtable/)
  assert.match(client, /operator=\{false\}/)
  assert.doesNotMatch(client, /import RewriteTab|import AgentTab|import ScheduleTab|import PosterTab|生成配对码/)
  assert.match(operator, /登录后继续/)
  assert.match(operator, /AgentTab/)
  assert.match(operator, /signedIn &&/)
  assert.doesNotMatch(whitepaper, /查看智能体与获取方式|走进圆桌会场|打开日历/)
  assert.match(whitepaper, /href="https:\/\/x\.2aran\.com\/docs#daily-volume"/)
  assert.match(yellowbook, /https:\/\/x\.2aran\.com\/docs/)
  assert.match(yellowbook, /XSiteFrame active="\/docs"/)
  assert.match(roundtable, /大互动圆桌/)
  assert.doesNotMatch(roundtable, /圆桌大会/)
  assert.match(header, /href: 'https:\/\/x\.2aran\.com\/', label: 'X大互动'/)
  assert.doesNotMatch(client, /推文榜、账号榜和智能体需要登录/)
  assert.match(shortRoute, /code === 'x'/)
  assert.match(shortRoute, /https:\/\/x\.2aran\.com\/theory/)
  assert.match(whitepaper, /const title = '大互动理论'/)
  assert.match(calendar, /const title = '大互动日历'/)
  assert.match(calendar, /export const runtime = 'edge'/)
  assert.match(yellowbook, /const title = 'X 大互动智能体黄皮书'/)
})
