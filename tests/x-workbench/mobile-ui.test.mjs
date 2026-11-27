import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const cssUrl = new URL('../../app/(x)/x-workbench/workbench.module.css', import.meta.url)
const homeUrl = new URL('../../app/(x)/x-workbench/WorkbenchClient.jsx', import.meta.url)
const operatorUrl = new URL('../../app/(x)/x-workbench/OperatorClient.jsx', import.meta.url)
const agentTabUrl = new URL('../../app/(x)/x-workbench/AgentTab.jsx', import.meta.url)

const read = () => Promise.all([
  readFile(cssUrl, 'utf8'),
  readFile(homeUrl, 'utf8'),
  readFile(operatorUrl, 'utf8'),
  readFile(agentTabUrl, 'utf8'),
])

test('H5 有统一盒模型、三层断点与刘海屏安全区', async () => {
  const [css] = await read()
  assert.match(css, /\.app, \.app \*, \.app \*::before, \.app \*::after \{ box-sizing: border-box; \}/)
  for (const width of [960, 640, 380]) assert.match(css, new RegExp(`@media \\(max-width: ${width}px\\)`))
  assert.match(css, /env\(safe-area-inset-top/)
  assert.match(css, /env\(safe-area-inset-bottom/)
})

test('H5 触控目标与表单按手机标准，卡片数据行单列排布', async () => {
  const [css] = await read()
  const phone = css.slice(css.indexOf('@media (max-width: 640px)'), css.indexOf('@media (max-width: 380px)'))
  assert.match(phone, /\.btn \{ min-height: 44px;/)
  assert.match(phone, /\.input \{ font-size: 16px; min-height: 44px;/)
  assert.match(phone, /\.agentCard \{ padding: 12px 14px; border-radius: 14px; box-shadow: none; \}/)
  assert.match(phone, /\.metricRow \{ margin-top: 11px; padding-top: 9px; gap: 6px; display: grid; grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/)
  assert.match(phone, /\.actionRow \{ display: grid; grid-template-columns: 1fr 1fr;/)
})

test('首页账号卡是机器人头像 + 身份行 + 无底色数据行，数据行四列排布', async () => {
  const [css, home] = await read()
  assert.match(css, /\.agentRobot \{ flex: none; width: 42px;/)
  assert.match(css, /\.metricRow \{ display: flex;/)
  assert.doesNotMatch(css, /agentMain|heroValue|heroMissing|heroSkeleton|metricList|grid-template-areas: "head head"/)
  assert.match(home, /<AgentRobotAvatar handle=\{agent\.handle\} className=\{s\.agentRobot\} \/>/)
  assert.match(home, /s\.metricRow/)
  assert.doesNotMatch(home, /s\.metricHero/)
})

test('首页加载态用骨架条，状态由卡片 chip 统一表达', async () => {
  const [, home] = await read()
  assert.match(home, /s\.skeleton/)
  assert.match(home, /s\.statusChip/)
  assert.match(home, /未采集/)
  assert.match(home, /intro="插件形态本地运行，本站实时汇总状态与日报，站长可远程监看。"/)
  assert.doesNotMatch(home, /s\.actionRow/)
})

test('后台手机布局有独立表单类，账号选择与智能体保留', async () => {
  const [, , operator, agentTab] = await read()
  assert.match(operator, /s\.accountRow/)
  assert.match(operator, /s\.accountSelect/)
  assert.match(operator, /当前 X 账号/)
  assert.match(agentTab, /s\.accountChips/)
  assert.match(agentTab, /s\.bindForm/)
  assert.match(agentTab, /s\.pairRow/)
  assert.doesNotMatch(`${operator}\n${agentTab}`, /ScheduleTab|PosterTab/)
})

test('后台只做账号绑定与插件配对，不设额度和人格', async () => {
  const [, , operator, agentTab] = await read()
  assert.doesNotMatch(agentTab, /本月额度|PERSONA_FIELDS|'\/profile|addMemory/)
  assert.doesNotMatch(operator, /\/usage|usage=/)
  assert.match(operator, /人格与记忆直接在插件里设置/)
})

test('首页插件现场不显示站长操作', async () => {
  const monitor = await readFile(new URL('../../app/(x)/x-workbench/MonitorSection.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(monitor, /站长操作|sendCommand|flow-start|ext-update/)
})
