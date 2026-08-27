import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  DAILY_GREETING_TEMPLATES,
  buildDailyGreeting,
  greetingLastRunKey,
  greetingPeriodForDate,
  MORNING_GREETING_TEMPLATE,
  MORNING_GREETING_TEMPLATES,
  buildMorningGreeting,
  greetingCalendarLabel,
  greetingDateLabel,
  greetingWithinLimit,
  isAutomationPaused,
  normalizeGreetingNewlines,
  pickDailyGreetingTemplate,
  pickMorningGreetingTemplate,
  shanghaiDateKey,
} from '../lib/morningGreeting.js'
import { rowToTemplate } from '../lib/morningGreetingTemplates.js'
import {
  DAILY_GREETING_STYLES,
  DEFAULT_DAILY_GREETING_LLM_INTENT,
  buildGreetingLlmMessages,
  buildGreetingLengthRepairMessages,
  fitGeneratedGreetingToXLimit,
  normalizeGeneratedGreeting,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
  pickDailyGreetingStyle,
} from '../lib/dailyGreetingLlm.js'
import {
  X_API_POST_CREATE_COST_MICRO_USD,
  X_API_POST_CREATE_WITH_URL_COST_MICRO_USD,
  projectedXPostCost,
  xPostCreatePricing,
} from '../lib/xApiCost.js'

test('greeting date label uses Asia/Shanghai day of month', () => {
  const label = greetingDateLabel({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.equal(label, '8月5号')
})

test('greeting calendar label keeps the Shanghai date and weekday together', () => {
  const label = greetingCalendarLabel({ now: new Date('2026-08-25T00:30:00.000Z') })
  assert.equal(label, '2026年8月25日，星期二')
})

test('shanghai date key uses Asia/Shanghai calendar day', () => {
  // 北京时间 8/5 08:30 = UTC 8/5 00:30
  assert.equal(shanghaiDateKey(new Date('2026-08-05T00:30:00.000Z')), '2026-08-05')
  // UTC 8/4 17:00 = 北京时间 8/5 01:00，应归属 8/5
  assert.equal(shanghaiDateKey(new Date('2026-08-04T17:00:00.000Z')), '2026-08-05')
  // UTC 8/5 15:59 = 北京时间 8/5 23:59，应归属 8/5
  assert.equal(shanghaiDateKey(new Date('2026-08-05T15:59:00.000Z')), '2026-08-05')
})

test('builds a morning greeting with today date injected', () => {
  const text = buildMorningGreeting({ now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(text.includes('今天是8月5号'))
  assert.ok(!text.includes('{date}'))
  assert.ok(!text.toLowerCase().includes('chovy'))
  assert.match(text, /^(大家早上好|早上好|早安)！/)
  assert.ok(text.split('\n').length >= 2)
})

test('normalizeGreetingNewlines turns literal \\n into real newlines', () => {
  assert.equal(normalizeGreetingNewlines('早安！\\n今天也要保持好奇。\\n冷知识：～'), '早安！\n今天也要保持好奇。\n冷知识：～')
  assert.equal(normalizeGreetingNewlines(null), '')
})

test('buildMorningGreeting normalizes legacy literal \\n templates', () => {
  const legacy = '早安！今天是{date}。\\n今天也要保持好奇。\\n冷知识：那些看起来毫不费力的人，只是把练习藏在了别人看不到的地方～'
  const built = buildMorningGreeting({ now: new Date('2026-08-08T00:30:00.000Z'), template: legacy })
  assert.ok(built.includes('今天是8月8号'))
  assert.ok(!built.includes('\\n'))
  assert.equal(built.split('\n').length, 3)
})

test('rowToTemplate normalizes legacy literal \\n from D1 rows', () => {
  const row = rowToTemplate({ id: 1, text: '早安！\\n冷知识：～', enabled: 1, sort_order: 0, created_at: 0, updated_at: 0 })
  assert.equal(row.text, '早安！\n冷知识：～')
})

test('three editable daily greeting defaults cover morning, noon, and evening', () => {
  assert.equal(DAILY_GREETING_TEMPLATES.length, 3)
  assert.equal(MORNING_GREETING_TEMPLATES.length, 1)
  assert.equal(MORNING_GREETING_TEMPLATE, MORNING_GREETING_TEMPLATES[0])
  assert.deepEqual(
    Object.fromEntries(['morning', 'noon', 'evening'].map((period) => [period, DAILY_GREETING_TEMPLATES.filter((item) => item.period === period).length])),
    { morning: 1, noon: 1, evening: 1 },
  )
  for (const template of DAILY_GREETING_TEMPLATES) {
    assert.match(template.text, /^(早安|午安|晚安)！/)
    assert.ok(template.text.includes('{date}'))
    assert.ok(['quote', 'story', 'reflection'].includes(template.contentKind))
    assert.ok(greetingWithinLimit(template.text.replace('{date}', '12月31号')), `模板超重：${template.text.slice(0, 20)}…`)
  }
})

test('period is inferred in Asia/Shanghai and each period has its own idempotency key', () => {
  assert.equal(greetingPeriodForDate(new Date('2026-08-05T00:00:00Z')), 'morning')
  assert.equal(greetingPeriodForDate(new Date('2026-08-05T04:00:00Z')), 'noon')
  assert.equal(greetingPeriodForDate(new Date('2026-08-05T14:00:00Z')), 'evening')
  assert.notEqual(greetingLastRunKey('morning'), greetingLastRunKey('noon'))
})

test('builds the requested greeting period', () => {
  const now = new Date('2026-08-05T04:00:00Z')
  assert.match(buildDailyGreeting({ now, period: 'noon' }), /^午安！/)
  assert.match(buildDailyGreeting({ now, period: 'evening' }), /^晚安！/)
})

test('daily picker accepts a D1 text pool already filtered for noon or evening', () => {
  assert.equal(
    pickDailyGreetingTemplate(['午安！数据库自定义模板。'], { period: 'noon', now: new Date('2026-08-05T04:00:00Z') }),
    '午安！数据库自定义模板。',
  )
})

test('the fixed morning template is stable across shanghai days', () => {
  const day1a = pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now: new Date('2026-08-05T00:30:00.000Z') })
  const day1b = pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now: new Date('2026-08-05T15:00:00.000Z') })
  const day2 = pickMorningGreetingTemplate(MORNING_GREETING_TEMPLATES, { now: new Date('2026-08-06T00:30:00.000Z') })
  assert.equal(day1a, day1b)
  assert.ok(MORNING_GREETING_TEMPLATES.includes(day1a))
  assert.ok(MORNING_GREETING_TEMPLATES.includes(day2))
  assert.equal(day1a, day2)
})

test('template pick falls back to defaults when pool is empty', () => {
  const picked = pickMorningGreetingTemplate([], { now: new Date('2026-08-05T00:30:00.000Z') })
  assert.ok(MORNING_GREETING_TEMPLATES.includes(picked))
})

test('pause state parsing treats only paused as paused', () => {
  assert.equal(isAutomationPaused('paused'), true)
  assert.equal(isAutomationPaused(' running '), false)
  assert.equal(isAutomationPaused(null), false)
  assert.equal(isAutomationPaused(''), false)
})

test('X API 发帖成本按正文是否包含 URL 自动分类', () => {
  assert.deepEqual(xPostCreatePricing('早安，今天也要好好生活。'), {
    key: 'post_create',
    label: '发帖（不含 URL）',
    microUsd: X_API_POST_CREATE_COST_MICRO_USD,
  })
  assert.deepEqual(xPostCreatePricing('阅读全文：https://2aran.com/articles/demo'), {
    key: 'post_create_with_url',
    label: '发帖（含 URL）',
    microUsd: X_API_POST_CREATE_WITH_URL_COST_MICRO_USD,
  })
  assert.equal(projectedXPostCost({ postsPerDay: 6, days: 30 }), 2_700_000)
})

test('DeepSeek is the default while Ollama, templates, and the legacy LLM value remain supported', () => {
  assert.equal(normalizeGreetingGenerationMode('deepseek'), 'deepseek')
  assert.equal(normalizeGreetingGenerationMode('ollama'), 'ollama')
  assert.equal(normalizeGreetingGenerationMode('llm'), 'deepseek')
  assert.equal(normalizeGreetingGenerationMode('template'), 'template')
  assert.equal(normalizeGreetingGenerationMode('unknown'), 'deepseek')
  assert.equal(normalizeGreetingLlmIntent('  写得轻松一点  '), '写得轻松一点')
  assert.equal(normalizeGreetingLlmIntent(''), DEFAULT_DAILY_GREETING_LLM_INTENT)
})

test('LLM prompt includes current period, exact calendar date, weekday, and editable intent', () => {
  const style = DAILY_GREETING_STYLES[2]
  const messages = buildGreetingLlmMessages({
    intent: '围绕今天先完成一件小事来写。',
    period: 'noon',
    now: new Date('2026-08-18T04:00:00.000Z'),
    style,
  })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /只输出最终文案/)
  assert.match(messages[1].content, /当前时段：午安/)
  assert.match(messages[0].content, /日期或星期.*严格使用.*当前日历信息/)
  assert.match(messages[1].content, /当前日历：2026年8月18日，星期二/)
  assert.match(messages[1].content, new RegExp(`本次风格：${style.label}`))
  assert.match(messages[1].content, new RegExp(style.direction.slice(0, 12)))
  assert.match(messages[1].content, /围绕今天先完成一件小事来写/)
})

test('five greeting styles are distinct and selected across the full random range', () => {
  assert.equal(DAILY_GREETING_STYLES.length, 5)
  assert.equal(new Set(DAILY_GREETING_STYLES.map((style) => style.id)).size, 5)
  assert.equal(new Set(DAILY_GREETING_STYLES.map((style) => style.label)).size, 5)
  assert.deepEqual(
    [0, 0.2, 0.4, 0.6, 0.999999].map((value) => pickDailyGreetingStyle({ random: () => value }).id),
    DAILY_GREETING_STYLES.map((style) => style.id),
  )
})

test('generated greeting cleanup removes wrappers without rewriting copy', () => {
  assert.equal(normalizeGeneratedGreeting('```text\n午安！先好好吃饭。\n```'), '午安！先好好吃饭。')
  assert.equal(normalizeGeneratedGreeting('最终文案：晚安，今天辛苦了。'), '晚安，今天辛苦了。')
  assert.equal(normalizeGeneratedGreeting('“早安，慢慢开始。”'), '早安，慢慢开始。')
})

test('overlong generated copy gets a focused rewrite prompt and a deterministic X-safe fallback', () => {
  const original = `愚公每天挖山。${'后来邻人也来帮忙，大家一点点把石土运走。'.repeat(12)}坚持会让遥远的目标变得可以抵达。`
  const messages = buildGreetingLengthRepairMessages({ text: original })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /不超过 240/)
  assert.match(messages[1].content, /原文：/)

  const fitted = fitGeneratedGreetingToXLimit(original)
  assert.equal(fitted.adjusted, true)
  assert.ok(greetingWithinLimit(fitted.text))
  assert.match(fitted.text, /[。！？…]$/)
})

test('自动任务支持三种生成模式，模板管理收敛为三条固定编辑位', async () => {
  const [clientSource, adminRouteSource, cronRouteSource] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/morning-greeting/MorningGreetingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/morning-greeting/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/distribution/x/greeting/route.js', import.meta.url), 'utf8'),
  ])

  assert.match(clientSource, /fetch\('\/api\/admin\/morning-greeting'/)
  assert.match(clientSource, /id: 'deepseek'/)
  assert.match(clientSource, /id: 'ollama'/)
  assert.match(clientSource, /id: 'template'/)
  assert.match(clientSource, /title="三条问候"/)
  assert.match(clientSource, /切换尚未生效/)
  assert.doesNotMatch(clientSource, /新增模板|删除这条文案|AdminPagination/)
  assert.match(adminRouteSource, /DAILY_GREETING_OLLAMA_PROVIDER_KEY/)
  assert.match(adminRouteSource, /FIXED_TEMPLATE_SLOTS/)
  assert.doesNotMatch(adminRouteSource, /X_ARTICLE_TASK_SETTING_KEY|xArticleRun/)
  assert.match(cronRouteSource, /callDeepSeek\(/)
  assert.match(cronRouteSource, /callOllama\(/)
  assert.match(cronRouteSource, /buildGreetingLengthRepairMessages/)
  assert.match(cronRouteSource, /fitGeneratedGreetingToXLimit/)
  assert.match(cronRouteSource, /pickDailyGreetingStyle/)
  assert.match(cronRouteSource, /styleLabel/)
  assert.match(cronRouteSource, /recordXApiPostCost/)
  assert.match(clientSource, /X API 成本/)
  assert.match(clientSource, /30 天预计/)
})

test('自动任务总览使用横向时间轴并支持类型与状态筛选', async () => {
  const clientSource = await readFile(new URL('../app/(admin)/admin/morning-greeting/MorningGreetingClient.jsx', import.meta.url), 'utf8')

  assert.match(clientSource, /aria-label="每日自动发布横向时间轴"/)
  assert.match(clientSource, /grid-cols-15/)
  assert.match(clientSource, /按任务类型筛选/)
  assert.match(clientSource, /timeline-status-filter/)
  assert.match(clientSource, /08:00/)
  assert.match(clientSource, /09:00/)
  assert.match(clientSource, /朋友图文/)
  assert.match(clientSource, /11:00/)
  assert.match(clientSource, /17:00/)
  assert.match(clientSource, /21:00/)
  assert.match(clientSource, /加密观点/)
  assert.match(clientSource, /22:00/)
  assert.match(clientSource, /次日 03:00/)
  assert.match(clientSource, /次日 07:00/)
  assert.match(clientSource, /美区英文/)
  assert.match(clientSource, /visibleItems\.length} \/ {items\.length} 个节点/)
  assert.doesNotMatch(clientSource, /X 长文章|xArticleRun|14:00/)
})
