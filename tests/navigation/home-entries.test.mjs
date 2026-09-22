import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [page, discovery, styles] = await Promise.all([
  readFile(new URL('../../app/(site)/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/components/HomeDiscoveryPanel.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/globals.css', import.meta.url), 'utf8'),
])

test('WorkBuddy does not occupy a separate homepage row', () => {
  assert.doesNotMatch(page, /WorkBuddyEntry|home-workbuddy-entry/)
  assert.doesNotMatch(styles, /home-workbuddy-/)
})

test('WorkBuddy stays in homepage discovery and keeps its tracked external link', () => {
  assert.equal(page.match(/https:\/\/workbuddy\.2aran\.com\//g)?.length, 1)
  assert.match(page, /external: true, analyticsId: 'workbuddy'/)
  assert.match(discovery, /data-analytics-destination-id=\{item.analyticsId \|\| item.id\}/)
  assert.match(discovery, /rel="noopener noreferrer"/)
})

test('Blogger Alliance promotion entry appears in homepage discovery', () => {
  assert.equal(page.match(/https:\/\/blogger-alliance\.cn\//g)?.length, 2)
  assert.match(page, /title: '合作推广'/)
  assert.match(page, /desc: '博主联盟与项目合作'/)
  assert.match(page, /external: true, analyticsId: 'blogger-alliance'/)
})

test('homepage exploration uses one grouped sidebar panel instead of competing navigation blocks', () => {
  assert.doesNotMatch(styles, /hot-ticker-marquee/)
  assert.doesNotMatch(page, /HotTickerBar/)
  assert.match(page, /<HomeDiscoveryPanel groups=\{HOME_EXPLORE_GROUPS\} \/>/)
  for (const label of ['内容与研究', '作品与资源', '关于与连接', '其他站点']) {
    assert.match(page, new RegExp(`label: '${label}'`))
  }
  assert.match(discovery, /className="home-explore-groups"/)
  assert.match(discovery, /group\.collapsed/)
  assert.doesNotMatch(discovery, /DISCOVERY_ITEMS/)
})

test('homepage exploration gives each destination a distinct semantic icon', () => {
  const expectedIcons = {
    'AI 与开发': 'IconRobot',
    '公司调研': 'IconBuildingSkyscraper',
    '工程实践': 'IconTools',
    '前端周看': 'IconNews',
    '互动专题': 'IconPointer',
    'Codex 重置': 'IconCalendarEvent',
    '原创项目': 'IconBulb',
    '资源': 'IconArchive',
    'WorkBuddy 学习手册': 'IconSchool',
    '了解作者': 'IconUserCircle',
    '交友进社群': 'IconMessages',
    '合作推广': 'IconHeartHandshake',
  }

  for (const [title, icon] of Object.entries(expectedIcons)) {
    assert.match(page, new RegExp(`title: '${title}'[^\\n]+icon: ${icon}`))
  }
  assert.equal(new Set(Object.values(expectedIcons)).size, Object.keys(expectedIcons).length)
})
