import { GREETING_PERIODS } from './dailyGreeting.js'
import { CULTURE_STORY_SLOTS } from './dailyCultureStory.js'
import { X_COMMUNITY_SLOTS } from './xCommunityPosts.js'
import { X_CRYPTO_POST_SLOTS } from './xCryptoPosts.js'
import { X_US_AUDIENCE_SLOTS } from './xUsAudiencePosts.js'
import { X_ACTIVE_POST_SLOT_IDS } from './xPostingSchedule.js'

export const X_AUTOMATION_STATUS = Object.freeze({
  pausedAt: '2026-09-23',
  pausedReason: '站长手动暂停，D1 键 automation.x_morning_greeting = paused',
  lastPostDate: '2026-09-23',
  lastPostSlot: 'morning',
  lastPostUrl: 'https://x.com/i/web/status/2102548104113488344',
})

export const X_AUTOMATION_SUMMARY = Object.freeze({
  startDate: '2026-08-04',
  endDate: '2026-09-23',
  runDays: 51,
  trackedPosts: 197,
  estimatedTotalPosts: '230–240',
  trackedCostUsd: 2.96,
  estimatedTotalCostUsd: '3.4–3.6',
  workflowRuns: 2660,
  assetRecords: 181,
  costTrackingSince: '2026-08-26',
})

export const X_AUTOMATION_VIEWS = Object.freeze([
  { id: 'overview', label: '概览' },
  { id: 'timeline', label: '时间线' },
  { id: 'schedule', label: '排期演变' },
  { id: 'stats', label: '运行数据' },
])

/** 规模图只展示档位变化节点，避免同档重复（如两个「10」）造成误读。 */
export const X_AUTOMATION_SCALE_MILESTONES = Object.freeze([
  { phaseId: 'launch', date: '2026-08-04', label: '单条早安', postsPerDay: 1, tone: 'neutral' },
  { phaseId: 'three-periods', date: '2026-08-17', label: '三时段', postsPerDay: 3, tone: 'growth' },
  { phaseId: 'focus-ten', date: '2026-08-29', label: '十条矩阵', postsPerDay: 10, tone: 'peak' },
  { phaseId: 'shrink-five', date: '2026-09-09', label: '收束五条', postsPerDay: 5, tone: 'stable' },
  { phaseId: 'paused', date: '2026-09-23', label: '暂停', postsPerDay: 0, tone: 'paused' },
])

export const X_AUTOMATION_PHASES = Object.freeze([
  {
    id: 'launch',
    date: '2026-08-04',
    label: '上线',
    postsPerDay: 1,
    tone: 'neutral',
    commit: 'e5190d1d',
    summary: 'GitHub Actions 每天 08:00 触发，固定模板早安，后台可暂停。',
    highlights: [
      'POST /api/distribution/x/greeting + X OAuth 1.0a',
      'MORNING_GREETING_SECRET 鉴权',
      'D1 automation.x_morning_greeting 开关',
    ],
  },
  {
    id: 'templates',
    date: '2026-08-07',
    label: '模板后台',
    postsPerDay: 1,
    tone: 'neutral',
    commit: 'c0dd3566',
    summary: '10 条早安文案进 D1，/admin/morning-greeting 可编辑，按日期稳定随机。',
    highlights: [
      'morning_greeting_templates 表',
      '当天幂等，补跑不换文案',
    ],
  },
  {
    id: 'three-periods',
    date: '2026-08-17',
    label: '三时段',
    postsPerDay: 3,
    tone: 'growth',
    commit: 'f1510eab',
    summary: '扩到早 / 午 / 晚三条，cron 每个时段 ±20 分钟补跑。',
    highlights: [
      '08:00 早安、12:00 午安、22:00 晚安',
      'lib/dailyGreeting.js 三时段模型',
    ],
  },
  {
    id: 'llm',
    date: '2026-08-18',
    label: 'LLM 生成',
    postsPerDay: 3,
    tone: 'growth',
    commit: '5358b552',
    summary: 'DeepSeek 实时写文案，模板模式保留；8/24 加入五种写作风格随机。',
    highlights: [
      'lib/dailyGreetingLlm.js',
      '8/23 超长帖二次压缩',
      '8/20 全站默认 DeepSeek flash',
    ],
  },
  {
    id: 'expansion',
    date: '2026-08-23',
    label: '类型扩张',
    postsPerDay: 10,
    tone: 'peak',
    commit: 'f0452663',
    summary: '一周内连续加入文化短故事、交友帖、美区英文、加密观点、AI 配图。',
    highlights: [
      '8/26 成本追踪 x_api_cost_events',
      '8/28 Codex 生图 + R2 素材池',
      '8/29 ±30 分钟随机排程',
    ],
  },
  {
    id: 'focus-ten',
    date: '2026-08-29',
    label: '聚焦十条',
    postsPerDay: 10,
    tone: 'peak',
    commit: 'b5731689',
    summary: '活跃槽位定为 10 条：问候、文化、交友、加密、美区；午安与晚安退出活跃列表。',
    highlights: [
      'lib/xPostingSchedule.js 活跃槽位过滤',
      'cron 改为每 5 分钟检查到期任务',
    ],
  },
  {
    id: 'shrink-five',
    date: '2026-09-09',
    label: '收束五条',
    postsPerDay: 5,
    tone: 'stable',
    commit: 'd7601113',
    summary: '回到 5 条/天，加密 / 文化 / 美区 / 晚安代码层暂停；配图改为 15 张原创表情包。',
    highlights: [
      '早安、午安、认识新朋友、蓝 V 交流、互关串门',
      'lib/xMemeAssets.js 五组表情包',
    ],
  },
  {
    id: 'humanize',
    date: '2026-09-18',
    label: '去模板化',
    postsPerDay: 5,
    tone: 'stable',
    commit: '12ff8f4f',
    summary: '问候与交友 prompt 从「问好 + 小场景 + 求互关」改为生活切口短帖。',
    highlights: [
      '0093 迁移更新默认站长意图',
      '禁止三段式与互关话术骨架',
    ],
  },
  {
    id: 'paused',
    date: '2026-09-23',
    label: '暂停',
    postsPerDay: 0,
    tone: 'paused',
    commit: '',
    summary: '生产 D1 设为 paused；GitHub Actions 仍轮询，API 返回 423，不再发帖。',
    highlights: [
      '当日仅 07:57 早安已发出',
      '其余 4 条被拦截',
    ],
  },
])

const SLOT_TYPE_LABELS = Object.freeze({
  morning: '问候',
  noon: '问候',
  evening: '问候',
  culture_morning: '文化',
  culture_afternoon: '文化',
  culture_evening: '文化',
  community_friends: '交友',
  community_learning: '交友',
  community_growth: '交友',
  crypto_knowledge: '加密',
  crypto_market: '加密',
  crypto_people: '加密',
  us_morning: '美区',
  us_midday: '美区',
  us_evening: '美区',
})

const SLOT_DEFINITIONS = Object.freeze({
  ...GREETING_PERIODS,
  ...CULTURE_STORY_SLOTS,
  ...X_COMMUNITY_SLOTS,
  ...X_CRYPTO_POST_SLOTS,
  ...X_US_AUDIENCE_SLOTS,
})

const FOCUS_TEN_SLOT_IDS = Object.freeze([
  'morning',
  'culture_morning',
  'culture_evening',
  'community_friends',
  'community_learning',
  'crypto_knowledge',
  'crypto_market',
  'us_morning',
  'us_midday',
  'us_evening',
])

function slotTime(definition) {
  if (definition?.time) return definition.time
  if (Number.isFinite(definition?.hour)) {
    return `${String(definition.hour).padStart(2, '0')}:00`
  }
  return '—'
}

export function buildScheduleSlot(id, { active = true } = {}) {
  const definition = SLOT_DEFINITIONS[id]
  if (!definition) return null
  return {
    id,
    time: slotTime(definition),
    type: SLOT_TYPE_LABELS[id] || '其他',
    active,
  }
}

export function buildScheduleSnapshot(phaseId, label, slotIds, { paused = [] } = {}) {
  return {
    phaseId,
    label,
    slots: slotIds.map((id) => buildScheduleSlot(id)).filter(Boolean),
    paused,
  }
}

export const X_AUTOMATION_SCHEDULE_SNAPSHOTS = Object.freeze([
  buildScheduleSnapshot('launch', '8/4 单条早安', ['morning']),
  buildScheduleSnapshot('three-periods', '8/17 三时段', ['morning', 'noon', 'evening']),
  buildScheduleSnapshot('focus-ten', '8/29 十条活跃', FOCUS_TEN_SLOT_IDS),
  buildScheduleSnapshot('shrink-five', '9/9 至今五条', [...X_ACTIVE_POST_SLOT_IDS], {
    paused: ['evening', 'culture_*', 'crypto_*', 'us_*'],
  }),
])

export const X_AUTOMATION_DAILY_POSTS = Object.freeze([
  { date: '2026-08-26', posts: 6, note: '成本追踪上线' },
  { date: '2026-08-27', posts: 10 },
  { date: '2026-08-28', posts: 14, note: '峰值' },
  { date: '2026-08-29', posts: 13 },
  { date: '2026-08-30', posts: 10 },
  { date: '2026-08-31', posts: 10 },
  { date: '2026-09-01', posts: 9 },
  { date: '2026-09-03', posts: 7 },
  { date: '2026-09-04', posts: 10 },
  { date: '2026-09-05', posts: 10 },
  { date: '2026-09-06', posts: 9 },
  { date: '2026-09-07', posts: 10 },
  { date: '2026-09-08', posts: 10 },
  { date: '2026-09-09', posts: 8, note: '切换日' },
  { date: '2026-09-10', posts: 1 },
  { date: '2026-09-11', posts: 4 },
  { date: '2026-09-12', posts: 5, note: '稳定五条' },
  { date: '2026-09-13', posts: 5 },
  { date: '2026-09-14', posts: 5 },
  { date: '2026-09-15', posts: 5 },
  { date: '2026-09-16', posts: 5 },
  { date: '2026-09-17', posts: 5 },
  { date: '2026-09-18', posts: 5 },
  { date: '2026-09-19', posts: 5 },
  { date: '2026-09-20', posts: 5 },
  { date: '2026-09-21', posts: 5 },
  { date: '2026-09-22', posts: 5 },
  { date: '2026-09-23', posts: 1, note: '暂停日' },
])

export const X_AUTOMATION_ARCHITECTURE = Object.freeze([
  { step: '01', title: '定时触发', detail: 'GitHub Actions morning-greeting.yml；8/29 起每 5 分钟检查到期任务，此前为固定时段 cron' },
  { step: '02', title: '调度脚本', detail: 'scripts/run-x-auto-posts.mjs 读取 lib/xPostingSchedule.js' },
  { step: '03', title: '发布 API', detail: 'POST /api/distribution/x/greeting，x-morning-greeting-secret 鉴权' },
  { step: '04', title: '文案生成', detail: 'DeepSeek v4-flash 按时段 prompt 实时生成，50% 概率配表情包' },
  { step: '05', title: '发帖与记录', detail: 'X OAuth 1.0a 创建 Post，D1 记录 last_run 与 x_post_assets' },
])

export function maxDailyPosts(days = X_AUTOMATION_DAILY_POSTS) {
  return Math.max(...days.map((day) => day.posts), 1)
}

/** 柱图/标记点用固定色值，避免 Tailwind 扫不到动态 class 导致柱子透明。 */
export function phaseToneColor(tone) {
  if (tone === 'peak') return '#d97706'
  if (tone === 'growth') return '#059669'
  if (tone === 'stable') return '#0284c7'
  if (tone === 'paused') return '#e11d48'
  return '#8a8f7a'
}

export function sumDailyPosts(days = X_AUTOMATION_DAILY_POSTS) {
  return days.reduce((total, day) => total + day.posts, 0)
}
