import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WORKBENCH_MENU_GROUPS, WORKBENCH_MENU_ITEMS } from '../../app/(x)/x-workbench/tabs.js'

test('X大互动顶部按今天和读本展示，公开菜单没有站长工具', () => {
  assert.deepEqual(WORKBENCH_MENU_GROUPS.map((group) => [group.label, group.items.map((item) => item.label)]), [
    ['今天', ['流量', '大互动智能体']],
    ['读本', ['大互动理论', '智能体手册']],
  ])
  const labels = WORKBENCH_MENU_ITEMS.map((item) => item.label)
  for (const removed of ['AI 改写', '排期', '海报', '推文榜', '账号榜', '绿皮书', '黄皮书', 'AI分发大师']) {
    assert.equal(labels.includes(removed), false)
  }
  assert.deepEqual(WORKBENCH_MENU_ITEMS.filter((item) => item.href).map((item) => [item.label, item.href, Boolean(item.external)]), [
    ['流量', '/x-workbench#market', false],
    ['大互动智能体', '/x-workbench#agents', false],
    ['大互动理论', '/theory', false],
    ['智能体手册', '/docs', false],
  ])
  assert.equal(WORKBENCH_MENU_GROUPS.some((group) => ['工作', '实践', '理论'].includes(group.label)), false)
})

test('公开首页是流量和智能体，配对和排期留在登录后的二级页', async () => {
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
  assert.doesNotMatch(client, /id="basis"/)
  assert.match(client, /今天流量去哪了/)
  assert.match(client, /使用了智能体插件的账号/)
  assert.match(client, /TWEET_BOARD_NOTE/)
  assert.match(client, /ACCOUNT_HOME_NOTE/)
  assert.match(client, /往日记录/)
  assert.match(client, /未采集/)
  assert.doesNotMatch(client, /绿皮书|黄皮书|理论基础/)
  assert.match(client, /operator=\{false\}/)
  assert.doesNotMatch(client, /import RewriteTab|import AgentTab|import ScheduleTab|import PosterTab|生成配对码/)
  assert.match(operator, /登录后继续/)
  assert.match(operator, /AgentTab/)
  assert.match(operator, /signedIn &&/)
  assert.doesNotMatch(whitepaper, /查看智能体与获取方式|走进圆桌会场|打开日历/)
  assert.match(whitepaper, /href="\/roundtable"/)
  assert.match(whitepaper, /智能体手册「频率与设置」/)
  assert.match(whitepaper, /href="https:\/\/x\.2aran\.com\/docs#daily-volume"/)
  assert.match(yellowbook, /https:\/\/x\.2aran\.com\/docs/)
  assert.match(yellowbook, /XSiteFrame active="\/docs"/)
  assert.match(roundtable, /大互动圆桌/)
  assert.doesNotMatch(roundtable, /圆桌大会/)
  assert.match(header, /href: 'https:\/\/x\.2aran\.com\/', label: 'X大互动'/)
  assert.doesNotMatch(client, /推文榜、账号榜和智能体需要登录/)
  assert.match(shortRoute, /code === 'x'/)
  assert.match(shortRoute, /https:\/\/x\.2aran\.com\/theory/)
  assert.match(whitepaper, /const title = '互动理论'/)
  assert.match(calendar, /const title = '大互动日历'/)
  assert.match(calendar, /href="\/x-workbench#market"/)
  assert.match(calendar, /export const runtime = 'edge'/)
  assert.match(yellowbook, /const title = '智能体手册'/)
  assert.match(roundtable, /← 互动理论/)
})
