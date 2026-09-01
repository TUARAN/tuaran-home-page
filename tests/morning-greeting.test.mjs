import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { X_POST_SLOTS, xPostingSchedule, isXPostDue } from '../lib/xPostingSchedule.js'
import { runXAutoPosts } from '../scripts/run-x-auto-posts.mjs'


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
import { buildModelSelectionOptions } from '../lib/modelSelection.js'
import {
  DAILY_GREETING_FORMATS,
  DAILY_GREETING_STYLES,
  DAILY_GREETING_VOICES,
  DEFAULT_DAILY_GREETING_LLM_INTENT,
  buildGreetingLlmMessages,
  buildGreetingLengthRepairMessages,
  fitGeneratedGreetingToXLimit,
  normalizeGeneratedGreeting,
  normalizeGreetingGenerationMode,
  normalizeGreetingLlmIntent,
  normalizeGreetingModelSelections,
  parseGreetingModelSelection,
  greetingModelSelectionId,
  pickDailyGreetingFormat,
  pickDailyGreetingStyle,
  pickDailyGreetingVoice,
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

test('DeepSeek is the default, legacy template mode exits to DeepSeek, and Ollama remains supported', () => {
  assert.equal(normalizeGreetingGenerationMode('deepseek'), 'deepseek')
  assert.equal(normalizeGreetingGenerationMode('ollama'), 'ollama')
  assert.equal(normalizeGreetingGenerationMode('llm'), 'deepseek')
  assert.equal(normalizeGreetingGenerationMode('template'), 'deepseek')
  assert.equal(normalizeGreetingGenerationMode('unknown'), 'deepseek')
  assert.equal(normalizeGreetingLlmIntent('  写得轻松一点  '), '写得轻松一点')
  assert.equal(normalizeGreetingLlmIntent(''), DEFAULT_DAILY_GREETING_LLM_INTENT)
})

test('automation model selection accepts one model and migrates legacy settings', () => {
  assert.deepEqual(normalizeGreetingModelSelections(['deepseek', 'ollama:nas-1', 'ollama:nas-2']), ['deepseek'])
  assert.deepEqual(normalizeGreetingModelSelections(null, { fallbackMode: 'ollama', fallbackProviderId: 'nas-1' }), ['ollama:nas-1'])
  assert.deepEqual(parseGreetingModelSelection('ollama:nas-1'), { id: 'ollama:nas-1', provider: 'ollama', providerId: 'nas-1', model: '' })
  const exactModel = greetingModelSelectionId({ provider: 'ollama', providerId: 'nas-1', model: 'qwen3.5:9b' })
  assert.equal(exactModel, 'ollama:nas-1:qwen3.5%3A9b')
  assert.equal(parseGreetingModelSelection(exactModel).model, 'qwen3.5:9b')
  const options = buildModelSelectionOptions({ providers: [{
    id: 'nas-1',
    name: '绿联 DXP4800 Plus · Ollama',
    defaultModel: 'qwen3.5:9b',
    models: [{ name: 'qwen3.5:9b' }, { name: 'qwen3.8:27b' }],
  }] })
  assert.deepEqual(options.map((option) => option.model), ['deepseek-v4-flash', 'qwen3.5:9b', 'qwen3.8:27b'])
  assert.ok(options.every((option) => !option.hint.includes('Ollama · Ollama')))
})

test('LLM prompt includes current period, exact calendar date, weekday, and editable intent', () => {
  const style = DAILY_GREETING_STYLES[2]
  const voice = DAILY_GREETING_VOICES[3]
  const format = DAILY_GREETING_FORMATS[4]
  const messages = buildGreetingLlmMessages({
    intent: '围绕今天先完成一件小事来写。',
    period: 'noon',
    now: new Date('2026-08-18T04:00:00.000Z'),
    style,
    voice,
    format,
  })
  assert.equal(messages.length, 2)
  assert.match(messages[0].content, /只输出最终文案/)
  assert.match(messages[0].content, /自然点赞的理由/)
  assert.match(messages[0].content, /内容视角、人格声线和文本结构/)
  assert.match(messages[1].content, /当前时段：午安/)
  assert.match(messages[0].content, /日期或星期.*严格使用.*当前日历信息/)
  assert.match(messages[1].content, /当前日历：2026年8月18日，星期二/)
  assert.match(messages[1].content, new RegExp(`本次内容视角：${style.label}`))
  assert.match(messages[1].content, new RegExp(style.direction.slice(0, 12)))
  assert.match(messages[1].content, new RegExp(`本次人格声线：${voice.label}`))
  assert.match(messages[1].content, new RegExp(voice.direction.slice(0, 12)))
  assert.match(messages[1].content, new RegExp(`本次文本结构：${format.label}`))
  assert.match(messages[1].content, new RegExp(format.direction.slice(0, 12)))
  assert.match(messages[1].content, /围绕今天先完成一件小事来写/)
})

test('greeting content, voice, and format pools create distinct randomized combinations', () => {
  assert.equal(DAILY_GREETING_STYLES.length, 10)
  assert.equal(DAILY_GREETING_VOICES.length, 6)
  assert.equal(DAILY_GREETING_FORMATS.length, 8)
  assert.equal(new Set(DAILY_GREETING_STYLES.map((item) => item.id)).size, DAILY_GREETING_STYLES.length)
  assert.equal(new Set(DAILY_GREETING_VOICES.map((item) => item.id)).size, DAILY_GREETING_VOICES.length)
  assert.equal(new Set(DAILY_GREETING_FORMATS.map((item) => item.id)).size, DAILY_GREETING_FORMATS.length)
  assert.equal(DAILY_GREETING_STYLES.length * DAILY_GREETING_VOICES.length * DAILY_GREETING_FORMATS.length, 480)

  const valuesAcross = (length) => Array.from({ length }, (_, index) => index / length)
  assert.deepEqual(
    valuesAcross(DAILY_GREETING_STYLES.length).map((value) => pickDailyGreetingStyle({ random: () => value }).id),
    DAILY_GREETING_STYLES.map((item) => item.id),
  )
  assert.deepEqual(
    valuesAcross(DAILY_GREETING_VOICES.length).map((value) => pickDailyGreetingVoice({ random: () => value }).id),
    DAILY_GREETING_VOICES.map((item) => item.id),
  )
  assert.deepEqual(
    valuesAcross(DAILY_GREETING_FORMATS.length).map((value) => pickDailyGreetingFormat({ random: () => value }).id),
    DAILY_GREETING_FORMATS.map((item) => item.id),
  )
})

test('default greeting intent has a personal voice and the migration preserves custom settings', async () => {
  assert.match(DEFAULT_DAILY_GREETING_LLM_INTENT, /TUARAN/)
  assert.match(DEFAULT_DAILY_GREETING_LLM_INTENT, /真实的人/)
  assert.match(DEFAULT_DAILY_GREETING_LLM_INTENT, /持续制造变化/)

  const migration = await readFile(new URL('../migrations/0086_richer_daily_greeting_intent.sql', import.meta.url), 'utf8')
  assert.match(migration, /UPDATE site_settings/)
  assert.match(migration, /WHERE key = 'automation\.x_morning_greeting\.llm_intent'/)
  assert.match(migration, /AND value = '写一条自然、真诚的中文日常问候/)
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

test('自动化模块使用共用样式的单选模型组件，并退出固定文案模板模式', async () => {
  const [clientSource, automationSelectorSource, selectorSource, modelRouteSource, adminRouteSource, cronRouteSource, topbarSource] = await Promise.all([
    readFile(new URL('../app/(admin)/admin/morning-greeting/MorningGreetingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/admin/morning-greeting/AutomationModelSelector.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/components/ModelSelector.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/morning-greeting/model-selection/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/admin/morning-greeting/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/distribution/x/greeting/route.js', import.meta.url), 'utf8'),
    readFile(new URL('../app/(admin)/components/AdminTopbar.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(clientSource, /fetch\('\/api\/admin\/morning-greeting'/)
  assert.match(clientSource, /AutomationModelSelector/)
  assert.doesNotMatch(clientSource, /selectedModelIds|max=\{2\}/)
  assert.doesNotMatch(clientSource, /generation-tab|title="三条问候"|id: 'template'/)
  assert.match(automationSelectorSource, /X 自动发布模型/)
  assert.match(automationSelectorSource, /其他页面各自保存模型选择/)
  assert.match(automationSelectorSource, /api\/admin\/morning-greeting\/model-selection/)
  assert.match(automationSelectorSource, /ModelSelector/)
  assert.match(selectorSource, /<select/)
  assert.doesNotMatch(selectorSource, /selected\.length|max|首选模型调用失败时/)
  assert.match(selectorSource, /buildAdminModelOptions/)
  assert.match(modelRouteSource, /DAILY_GREETING_MODEL_SELECTIONS_KEY/)
  assert.match(modelRouteSource, /JSON\.stringify\(\[modelId\]\)/)
  assert.match(modelRouteSource, /listOllamaModels\(row\.id\)/)
  assert.doesNotMatch(adminRouteSource, /INVALID_MODEL_SELECTIONS|modelIds/)
  assert.doesNotMatch(adminRouteSource, /FIXED_TEMPLATE_SLOTS|upsertMorningGreetingTemplate/)
  assert.doesNotMatch(adminRouteSource, /X_ARTICLE_TASK_SETTING_KEY|xArticleRun/)
  assert.doesNotMatch(topbarSource, /AutomationModelSelector|GlobalModelSelector/)
  assert.match(cronRouteSource, /callDeepSeek\(/)
  assert.match(cronRouteSource, /callOllama\(/)
  assert.doesNotMatch(cronRouteSource, /orderGreetingModelSelections|for \(const selection of orderedModelSelections\)/)
  assert.match(cronRouteSource, /activeModelSelection = legacySelections\[0\]/)
  assert.doesNotMatch(cronRouteSource, /listEnabledMorningGreetingTexts|pickDailyGreetingTemplate/)
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
  assert.match(clientSource, /grid-cols-10/)
  assert.match(clientSource, /按任务类型筛选/)
  assert.match(clientSource, /timeline-status-filter/)
  assert.match(clientSource, /08:00/)
  assert.match(clientSource, /09:00/)
  assert.match(clientSource, /朋友交流/)
  assert.match(clientSource, /11:00/)
  assert.match(clientSource, /17:00/)
  assert.match(clientSource, /加密观点/)
  assert.match(clientSource, /次日 03:00/)
  assert.match(clientSource, /次日 07:00/)
  assert.match(clientSource, /美区英文/)
  assert.match(clientSource, /visibleItems\.length} \/ {items\.length} 个节点/)
  assert.doesNotMatch(clientSource, /X 长文章|xArticleRun|14:00/)
})

test('daily posting times keep the ten focused baselines, vary by date, and stay within 30 minutes', async () => {
  assert.equal(X_POST_SLOTS.length, 10)
  const day = await xPostingSchedule(new Date(Date.UTC(2026, 7, 29)))
  assert.deepEqual(day.map((task) => task.time), [
    '08:00', '10:00', '20:00', '09:00', '15:00',
    '11:00', '17:00', '23:00', '03:00', '07:00',
  ])
  assert.deepEqual(await xPostingSchedule(new Date(Date.UTC(2026, 7, 29, 8))), day)
  const nextDay = await xPostingSchedule(new Date(Date.UTC(2026, 7, 30)))
  assert.notDeepEqual(day.map((task) => task.offsetMinutes), nextDay.map((task) => task.offsetMinutes))
  for (const task of [...day, ...nextDay]) {
    assert.ok(Number.isInteger(task.offsetMinutes))
    assert.ok(Math.abs(task.offsetMinutes) <= 30)
    assert.equal(task.scheduledAt - task.baselineAt, task.offsetMinutes * 60_000)
  }
})

test('schedule windows start at the target and reject expired or next-day triggers', async () => {
  const day = await xPostingSchedule(new Date(Date.UTC(2026, 7, 28, 16)))
  assert.ok(day.every((task) => task.date === '2026-08-29'))
  for (const task of day) {
    assert.equal(isXPostDue(task, new Date(task.scheduledAt - 1)), false)
    assert.equal(isXPostDue(task, new Date(task.scheduledAt)), true)
    assert.equal(isXPostDue(task, new Date(task.scheduledAt + 60 * 60_000 + 1)), false)
  }
  const late = day.find((task) => task.id === 'us_morning')
  assert.equal(isXPostDue(late, new Date(Date.UTC(2026, 7, 29, 16))), false)
})

test('scheduler calls only due tasks, carries their date, and isolates request failures', async () => {
  const requests = []
  const results = await runXAutoPosts({
    now: new Date(Date.UTC(2026, 7, 29, 2)),
    secret: 'test-secret',
    fetchImpl: async (url, init) => {
      const query = new URL(url).searchParams
      assert.equal(query.get('scheduledDate'), '2026-08-29')
      assert.equal(init.headers['x-morning-greeting-secret'], 'test-secret')
      requests.push(query)
      if (query.has('community')) throw new Error('network unavailable')
      return Response.json({ ok: true }, { status: 201 })
    },
  })
  assert.equal(requests.length, 2)
  assert.deepEqual(results.map((result) => result.slot).sort(), ['community_friends', 'culture_morning'])
  assert.equal(results.filter((result) => result.ok).length, 1)
})
