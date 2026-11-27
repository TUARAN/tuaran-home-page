import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WORKBENCH_MENU_GROUPS, WORKBENCH_MENU_ITEMS } from '../../app/(x)/x-workbench/tabs.js'

test('X大互动导航收束为智能体产品与读本', () => {
  assert.deepEqual(WORKBENCH_MENU_GROUPS.map((group) => [group.label, group.items.map((item) => item.label)]), [
    ['产品', ['大互动智能体', '大互动智能体手册']],
    ['读本', ['大互动理论', '大互动日历', '大互动圆桌', 'Grokbot 秘籍']],
  ])
  const labels = WORKBENCH_MENU_ITEMS.map((item) => item.label)
  for (const removed of ['热榜', 'AI 改写', '排期', '海报', '推文榜', '账号榜', '绿皮书', '黄皮书', 'AI分发大师']) {
    assert.equal(labels.includes(removed), false)
  }
  assert.deepEqual(WORKBENCH_MENU_ITEMS.filter((item) => item.href).map((item) => [item.label, item.href, Boolean(item.external)]), [
    ['大互动智能体', '/x-workbench#agents', false],
    ['大互动智能体手册', '/docs', false],
    ['大互动理论', '/theory', false],
    ['大互动日历', '/calendar', false],
    ['大互动圆桌', '/roundtable', false],
    ['Grokbot 秘籍', '/grokbot', false],
  ])
  assert.equal(WORKBENCH_MENU_GROUPS.some((group) => ['工作', '实践', '理论', '今日看板'].includes(group.label)), false)
})

test('公开首页展示账号池全部智能体，登录后台只留账号与智能体', async () => {
  const [client, operator, agentTab, frame, xLayout, header, shortRoute, whitepaper, calendar, roundtable, yellowbook] = await Promise.all([
    readFile(new URL('../../app/(x)/x-workbench/WorkbenchClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(x)/x-workbench/OperatorClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(x)/x-workbench/AgentTab.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(x)/x-workbench/XSiteFrame.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(x)/x-workbench/layout.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/components/SiteHeader.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/[code]/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/calendar/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/big-interaction-whitepaper/roundtable/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(frame, /帮助一批智能体拿到创作者收益/)
  assert.doesNotMatch(`${client}\n${frame}`, /爆点、改写|搜账号/)
  assert.match(frame, /WORKBENCH_MENU_GROUPS/)
  assert.match(frame, /group\.label/)
  assert.match(frame, /noopener noreferrer/)
  assert.match(xLayout, /SharedSessionProvider/)
  assert.match(frame, /useSharedSession/)
  assert.match(frame, /2aran\.com\/account/)
  assert.match(frame, /api\/auth\/logout/)
  assert.doesNotMatch(frame, /name="q"/)
  assert.match(client, /id="agents"/)
  assert.doesNotMatch(client, /id="hot"/)
  assert.match(client, /插件形态本地运行，本站实时汇总状态与日报，站长可远程监看/)
  assert.match(client, /agentGrid/)
  assert.match(client, /OBSERVED_AGENTS/)
  assert.doesNotMatch(client, /@TuaranX/)
  assert.doesNotMatch(client, /矿工阿三|tarsixseveneig1|涨粉潜力|推文热榜/)
  assert.doesNotMatch(client, /RadarTab|BoardTab/)
  assert.doesNotMatch(client, /大互动理论/)
  assert.match(client, /未采集/)
  assert.doesNotMatch(client, /绿皮书|黄皮书/)
  assert.doesNotMatch(client, /import RewriteTab|import AgentTab|import ScheduleTab|import PosterTab|生成配对码/)
  assert.match(operator, /登录后继续/)
  assert.match(operator, /AgentTab/)
  assert.match(operator, /当前 X 账号/)
  assert.doesNotMatch(operator, /排期|海报|ScheduleTab|PosterTab/)
  assert.doesNotMatch(operator, /RadarTab|BoardTab/)
  assert.match(agentTab, /href="\/docs"[^>]*>大互动智能体手册</)
  assert.match(operator, /signedIn &&/)
  assert.doesNotMatch(whitepaper, /查看智能体与获取方式|走进圆桌会场|打开日历/)
  assert.match(whitepaper, /<XPage/)
  assert.match(yellowbook, /https:\/\/x\.2aran\.com\/docs/)
  assert.match(roundtable, /大互动圆桌/)
  assert.match(header, /href: 'https:\/\/x\.2aran\.com\/', label: 'X大互动'/)
  assert.match(shortRoute, /code === 'x'/)
  assert.doesNotMatch(calendar, /className={styles.back}/)
  assert.doesNotMatch(roundtable, /className={styles.back}/)
  assert.match(calendar, /const title = '大互动日历'/)
  assert.match(yellowbook, /const title = '大互动智能体手册'/)
})