import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const loop = require('../../tools/x-reply-clipboard-extension/loop.js')
const mutual = require('../../tools/x-reply-clipboard-extension/mutual.js')
const poster = require('../../tools/x-reply-clipboard-extension/poster.js')
const postImage = require('../../tools/x-reply-clipboard-extension/postImage.js')
const context = require('../../tools/x-reply-clipboard-extension/context.js')
const background = require('../../tools/x-reply-clipboard-extension/background.js')
const autoLike = require('../../tools/x-reply-clipboard-extension/autoLike.js')
const receipt = require('../../tools/x-reply-clipboard-extension/receipt.js')
const devUpdate = require('../../tools/x-reply-clipboard-extension/devUpdate.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)
const USER_STATE_HELPERS = `
  const USER_STATE_LABELS = Object.freeze({
    running: "运行中", waiting: "等待中", needs: "需处理", stopped: "已停止",
    starting: "启动中", stopping: "停止中"
  });
  function userStateLabelForTask(status) {
    if (status === "running") return USER_STATE_LABELS.running;
    if (status === "waiting" || status === "stopping") return USER_STATE_LABELS.waiting;
    if (status === "blocked" || status === "unknown") return USER_STATE_LABELS.needs;
    return USER_STATE_LABELS.stopped;
  }
  function isScheduleWaitReason(reason) {
    const text = String(reason || "").trim();
    if (!text || /已手动停止|未参与排班|站长后台已停止/u.test(text)) return false;
    return /等待下次排班|等待间隔|短轮已结束|本轮动作已完成|已转入单页签排班|更高优先级|安全轮换|等待下次运行|排队中|等待安排|夜间回关|等待精品|等待每周|点赞短轮/u.test(text);
  }
  function formatUserStateAction(stateLabel, actionLabel) { return \`\${stateLabel} · \${actionLabel}\`; }
  function formatFlowPrompt(nowLabel, nextLabel, actionLabel) {
    return [nowLabel, nextLabel, actionLabel].filter(Boolean).join(" · ");
  }
  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (hours > 0) parts.push(\`\${hours} 小时\`);
    if (minutes > 0 || hours > 0) parts.push(\`\${minutes} 分\`);
    parts.push(\`\${seconds} 秒\`);
    return parts.join(" ");
  }
  function soonestWaitMs() { return 0; }
  function scheduleWaitFlowModel({ confirming = false } = {}) {
    const waitMs = soonestWaitMs();
    const eta = waitMs > 0 ? \`约 \${formatCountdown(waitMs)}后继续\` : "";
    if (confirming) {
      return {
        label: "后台调度中",
        hint: "正在确认当前任务是否已启动，确认后开始执行。",
        status: "waiting", action: "", canStop: true,
        title: "后台正在调度，并确认页内任务是否已启动；确认后开始执行。需要全停时点右上角「暂停」。"
      };
    }
    return {
      label: "后台调度中",
      hint: eta ? \`等待下一项到期，\${eta}。\` : "等待下一项到期后自动切换。",
      status: "waiting", action: "", canStop: true,
      title: "后台正在调度；暂无到期任务，到期后会自动切换。需要全停时点右上角「暂停」。"
    };
  }
`

test('scheduled post formats reserve one fifth for text cards and compact posts keep blank lines', async () => {
  assert.deepEqual(poster.choosePostFormat(() => 0.19), { mediaMode: 'image', imageStyle: 'text-card', cardVariant: 'paper', lengthMode: 'regular' })
  assert.deepEqual([0, 1, 2, 3, 4].map((index) => poster.choosePostFormat(() => 0, index).cardVariant), ['paper', 'editorial', 'highlight', 'gradient', 'paper'])
  assert.deepEqual(Array.from(postImage.CARD_VARIANTS), ['paper', 'editorial', 'highlight', 'gradient'])
  assert.equal(poster.withPostFormat({ mediaMode: 'image', imageStyle: 'text-card', cardVariant: 'highlight', lengthMode: 'regular', text: '已保存稿' }).cardVariant, 'highlight')
  assert.equal(poster.withPostFormat({ mediaMode: 'image', imageStyle: 'text-card', lengthMode: 'regular', text: '旧待发稿' }).cardVariant, 'paper')
  assert.deepEqual(poster.choosePostFormat(() => 0.2), { mediaMode: 'text', lengthMode: 'compact' })
  assert.deepEqual(poster.choosePostFormat(() => 0.8), { mediaMode: 'text', lengthMode: 'regular' })
  assert.deepEqual(poster.choosePostFormat(() => 0.49, 0, 'premium'), { mediaMode: 'image', imageStyle: 'text-card', cardVariant: 'paper', lengthMode: 'regular' })
  assert.deepEqual(poster.choosePostFormat(() => 0.5, 0, 'premium'), { mediaMode: 'text', lengthMode: 'regular' })
  assert.deepEqual(poster.choosePostFormat(() => 0.99, 1, 'x'), { mediaMode: 'image', imageStyle: 'text-card', cardVariant: 'editorial', lengthMode: 'regular' })
  assert.equal(poster.withPostFormat({ text: '第一行判断。\n\n后面一句。', mediaMode: 'text' }, 'x').mediaMode, 'image')
  assert.equal(poster.withPostFormat({ text: '第一行判断。\n\n后面一句。', mediaMode: 'text' }, 'x').imageStyle, 'text-card')
  assert.deepEqual(Array.from(poster.PREMIUM_SLOT_TIMES), ['08:00', '09:30', '12:00', '15:00', '19:00'])
  assert.equal(poster.PREMIUM_DAILY_LIMIT, 5)
  assert.equal(postImage.cardHeadline('第一句说明新闻。\n\n第二句表态。'), '第一句说明新闻。')
  assert.equal(postImage.cardBody('第一句说明新闻。\n\n第二句表态。'), '第二句表态。')
  assert.equal(poster.formatCompactPost('具体事件发生了。\n自己的观点。\n一句短评。'), '具体事件发生了。\n\n自己的观点。\n\n一句短评。')
  const original = '这家店把常用商品价格又涨了一轮，附近不少老顾客开始换地方买，真没必要把熟客当成不会算账的人。'
  const compact = poster.formatCompactPost(original)
  assert.equal(compact.split('\n\n').length, 3)
  assert.equal(compact.replace(/\n/gu, ''), original)
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  assert.match(source, /imageStyle === "text-card"/)
  assert.match(source, /await attachPostImage\(existing, item\)/)
  assert.match(source, /if \(state\.imageStatus === "配图预览未确认"\) return "image-unconfirmed"/)
  assert.match(source, /if \(composerHasMedia\(\)\) \{/)
  assert.match(source, /POST_KIND_PREMIUM/)
  assert.match(source, /nextPremiumPostAt/)
})

test('premium posting skips missed slots instead of publishing the daily quota in a burst', async () => {
  assert.equal(poster.shanghaiDateKey(Date.parse('2026-10-27T10:00:00+08:00')), '2026-10-27')
  assert.equal(poster.nextPremiumPostAt(Date.parse('2026-10-27T07:00:00+08:00')), Date.parse('2026-10-27T08:00:00+08:00'))
  assert.equal(poster.nextPremiumPostAt(Date.parse('2026-10-27T08:00:00+08:00')), Date.parse('2026-10-27T08:00:00+08:00'))
  assert.equal(poster.nextPremiumPostAt(Date.parse('2026-10-27T08:30:00+08:00')), Date.parse('2026-10-27T09:30:00+08:00'))
  assert.equal(poster.nextPremiumPostAt(Date.parse('2026-10-27T18:00:00+08:00')), Date.parse('2026-10-27T19:00:00+08:00'))
  assert.equal(poster.nextPremiumPostAt(Date.parse('2026-10-27T19:30:00+08:00')), Date.parse('2026-10-28T08:00:00+08:00'))
  assert.equal(poster.nextPremiumPostAt(Date.parse('2026-10-27T19:00:00+08:00') + 1), Date.parse('2026-10-28T08:00:00+08:00'))
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  assert.match(source, /async function ensureSources\(\) \{[\s\S]*?if \(state\.postKind !== POST_KIND_PREMIUM\) state\.nextPostAt = 0;/)
  assert.match(source, /async function startNow\(\) \{[\s\S]*?state\.postKind === POST_KIND_PREMIUM/)
})

test('all text-card layouts render the headline and body into a PNG file', async () => {
  const draws = []
  const positions = []
  const canvas = {
    getContext: () => ({
      createLinearGradient: () => ({ addColorStop() {} }),
      fillRect() {}, beginPath() {}, roundRect() {}, rect() {}, arc() {}, fill() {},
      measureText: (value) => ({ width: value.length * 28 }),
      fillText: (value, _x, y) => { draws.push(value); positions.push(y) },
    }),
    toBlob: (done) => done({ size: 2000 }),
  }
  const sandbox = vm.createContext({
    document: { createElement: () => canvas },
    File: class { constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type } },
  })
  vm.runInContext(await readFile(new URL('postImage.js', extensionDir), 'utf8'), sandbox)
  for (const variant of postImage.CARD_VARIANTS) {
    draws.length = 0
    positions.length = 0
    const file = await sandbox.XInteractionPostImage.createPostCard('消息第一句。\n\n观点第二句。', '新闻话题', variant)
    assert.equal(file.type, 'image/png')
    assert.match(file.name, /^post-card-\d+\.png$/)
    assert.ok(draws.includes('新闻话题'))
    assert.ok(draws.includes('消息第一句。'))
    assert.ok(draws.includes('观点第二句。'))
    assert.ok(positions.every((y) => y >= 0 && y < 675))
    positions.length = 0
    await sandbox.XInteractionPostImage.createPostCard(`标题${'这是一条比较长的新闻描述'.repeat(8)}。\n\n正文${'这句话也很长'.repeat(20)}`, '新闻话题', variant)
    assert.ok(positions.every((y) => y >= 0 && y < 675))
  }
})

test('X theme cards draw exactly two centered lines', async () => {
  const drawn = []
  const canvas = {
    getContext: () => ({
      textAlign: 'left',
      createLinearGradient: () => ({ addColorStop() {} }),
      fillRect() {}, beginPath() {}, roundRect() {}, rect() {}, arc() {}, fill() {},
      measureText: (value) => ({ width: Array.from(String(value)).length * 40 }),
      fillText(value, x) { drawn.push({ value, x, align: this.textAlign }) },
    }),
    toBlob: (done) => done({ size: 2000 }),
  }
  const sandbox = vm.createContext({
    document: { createElement: () => canvas },
    File: class { constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type } },
  })
  vm.runInContext(await readFile(new URL('postImage.js', extensionDir), 'utf8'), sandbox)
  await sandbox.XInteractionPostImage.createPostCard('第一行判断。\n\n第二行看法。', '星链', 'paper', { align: 'center' })
  const lines = drawn.filter((item) => item.value === '第一行判断。' || item.value === '第二行看法。')
  assert.equal(lines.length, 2)
  assert.ok(lines.every((item) => item.align === 'center' && item.x === 600))
})

test('automation retries wait 10, 20, 30 minutes and keep increasing', () => {
  assert.deepEqual([1, 2, 3, 4].map(loop.automationCooldownMs), [600000, 1200000, 1800000, 2400000])
})

test('follow and post tasks stay active while their automation cooldown grows', async () => {
  for (const filename of ['mutual.js', 'poster.js']) {
    const source = await readFile(new URL(filename, extensionDir), 'utf8')
    const helper = source.match(/  function coolDownForRisk\(\) \{[\s\S]*?\n  \}/)?.[0]
    assert.ok(helper)
    const state = { running: true, stopping: false, mode: 'unfollow', riskCooldownUntil: 0, riskRetries: 0, cooldownUntil: 0, nextPostAt: 0 }
    const sandbox = vm.createContext({
      state, root: { XReplyClipboardLoop: loop }, Date: { now: () => 1000 },
      sessionStorage: { setItem() {} }, emit() {}, reportMutualAction() {}, formatClock: () => '10:00', savePublishList() {},
    })
    vm.runInContext(`${helper}\nglobalThis.cool = coolDownForRisk`, sandbox)
    assert.equal(sandbox.cool(), true)
    assert.equal(state.running, true)
    assert.equal(state.riskCooldownUntil, 601000)
    assert.equal(sandbox.cool(), false)
    state.riskCooldownUntil = 0
    assert.equal(sandbox.cool(), true)
    assert.equal(state.riskCooldownUntil, 1201000)
  }
})

test('follow risk retry count restores from extension storage after its tab closes', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const reset = source.match(/  async function reset\(mode, onUpdate\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(reset)
  const now = Date.now()
  const state = { seenHandles: new Set(), skippedHandles: new Set(), acknowledgedRateLimits: new Set() }
  const context = vm.createContext({
    state,
    Date: { now: () => now },
    followStorage: () => ({ async get() { return { 'xrcMutualRisk:unfollow': { until: now + 1200000, retries: 2, updatedAt: now } } } }),
    sessionStorage: { getItem() { return null } },
  })
  vm.runInContext(`${reset}\nglobalThis.restoreRisk = reset`, context)
  await context.restoreRisk('unfollow', () => {})
  assert.equal(state.riskRetries, 2)
  assert.equal(state.riskCooldownUntil, now + 1200000)
})

test('reply and post pace controls use one compact row with accessible choices', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(source, /xrc-speed-section xrc-pace-row/)
  assert.match(source, /xrc-round-pace xrc-pace-row/)
  assert.match(source, /<button type="button" data-xrc-post-pace-label="\$\{item\.id\}" aria-pressed="false">/)
  assert.match(source, /<button type="button" data-xrc-pace-label="\$\{item\.id\}" aria-pressed="false">/)
  assert.match(source, /label\.setAttribute\("aria-pressed", String\(active\)\)/)
  assert.match(source, /label\.disabled = replyPaceLocked/)
  assert.match(source, /label\.disabled = Boolean\(poster\.running\)/)
  assert.doesNotMatch(source, /data-xrc-pace aria-label="频率挡位"/)
  assert.match(css, /\.xrc-pace-row \{\s*display: flex;/)
  assert.match(css, /\.xrc-pace-options \{\s*display: grid;/)
  assert.match(css, /\.xrc-pace-options::before \{[\s\S]*?right: 12\.5%;[\s\S]*?left: 12\.5%;[\s\S]*?height: 2px;/)
  assert.match(css, /\.xrc-pace-options button \{[\s\S]*?position: relative;[\s\S]*?background: #fff;/)
})

test('task window hints distinguish opening, jumping, and current window', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const groupDefinition = source.match(/  function taskGroupTarget\(group,[\s\S]*?\n  \}/)?.[0]
  const titleDefinition = source.match(/  function taskWindowTitle\(mode,[\s\S]*?\n  \}/)?.[0]
  const deskDefinition = source.match(/  function scheduleDashboardActive\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(groupDefinition)
  assert.ok(titleDefinition)
  assert.ok(deskDefinition)
  const context = vm.createContext({
    TASK_GROUP_MODES: { reply: ['timeline', 'notifications'], likes: ['likes-posts', 'likes-replies'] },
    TASK_MODE_LABELS: { timeline: '评论首页', notifications: '评论回复', 'likes-posts': '点赞帖子' },
    openTaskTabs: {},
    taskSchedule: { enabled: false },
    pluginRuntime: { tasks: {} },
    currentTaskKey: () => 'timeline',
  })
  vm.runInContext(`${deskDefinition}\n${groupDefinition}\n${titleDefinition}\nglobalThis.target = taskGroupTarget; globalThis.title = taskWindowTitle`, context)
  assert.equal(context.title('notifications', {}, 'timeline'), '打开评论回复窗口')
  assert.equal(context.title('notifications', { notifications: 42 }, 'timeline'), '跳转到已打开的评论回复窗口')
  assert.equal(context.title('timeline', { timeline: 12 }, 'timeline'), '当前评论首页窗口')
  context.taskSchedule.enabled = true
  assert.equal(context.title('notifications', {}, 'timeline'), '查看评论回复详情，不改变排班')
  context.taskSchedule.enabled = false
  const target = context.target('reply', { timeline: 12, notifications: 42 }, 'timeline', { notifications: { phase: 'running' } })
  assert.equal(target.mode, 'notifications')
  assert.equal(target.openedElsewhere, true)
  assert.equal(context.target('reply', { timeline: 12 }, 'timeline', {}).openedElsewhere, false)
  assert.match(source, /button\.title = taskTabHint\(button\.dataset\.xrcReplyTab\)/)
  assert.match(source, /button\.title = taskTabHint\(`likes-\$\{button\.dataset\.xrcLikeTab\}`\)/)
})

test('task window state drops closed tabs before showing jump hints', async () => {
  const previousChrome = globalThis.chrome
  let saved = { timeline: 12, notifications: 42 }
  globalThis.chrome = {
    storage: { session: {
      async get() { return { xrcTaskTabs: saved } },
      async set(value) { saved = value.xrcTaskTabs },
    } },
    tabs: { async get(tabId) {
      if (tabId === 42) throw new Error('No tab')
      return { id: tabId }
    } },
  }
  try {
    const result = await background.getOpenTaskTabs()
    assert.deepEqual(result.tabs, { timeline: 12 })
    assert.deepEqual(saved, { timeline: 12 })
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('local extension update waits for idle tasks, then reloads registered X tabs once', async () => {
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const contentSource = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(backgroundSource, /importScripts\("receipt\.js", "devUpdate\.js"\)/)
  assert.match(backgroundSource, /XrcLocalDevUpdate\?\.install\?\.\(\{ readRuntime: readPluginRuntime, taskTabs: getOpenTaskTabs \}\)/)
  assert.match(contentSource, /data-xrc-dev-update/)
  assert.match(contentSource, /data-xrc-dev-update-now/)
  assert.match(contentSource, /xrc-dev-update-apply/)
  assert.match(backgroundSource, /xrc-dev-update-apply/)
  const values = {}
  const reloadedTabs = []
  const badges = []
  let installed = '3.29.3'
  let extensionReloads = 0
  let busy = true
  const chromeApi = {
    runtime: {
      getManifest: () => ({ version: installed }),
      getURL: (path) => `chrome-extension://test/${path}`,
      reload: () => { extensionReloads += 1 },
    },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText(value) { badges.push(value.text) }, async setBadgeBackgroundColor() {} },
    tabs: {
      async get(id) { return { id, url: id === 7 ? 'https://x.com/home' : 'https://example.com/' } },
      async reload(id) { reloadedTabs.push(id) },
    },
  }
  const args = {
    chromeApi,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.30.0' }) }),
    readRuntime: async () => ({ tasks: busy ? { timeline: { tabId: 7 } } : {}, flow: { phase: busy ? 'running' : 'idle' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, poster: 8 } }),
    reload: () => { extensionReloads += 1 },
  }
  assert.equal(devUpdate.compareVersions('3.30.0', '3.29.3'), 1)
  assert.equal((await devUpdate.check({ ...args, now: 1000 })).phase, 'available')
  assert.equal((await devUpdate.check({ ...args, now: 62000 })).phase, 'waiting')
  assert.equal(extensionReloads, 0)
  busy = false
  assert.equal((await devUpdate.check({ ...args, now: 63000 })).phase, 'applying')
  assert.equal(extensionReloads, 1)
  installed = '3.30.0'
  assert.equal(await devUpdate.finishReload(chromeApi, 64000), true)
  assert.deepEqual(reloadedTabs, [7])
  assert.equal(values[devUpdate.RELOAD_KEY], undefined)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'updated')
  assert.ok(badges.includes('NEW'))
  assert.equal(badges.at(-1), '')
})

test('failed local extension reload does not repeatedly restart Chrome tasks', async () => {
  const values = { [devUpdate.RELOAD_KEY]: { version: '3.30.0', at: 1000, tabs: [7] } }
  let reloads = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.29.3' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), false)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'failed')
  const result = await devUpdate.check({
    chromeApi, now: 3000,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.30.0' }) }),
    readRuntime: async () => ({ tasks: {} }), taskTabs: async () => ({ tabs: {} }),
    reload: () => { reloads += 1 },
  })
  assert.equal(result.phase, 'failed')
  assert.equal(reloads, 0)
})

test('a failed version switch still attempts to restore tasks that were stopped for the update', async () => {
  const values = { [devUpdate.RELOAD_KEY]: { version: '3.32.6', at: 1000, tabs: [7], resumeModes: { 7: 'timeline' } } }
  const resumes = {}
  const reloaded = []
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.5' }) },
    storage: {
      local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) }, async remove(key) { delete values[key] } },
      session: { async set(value) { Object.assign(resumes, value) } },
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: { async get(id) { return { id, url: 'https://x.com/home' } }, async reload(id) { reloaded.push(id) } },
  }
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), false)
  assert.deepEqual(reloaded, [7])
  assert.equal(resumes['xrcPendingTab:7'].start, true)
  assert.match(values[devUpdate.STATUS_KEY].error, /已尝试恢复原任务/)
})

test('manual local update waits for active tasks instead of interrupting them', async () => {
  const values = {}
  let reloads = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.31.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.applyNow({
    chromeApi,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.0' }) }),
    readRuntime: async () => ({ tasks: { timeline: { tabId: 7, phase: 'running' }, 'likes-posts': { tabId: 8, phase: 'paused' } }, flow: { phase: 'running' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, notifications: 8 } }),
    now: () => 1000,
    reload: () => { reloads += 1 },
  })
  assert.equal(result.ok, true)
  assert.equal(result.phase, 'waiting')
  assert.equal(reloads, 0)
  assert.equal(values[devUpdate.RELOAD_KEY], undefined)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'waiting')
  assert.equal((await devUpdate.check({
    chromeApi, now: 62000,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.0' }) }),
    readRuntime: async () => ({ tasks: {}, flow: { phase: 'idle' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, notifications: 8 } }),
    reload: () => { reloads += 1 },
  })).phase, 'applying')
  assert.equal(reloads, 1)
})

test('manual update stops active tasks, reloads the extension, and restores only previously active modes', async () => {
  const values = {}
  const resumes = {}
  const reloaded = []
  const navigated = []
  let active = true
  let stops = 0
  let reloads = 0
  let installed = '3.32.5'
  const chromeApi = {
    runtime: { getManifest: () => ({ version: installed }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: {
      local: {
        async get(key) { return { [key]: values[key] } },
        async set(value) { Object.assign(values, value) },
        async remove(key) { delete values[key] },
      },
      session: { async set(value) { Object.assign(resumes, value) } },
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: {
      async get(id) { return { id, url: id === 8 ? 'https://x.com/notifications' : 'https://x.com/home' } },
      async reload(id) { reloaded.push(id) },
      async update(id, options) { navigated.push([id, options.url]) },
    },
  }
  const result = await devUpdate.applyNow({
    chromeApi, force: true,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.6' }) }),
    readRuntime: async () => ({ tasks: active ? { timeline: { tabId: 7, phase: 'running' }, 'likes-posts': { tabId: 8, phase: 'paused' } } : {}, flow: { phase: active ? 'running' : 'paused' } }),
    taskTabs: async () => ({ tabs: { timeline: 7, 'likes-posts': 8, poster: 9 } }),
    stopTasks: async () => { stops += 1; active = false; values.xrcPluginRuntime = { startedAt: null, tasks: {}, flow: { phase: 'paused' } }; return { ok: true } },
    now: () => 1000,
    reload: () => { reloads += 1 },
  })
  assert.equal(result.phase, 'applying')
  assert.equal(stops, 1)
  assert.equal(reloads, 1)
  assert.deepEqual(values[devUpdate.RELOAD_KEY].resumeModes, { 7: 'timeline', 8: 'likes-posts' })
  assert.deepEqual(values[devUpdate.RELOAD_KEY].tabs, [7, 8, 9])
  installed = '3.32.6'
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), true)
  assert.equal(values.xrcPluginRuntime.flow.phase, 'idle')
  assert.deepEqual(reloaded, [7, 9])
  assert.deepEqual(navigated, [[8, 'https://x.com/home']])
  assert.equal(resumes['xrcPendingTab:7'].start, true)
  assert.equal(resumes['xrcPendingTab:8'].start, true)
  assert.equal(resumes['xrcPendingTab:9'], undefined)
})

test('manual update restores stopped tasks if it cannot prepare the new version', async () => {
  const values = {}
  const resumes = {}
  const reloaded = []
  let active = true
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.5' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: {
      local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) }, async remove(key) { delete values[key] } },
      session: { async set(value) { Object.assign(resumes, value) } },
    },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: { async get(id) { return { id, url: 'https://x.com/home' } }, async reload(id) { reloaded.push(id) } },
  }
  const result = await devUpdate.applyNow({
    chromeApi, force: true,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.6' }) }),
    readRuntime: async () => ({ tasks: active ? { timeline: { tabId: 7, phase: 'running' } } : {}, flow: { phase: active ? 'running' : 'paused' } }),
    stopTasks: async () => { active = false; return { ok: true } },
    taskTabs: async () => { throw new Error('任务窗口读取失败') },
    now: () => 1000,
  })
  assert.equal(result.ok, false)
  assert.deepEqual(reloaded, [7])
  assert.equal(resumes['xrcPendingTab:7'].start, true)
  assert.match(result.error, /已尝试恢复原任务/)
})

test('version check marks the installed local version as latest', async () => {
  const values = {}
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.6' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) } } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.check({
    chromeApi, now: 1000,
    fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.6' }) }),
  })
  assert.equal(result, null)
  assert.deepEqual(values[devUpdate.STATUS_KEY], { version: '3.32.6', phase: 'latest', at: 1000 })
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /data-xrc-version-badge data-state="checking"/)
  assert.match(source, /badge\.textContent = newer \? "有新版本"[^\n]*"最新版"/)
  assert.match(source, /button\.hidden = phase === "updated" \|\| phase === "latest"/)
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(backgroundSource, /stopTasks: pauseAllTasks,[\s\S]*?force: true/)
})

test('manual local update leaves tasks running when no newer version exists', async () => {
  let stops = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: { async get() { return {} }, async set() {} } },
  }
  const result = await devUpdate.applyNow({
    chromeApi, fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.0' }) }),
    readRuntime: async () => ({}), taskTabs: async () => ({}), stopTasks: async () => { stops += 1 },
  })
  assert.equal(result.ok, false)
  assert.equal(stops, 0)
  assert.match(result.error, /没有比当前扩展更新的版本/)
})

test('manual local update reloads immediately when all tasks are idle', async () => {
  const values = {}
  let reloads = 0
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.applyNow({
    chromeApi, fetchApi: async () => ({ ok: true, json: async () => ({ version: '3.32.1' }) }),
    readRuntime: async () => ({ tasks: {}, flow: { phase: 'idle' } }),
    taskTabs: async () => ({ tabs: { timeline: 7 } }),
    now: () => 1000, reload: () => { reloads += 1 },
  })
  assert.equal(result.phase, 'applying')
  assert.equal(reloads, 1)
  assert.deepEqual(values[devUpdate.RELOAD_KEY], { version: '3.32.1', at: 1000, tabs: [7], resumeModes: {}, resumeSchedule: false })
})

test('manual local update restores the single-tab schedule after reloading', async () => {
  const values = { xrcTaskSchedule: { enabled: true, strategyVersion: 4, current: 'timeline', workTabId: 7, items: {} } }
  let runtime = { tasks: { timeline: { tabId: 7, phase: 'running' } }, flow: { phase: 'running' } }
  const reloaded = []
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '4.0.0' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: {
      local: { async get(key) { return { [key]: values[key] } }, async set(value) { Object.assign(values, value) }, async remove(key) { delete values[key] } },
      session: { async set() {} },
    },
    tabs: { async get(id) { return { id, url: 'https://x.com/home' } }, async reload(id) { reloaded.push(id) } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
  }
  const result = await devUpdate.applyNow({
    chromeApi, fetchApi: async () => ({ ok: true, json: async () => ({ version: '4.0.1' }) }),
    readRuntime: async () => runtime, taskTabs: async () => ({ tabs: { timeline: 7 } }),
    stopTasks: async () => { values.xrcTaskSchedule.enabled = false; runtime = { tasks: {}, flow: { phase: 'paused' } }; return { ok: true } },
    force: true, now: () => 1000, reload: () => {},
  })
  assert.equal(result.phase, 'applying')
  assert.equal(values[devUpdate.RELOAD_KEY].resumeSchedule, true)
  assert.deepEqual(values[devUpdate.RELOAD_KEY].resumeModes, {})
  chromeApi.runtime.getManifest = () => ({ version: '4.0.1' })
  assert.equal(await devUpdate.finishReload(chromeApi, 1500), true)
  assert.equal(values.xrcTaskSchedule.enabled, true)
  assert.deepEqual(reloaded, [7])
})

test('local update refreshes task tabs with resume intents without pausing them', async () => {
  const values = { [devUpdate.RELOAD_KEY]: { version: '3.32.1', at: 1000, tabs: [7, 8], resumeModes: { 7: 'timeline', 8: 'likes-posts' } } }
  const resumes = {}
  const reloaded = []
  const navigated = []
  const chromeApi = {
    runtime: { getManifest: () => ({ version: '3.32.1' }), getURL: (path) => `chrome-extension://test/${path}` },
    storage: { local: {
      async get(key) { return { [key]: values[key] } },
      async set(value) { Object.assign(values, value) },
      async remove(key) { delete values[key] },
    }, session: { async set(value) { Object.assign(resumes, value) } } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    tabs: {
      async get(id) { return { id, url: id === 7 ? 'https://x.com/home' : 'https://x.com/notifications' } },
      async reload(id) { reloaded.push(id) },
      async update(id, options) { navigated.push([id, options.url]) },
    },
  }
  assert.equal(await devUpdate.finishReload(chromeApi, 2000), true)
  assert.deepEqual(reloaded, [7])
  assert.deepEqual(navigated, [[8, 'https://x.com/home']])
  assert.deepEqual(resumes['xrcPendingTab:7'], { mode: 'timeline', path: '/home', start: true, at: 2000 })
  assert.deepEqual(resumes['xrcPendingTab:8'], { mode: 'likes-posts', path: '/home', start: true, at: 2000 })
  assert.equal(values[devUpdate.RELOAD_KEY], undefined)
  assert.equal(values[devUpdate.STATUS_KEY].phase, 'updated')
})

test('task close only removes the registered window shown by the arrow', async () => {
  const previousChrome = globalThis.chrome
  let tabs = { timeline: 11, notifications: 22, 'likes-posts': 33 }
  let runtime = { startedAt: 1, tasks: { timeline: { tabId: 11 }, notifications: { tabId: 22 } }, flow: { phase: 'running' } }
  let schedule = { enabled: false, items: {} }
  const removed = []
  globalThis.chrome = {
    storage: {
      session: {
        async get() { return { xrcTaskTabs: tabs } },
        async set(value) { tabs = value.xrcTaskTabs },
      },
      local: {
        async get() { return { xrcPluginRuntime: runtime, xrcTaskSchedule: schedule } },
        async set(value) {
          if (value.xrcPluginRuntime) runtime = value.xrcPluginRuntime
          if (value.xrcTaskSchedule) schedule = value.xrcTaskSchedule
        },
      },
    },
    tabs: {
      async remove(tabId) { removed.push(tabId) },
    },
  }
  try {
    await assert.rejects(background.closeTaskTab('notifications', 99, { tab: { id: 11 } }), /任务窗口已变化/)
    await assert.rejects(background.closeTaskTab('timeline', 11, { tab: { id: 11 } }), /不能从当前任务窗口关闭自己/)
    assert.deepEqual(removed, [])
    const result = await background.closeTaskTab('notifications', 22, { tab: { id: 11 } })
    assert.equal(result.closed, true)
    assert.deepEqual(removed, [22])
    assert.deepEqual(tabs, { timeline: 11, 'likes-posts': 33 })
    assert.equal(runtime.tasks.notifications, undefined)
    assert.deepEqual(runtime.tasks.timeline, { tabId: 11 })
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('each concrete task tab owns its own jump and close control', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  for (const [attribute, mode] of [
    ['reply', 'timeline'], ['reply', 'notifications'],
    ['like', 'posts'], ['like', 'replies'],
    ['mutual', 'unfollow'], ['mutual', 'followBack'],
  ]) {
    assert.match(source, new RegExp(`<div class="xrc-subtask-slot"><button[^>]*data-xrc-${attribute}-tab="${mode}"[^>]*>[\\s\\S]*?<\\/button><button class="xrc-task-tab-close"[^>]*data-xrc-task-close`))
  }
  assert.doesNotMatch(source, /data-xrc-task-close="(reply|likes|mutual|poster)"/)
  assert.match(source, /close\.dataset\.xrcTargetMode = openedElsewhere \? mode : ""/)
  assert.match(source, /close\.dataset\.xrcTargetTabId = openedElsewhere \? String\(tabId\) : ""/)
  assert.match(css, /\.xrc-subtask-slot\.is-open button\[role="tab"\]::after \{[\s\S]*?content: "↗"/)
  assert.match(css, /\.xrc-subtask-slot\.is-open:hover \.xrc-task-tab-close/)
  assert.doesNotMatch(source, /xrc-open-mark|xrc-close-mark/)
})

test('settings hub page toggles as a dedicated overlay instead of a fold-down header menu', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const definition = source.match(/  function syncHubPage\(panel\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const hub = { hidden: true }
  const toggle = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value } }
  const panel = { querySelector(selector) { return {
    '[data-xrc-hub]': hub,
    '[data-xrc-hub-open]': toggle,
  }[selector] } }
  const context = vm.createContext({ hubOpen: true })
  vm.runInContext(`${definition}\nglobalThis.sync = syncHubPage`, context)
  context.sync(panel)
  assert.equal(hub.hidden, false)
  assert.equal(toggle.attributes['aria-expanded'], 'true')
  context.hubOpen = false
  context.sync(panel)
  assert.equal(hub.hidden, true)
  assert.equal(toggle.attributes['aria-expanded'], 'false')
  assert.match(source, /data-xrc-hub hidden aria-label="设置中心"/)
  assert.match(source, /data-xrc-hub-open[^>]*aria-label="设置中心"/)
  assert.doesNotMatch(source, /data-xrc-header-menu|data-xrc-actions-toggle/)
  assert.match(css, /\.xrc-hub \.xrc-menu-grid/)
  assert.doesNotMatch(css, /xrc-header-menu|xrc-actions-toggle/)
})

test('flow overview distinguishes executing, waiting, missing, and stale tasks', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '普通发帖'], ['poster-premium', '精品发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    taskSchedule: { enabled: false, items: {} },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${definition}\nglobalThis.overview = flowTaskOverview`, context)
  const now = Date.now()
  const result = context.overview({ tasks: {
    timeline: { phase: 'running', updatedAt: now - 1000 },
    notifications: { phase: 'paused', updatedAt: now - 1000 },
    'mutual-unfollow': { phase: 'running', updatedAt: now - 91000 },
    poster: { phase: 'running', updatedAt: now - 1000 },
  } }, now)
  assert.deepEqual(JSON.parse(JSON.stringify(result.counts)), { running: 2, waiting: 1, missing: 4, stopping: 0, unknown: 1, blocked: 0 })
  assert.equal(result.text, '2 项运行中 · 1 项等待中 · 1 项需处理 · 4 项已停止')
  assert.match(source, /data-xrc-flow-overview hidden/)
  assert.match(source, /if \(overview\) overview\.hidden = false/)
  assert.match(source, /Date\.now\(\) - Number\(task\.updatedAt \|\| 0\) < 30000/)
})

test('schedule-enabled idle and gap-wait tasks face as waiting, not stopped', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const pulse = source.match(/  function scheduleItemPulse\(mode, preview, overviewTask\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition && pulse)
  const now = Date.now()
  const modes = ['notifications', 'timeline', 'poster-premium', 'poster', 'likes-posts', 'likes-replies', 'mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow']
  const context = vm.createContext({
    FLOW_TASKS: modes.map((mode) => [mode, mode]),
    FLOW_STALE_MS: 90000,
    taskSchedule: {
      enabled: true,
      current: 'timeline',
      items: {
        'likes-posts': { manualStopped: true, reason: '本次 3 轮已完成，等待下次排班', resumeAt: now + 45 * 60000 },
        poster: { manualStopped: true, reason: '已手动停止' },
        'likes-replies': { manualStopped: true, reason: '已手动停止' },
      },
      rules: Object.fromEntries(modes.map((mode) => [mode, { enabled: true, priority: 5 }])),
      timeline: { future: modes.filter((mode) => mode !== 'timeline').map((mode) => ({ mode, status: 'scheduled', readyAt: now + 60000 })) },
    },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${definition}\n${pulse}\nglobalThis.overview = flowTaskOverview; globalThis.pulse = scheduleItemPulse`, context)
  const result = context.overview({ tasks: {
    timeline: { phase: 'running', updatedAt: now },
  } }, now)
  assert.equal(result.counts.running, 1)
  assert.equal(result.counts.missing, 2)
  assert.equal(result.counts.waiting, 6)
  assert.equal(result.text, '1 项运行中 · 6 项等待中 · 2 项已停止')
  assert.equal(result.tasks.find((task) => task.key === 'likes-posts').status, 'waiting')
  assert.equal(result.tasks.find((task) => task.key === 'notifications').status, 'waiting')
  assert.equal(result.tasks.find((task) => task.key === 'poster').status, 'missing')
  assert.equal(context.pulse('likes-posts', { current: 'timeline' }, { status: 'waiting' }), 'waiting')
  assert.equal(context.pulse('poster', { current: 'timeline' }, { status: 'missing' }), 'stopped')
  assert.equal(context.pulse('notifications', { current: 'timeline' }, { status: 'waiting' }), 'waiting')
})

test('flow detail dialog lists all seven tasks using the overview statuses', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const readable = source.match(/  function readableTaskLimitReason\(reason\) \{[\s\S]*?\n  \}/)?.[0]
  const cardNoteHelpers = [
    source.match(/  const DEFAULT_SCHEDULE_PRIORITY = Object\.freeze\(\{[\s\S]*?\}\);/)?.[0],
    source.match(/  function schedulePriorityFor\(mode, rule\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function schedulePriorityLabel\(priority\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function scheduleWindowLabel\(window\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function schedulePaceLabel\(minGapMs\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function isRedundantScheduleDetail\(label, detail\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function joinScheduleFields\(entries\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function formatScheduleCardNote\(task, wait\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function formatDeskPastNote\(latest\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function formatDeskDispatchNote\(\{ nextEntry, preview, waitMs \}\) \{[\s\S]*?\n  \}/)?.[0],
  ].join('\n')
  const waitInfo = source.match(/  function scheduledWaitInfo\(mode, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const readiness = source.match(/  function scheduleReadinessAt\(mode, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const details = source.match(/  function paintFlowDetails\(panel = document\.getElementById\(PANEL_ID\)\) \{[\s\S]*?\n  \}/)?.[0]
  const schedulePreview = source.match(/  function schedulePreview\(now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const taskActionCount = source.match(/  function taskActionCount\(mode, count\) \{[\s\S]*?\n  \}/)?.[0]
  const scheduleHistory = source.match(/  function paintScheduleHistory\(panel = document\.getElementById\(PANEL_ID\)\) \{[\s\S]*?\n  \}/)?.[0]
  const scheduleBoard = source.match(/  function paintScheduleBoard\(dialog\) \{[\s\S]*?\n  \}/)?.[0]
  const scheduleDesk = source.match(/  function paintScheduleDesk\(panel = document\.getElementById\(PANEL_ID\)\) \{[\s\S]*?\n  \}/)?.[0]
  const schedulePulse = source.match(/  function scheduleItemPulse\(mode, preview, overviewTask\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && readable && cardNoteHelpers.includes('formatScheduleCardNote') && waitInfo && readiness && details && schedulePreview && taskActionCount && scheduleHistory && scheduleBoard && scheduleDesk && schedulePulse)
  assert.match(source, /Who is ready soonest becomes/)
  assert.match(source, /Title stays「正在调度中」/)
  assert.match(source, /deskOwnsCountdown/)
  assert.match(css, /当前最重（绿，含「正在调度中」）/)
  assert.match(css, /never paint「当前」green cards yellow/)
  assert.match(css, /须写在 pulse 之后/)
  assert.match(css, /Empty hint row used to leave a blank band/)
  assert.match(css, /same 12px gap above and below the status line/)
  const list = { replaceChildren(...children) { this.children = children } }
  const total = { textContent: '' }
  const makeNode = () => {
    const node = {
      className: '',
      title: '',
      tabIndex: 0,
      dataset: {},
      children: [],
      get textContent() {
        return this.children.length
          ? this.children.map((child) => child.textContent || '').join('')
          : this._text || ''
      },
      set textContent(value) {
        this.children = []
        this._text = String(value ?? '')
      },
      setAttribute(name, value) { this[name] = value },
      replaceChildren(...children) {
        this.children = []
        this._text = ''
        this.append(...children)
      },
      append(...children) {
        for (const child of children) {
          if (typeof child === 'string') {
            const text = makeNode()
            text.textContent = child
            text.parentNode = this
            this.children.push(text)
            continue
          }
          child.parentNode = this
          this.children.push(child)
        }
      },
      appendChild(child) {
        if (child.parentNode) {
          const siblings = child.parentNode.children
          const at = siblings.indexOf(child)
          if (at >= 0) siblings.splice(at, 1)
        }
        child.parentNode = this
        this.children.push(child)
        return child
      },
      insertBefore(child, reference) {
        if (child.parentNode) {
          const siblings = child.parentNode.children
          const at = siblings.indexOf(child)
          if (at >= 0) siblings.splice(at, 1)
        }
        child.parentNode = this
        if (!reference) this.children.push(child)
        else {
          const at = this.children.indexOf(reference)
          this.children.splice(at < 0 ? this.children.length : at, 0, child)
        }
        return child
      },
      remove() {
        if (!this.parentNode) return
        const siblings = this.parentNode.children
        const at = siblings.indexOf(this)
        if (at >= 0) siblings.splice(at, 1)
        this.parentNode = null
      },
      replaceWith(next) {
        if (!this.parentNode) return
        const siblings = this.parentNode.children
        const at = siblings.indexOf(this)
        if (at >= 0) siblings.splice(at, 1, next)
        next.parentNode = this.parentNode
        this.parentNode = null
      },
      querySelector(selector) {
        const walk = (items) => {
          for (const item of items) {
            if (selector === '.xrc-schedule-item-body strong' && item.tagName === 'STRONG') return item
            if (selector === '.xrc-schedule-item-body small' && item.tagName === 'SMALL') return item
            if (selector === '.xrc-schedule-item-status' && item.className === 'xrc-schedule-item-status') return item
            if (selector === '.xrc-schedule-item-side' && item.className === 'xrc-schedule-item-side') return item
            if (selector === '[data-xrc-focus-execution]' && item.dataset?.xrcFocusExecution) return item
            if (item.className === 'xrc-schedule-item-body' || item.className === 'xrc-schedule-item-side') {
              const nested = walk(item.children || [])
              if (nested) return nested
            }
            const nested = walk(item.children || [])
            if (nested) return nested
          }
          return null
        }
        return walk(this.children || [])
      },
    }
    return node
  }
  const scheduleList = {
    children: [],
    querySelectorAll(selector) {
      if (selector !== '.xrc-schedule-item') return []
      return this.children.filter((item) => item.className === 'xrc-schedule-item')
    },
    insertBefore(child, reference) {
      if (child.parentNode) {
        const siblings = child.parentNode.children
        const at = siblings.indexOf(child)
        if (at >= 0) siblings.splice(at, 1)
      }
      child.parentNode = this
      if (!reference) this.children.push(child)
      else {
        const at = this.children.indexOf(reference)
        this.children.splice(at < 0 ? this.children.length : at, 0, child)
      }
      return child
    },
  }
  const historyList = { replaceChildren(...children) { this.children = children } }
  const deskPast = { textContent: '' }
  const deskPastRow = { hidden: false }
  const deskNow = { textContent: '' }
  const deskNowNote = { textContent: '' }
  const deskNowStatus = { textContent: '' }
  const deskNowRow = { hidden: true, dataset: { pulse: 'waiting' } }
  const board = { querySelector(selector) {
    return selector === '[data-xrc-schedule-list]' ? scheduleList
      : selector === '[data-xrc-schedule-history]' ? historyList
      : null
  } }
  const desk = { querySelector(selector) {
    return selector === '[data-xrc-desk-past]' ? deskPast
      : selector === '[data-xrc-desk-past-row]' ? deskPastRow
      : selector === '[data-xrc-desk-now]' ? deskNow
      : selector === '[data-xrc-desk-now-note]' ? deskNowNote
      : selector === '[data-xrc-desk-now-status]' ? deskNowStatus
      : selector === '[data-xrc-desk-now-row]' ? deskNowRow
      : selector === '[data-xrc-schedule-board]' ? board
      : null
  } }
  const dialog = { hidden: false, querySelector(selector) {
    return selector === '[data-xrc-flow-details-list]' ? list
      : selector === '[data-xrc-flow-details-total]' ? total
      : selector === '[data-xrc-schedule-board]' ? board
      : null
  } }
  const panel = { querySelector(selector) {
    return selector === '[data-xrc-schedule-desk]' ? desk
      : selector === '[data-xrc-flow-details]' ? dialog
      : dialog
  } }
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: [['notifications', '评论回复'], ['timeline', '评论首页'], ['poster-premium', '精品发帖'], ['poster', '普通发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论'], ['mutual-followBack', '回关粉丝'], ['mutual-targetFollow', '关注候选'], ['mutual-unfollow', '清理未回关']],
    FLOW_STALE_MS: 90000,
    TASK_MODE_LABELS: { timeline: '评论首页', notifications: '评论回复', 'mutual-targetFollow': '关注候选' },
    scheduleLoaded: true,
    deskHome: true,
    selectedTaskMode: 'timeline',
    validTaskKey: (mode) => mode || 'timeline',
    formatClock: () => '01:00',
    formatScheduleTime: () => '10/28 22:57',
    taskSchedule: { enabled: false, items: {} },
    pluginRuntime: { flow: { phase: 'running' }, tasks: {
      timeline: { phase: 'running', updatedAt: now },
      notifications: { phase: 'paused', updatedAt: now },
      poster: { phase: 'running', updatedAt: now - 91000 },
    } },
    PANEL_ID: 'x-reply-clipboard-panel',
    document: {
      getElementById() { return null },
      createElement(tag) {
        const node = makeNode()
        node.tagName = String(tag || 'div').toUpperCase()
        return node
      },
      createTextNode(value) {
        const node = makeNode()
        node.tagName = '#TEXT'
        node.textContent = String(value ?? '')
        return node
      },
    },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${readable}\n${cardNoteHelpers}\n${waitInfo}\n${readiness}\n${schedulePreview}\n${taskActionCount}\n${schedulePulse}\n${scheduleHistory}\n${scheduleBoard}\n${scheduleDesk}\n${details}\nglobalThis.paint = paintFlowDetails; globalThis.countLabel = taskActionCount`, context)
  // USER_STATE_HELPERS stubs soonestWaitMs to 0; desk countdown needs a real wait.
  context.soonestWaitMs = () => 451000
  assert.equal(context.countLabel('timeline', 12), '12 条回复')
  assert.equal(context.countLabel('notifications', 3), '3 条回复')
  assert.equal(context.countLabel('likes-posts', 4), '4 个点赞')
  assert.equal(context.countLabel('likes-replies', 5), '5 个点赞')
  context.paint(panel)
  assert.equal(list.children.length, 9)
  assert.deepEqual(Array.from(list.children, (row) => row.children[3].dataset.xrcFlowTaskOpen), ['notifications', 'timeline', 'poster-premium', 'poster', 'likes-posts', 'likes-replies', 'mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow'])
  assert.equal(list.children[0].children[3].textContent, '进入')
  assert.equal(list.children[0].children[0].textContent, '评论回复')
  assert.equal(list.children[0].children[1].textContent, '等待中')
  assert.equal(list.children[1].children[1].textContent, '运行中')
  assert.equal(list.children[2].children[1].textContent, '已停止')
  assert.equal(list.children[3].children[1].textContent, '需处理')
  assert.match(total.textContent, /1 项运行中 · 1 项等待中 · 1 项需处理 · 6 项已停止/)
  assert.equal(scheduleList.children.length, 9)
  const firstScheduleRow = scheduleList.children[0]
  assert.equal(firstScheduleRow.dataset.pulse, 'running')
  assert.ok(firstScheduleRow.children.some((child) => child.className === 'xrc-schedule-orbit-dot'))
  context.taskSchedule = { enabled: true, items: { poster: { blocked: true, reason: 'risk-blocked' }, timeline: { resumeAt: now + 60000, reason: '任务状态未响应，等待自动复查' } } }
  context.taskSchedule.current = 'notifications'
  context.taskSchedule.dueModes = ['notifications', 'likes-posts', 'likes-replies']
  context.pluginRuntime.tasks.timeline = { phase: 'unknown', updatedAt: now }
  context.waitHeadline = (prefix, ms) => ms > 0 ? `${prefix} · 约 1 分 0 秒` : prefix
  context.paint(panel)
  assert.match(scheduleList.children[0].children[1].children[0].textContent, /当前任务|评论回复/)
  assert.equal(scheduleList.children[0].dataset.phase, 'now')
  assert.equal(scheduleList.children.find((row) => row.dataset.mode === 'timeline'), firstScheduleRow)
  const nowGo = scheduleList.children[0].querySelector('[data-xrc-focus-execution]')
  assert.equal(nowGo?.textContent, '查看')
  assert.equal(nowGo?.dataset.currentTask, 'notifications')
  assert.equal(list.children[0].children[1].textContent, '等待中')
  assert.equal(list.children[3].children[1].textContent, '需处理')
  // Desk order follows readiness clock, not fixed FLOW_TASKS / dueModes sequence.
  context.taskSchedule.current = ''
  context.pluginRuntime.tasks = {}
  context.taskSchedule.dueModes = ['likes-posts', 'poster', 'notifications']
  context.taskSchedule.timeline = {
    history: [],
    future: [
      { mode: 'likes-posts', status: 'scheduled', readyAt: now + 40 * 60000 },
      { mode: 'poster', status: 'scheduled', readyAt: now + 15 * 1000 },
      { mode: 'notifications', status: 'scheduled', readyAt: now + 8 * 60000 },
      { mode: 'timeline', status: 'stopped', readyAt: 0 },
    ],
  }
  context.taskSchedule.items = {
    'likes-posts': { resumeAt: now + 40 * 60000, reason: '等待下次运行' },
    poster: { resumeAt: now + 15 * 1000, reason: '等待下次运行时间' },
    notifications: { resumeAt: now + 8 * 60000, reason: '本次计划已完成' },
    timeline: { manualStopped: true },
  }
  context.taskSchedule.rules = {
    'likes-posts': { enabled: true, priority: 3 },
    poster: { enabled: true, priority: 2 },
    notifications: { enabled: true, priority: 3 },
    timeline: { enabled: true, priority: 3 },
  }
  context.paint(panel)
  const waitingModes = scheduleList.children
    .filter((row) => row.dataset.phase === 'next' || row.dataset.phase === 'candidate')
    .map((row) => row.dataset.mode)
  assert.deepEqual(waitingModes.slice(0, 3), ['poster', 'notifications', 'likes-posts'])
  assert.equal(scheduleList.children.find((row) => row.dataset.mode === 'poster')?.dataset.phase, 'next')
  assert.equal(scheduleList.children.find((row) => row.dataset.mode === 'poster')?.dataset.warmth, '0')
  assert.equal(scheduleList.children.find((row) => row.dataset.mode === 'notifications')?.dataset.warmth, '1')
  assert.equal(scheduleList.children.find((row) => row.dataset.mode === 'likes-posts')?.dataset.warmth, '2')
  assert.equal(deskNowRow.hidden, false)
  assert.equal(deskNow.textContent, '正在调度中')
  assert.match(deskNowNote.textContent, /下一：/)
  assert.match(deskNowNote.textContent, /剩余：约 7 分 31 秒/)
  assert.match(deskNowNote.textContent, /预计：/)
  context.taskSchedule.items.timeline = { manualStopped: true }
  context.pluginRuntime.tasks.timeline = { phase: 'running', detail: '正在评论', updatedAt: now }
  context.pluginRuntime.flow.phase = 'paused'
  context.paint(panel)
  assert.equal(list.children[1].children[1].textContent, '运行中')
  assert.doesNotMatch(total.textContent, /全流程已暂停/)
  context.pluginRuntime.tasks.timeline.phase = 'paused'
  context.paint(panel)
  assert.equal(list.children[1].children[1].textContent, '已停止')
  assert.match(total.textContent, /全流程已暂停/)
  assert.match(source, /data-xrc-desk-home/)
  assert.match(source, /data-xrc-timeline-current>正在读取排班状态/)
  assert.match(source, /data-xrc-schedule-desk/)
  assert.match(source, /data-xrc-schedule-board aria-label="实时排班情况"/)
  assert.match(source, /data-xrc-focus-execution/)
  assert.match(source, /dataset\.pulse/)
  assert.match(css, /data-pulse="waiting"/)
  assert.match(css, /data-pulse="running"/)
  assert.match(css, /data-pulse="stopped"/)
  assert.match(css, /xrc-border-breathe/)
  assert.match(css, /xrc-dot-orbit/)
  assert.match(css, /left:\s*calc\(100% - 12px\)/)
  assert.match(css, /--xrc-orbit-tempo/)
  assert.match(css, /xrc-schedule-orbit-dot/)
  assert.match(css, /xrc-schedule-wait-dots/)
  assert.match(css, /xrc-ellipsis-bounce/)
  assert.match(source, /xrc-schedule-wait-dots/)
  assert.match(source, /xrc-schedule-orbit-dot/)
  assert.match(source, /Upsert in place/)
  assert.ok(css.lastIndexOf('data-pulse="running"') > css.indexOf('.xrc-schedule-board .xrc-schedule-item {'))
  assert.match(css, /\[data-desk="home"\] \.xrc-assistant-tabs/)
  assert.match(css, /\[data-desk="task"\] \.xrc-assistant-tabs/)
  assert.match(css, /\[data-desk="task"\]\[data-assistant-mode="timeline"\] \.xrc-reply-body/)
  assert.match(css, /\[data-desk="task"\]\[data-assistant-mode="poster"\] \.xrc-post-body/)
  assert.match(css, /\[data-desk="task"\] \.xrc-reply-tabs/)
  assert.match(css, /\[data-desk="task"\] \.xrc-post-tabs/)
  assert.doesNotMatch(css, /\[data-desk="task"\] \.xrc-reply-body,\s*\n#x-reply-clipboard-panel\[data-desk="task"\]\[data-assistant-mode="likes-posts"\]/)
  assert.match(backgroundSource, /dueModes: schedule\.enabled \? dueTaskModes\(schedule\) : \[\]/)
  assert.match(backgroundSource, /strategyVersion\) >= 4/)
  assert.match(source, /Number\(taskSchedule\.strategyVersion\) >= 4/)
  assert.match(source, /openTaskSubpage\(/)
  assert.match(source, /openScheduleDesk\(/)
  assert.match(source, /function taskBodySelector\(/)
  assert.doesNotMatch(source, /绿边跑马灯=运行中/)
})

test('paused flow wins over stale stopping task records', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && definition)
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '普通发帖'], ['poster-premium', '精品发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    flowStarting: false,
    flowStopping: false,
    taskSchedule: { enabled: false, items: {} },
    pluginRuntime: { flow: { phase: 'paused', updatedAt: Date.now() }, tasks: { timeline: { phase: 'stopping' } } },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${definition}\nglobalThis.model = flowButtonModel`, context)
  assert.equal(context.model().label, '启动排班')
  assert.equal(context.model().hint, '全流程已暂停，可重新启动。')
  assert.equal(context.model().action, 'start')
  context.pluginRuntime.tasks.timeline = { phase: 'paused', updatedAt: Date.now() }
  assert.equal(context.model().label, '启动排班')
  context.pluginRuntime.tasks.timeline = { phase: 'stopping' }
  context.pluginRuntime.flow = { phase: 'stopping', updatedAt: Date.now() - 20000 }
  context.pluginRuntime.tasks.timeline.updatedAt = Date.now() - 20000
  assert.equal(context.model().label, '停止超时')
  assert.equal(context.model().action, '')
  assert.equal(context.model().canStop, true)
})

test('a running task remains visible when an old paused flow marker survives reload', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && definition)
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '普通发帖'], ['poster-premium', '精品发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    flowStarting: false,
    flowStopping: false,
    taskSchedule: { enabled: false, items: {} },
    pluginRuntime: { flow: { phase: 'paused', updatedAt: Date.now() }, tasks: { timeline: { phase: 'running', updatedAt: Date.now() } } },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${definition}\nglobalThis.model = flowButtonModel`, context)
  assert.equal(context.model().label, '运行中')
  assert.equal(context.model().action, '')
  assert.equal(context.model().canStop, true)
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  assert.match(backgroundSource, /if \(phase !== "stopping"\)/)
})

test('flow button starts missing tasks when only two tasks are waiting', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && definition)
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '普通发帖'], ['poster-premium', '精品发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    flowStarting: false,
    flowStopping: false,
    taskSchedule: { enabled: true, items: Object.fromEntries(['mutual-unfollow', 'mutual-followBack', 'poster', 'poster-premium', 'likes-posts', 'likes-replies'].map((mode) => [mode, { manualStopped: true }])) },
    pluginRuntime: { flow: { phase: 'running', updatedAt: now }, tasks: {
      timeline: { phase: 'paused', updatedAt: now },
      notifications: { phase: 'paused', updatedAt: now },
    } },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${definition}\nglobalThis.model = flowButtonModel`, context)
  assert.equal(context.model().label, '启动未运行')
  assert.equal(context.model().action, 'start')
  context.taskSchedule.current = 'timeline'
  assert.equal(context.model().label, '后台调度中')
  assert.equal(context.model().action, '')
  assert.equal(context.model().canStop, true)
  assert.equal(context.model().hint, '正在确认当前任务是否已启动，确认后开始执行。')
  context.taskSchedule.current = ''
  context.taskSchedule.items = {}
  assert.equal(context.model().label, '后台调度中')
  assert.equal(context.model().hint, '等待下一项到期后自动切换。')
  context.pluginRuntime.tasks.timeline.phase = 'running'
  assert.equal(context.model().label, '运行中')
  assert.equal(context.model().action, '')
  assert.equal(context.model().canStop, true)
})

test('a waiting post alone does not make the global button say pause all', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && definition)
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '普通发帖'], ['poster-premium', '精品发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    flowStarting: false,
    flowStopping: false,
    taskSchedule: { enabled: false, items: {} },
    pluginRuntime: { flow: { phase: 'running', updatedAt: now }, tasks: { poster: { phase: 'paused', updatedAt: now, detail: '等待下一条发布' } } },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${definition}\nglobalThis.model = flowButtonModel`, context)
  assert.equal(context.model().label, '启动未运行')
  assert.equal(context.model().action, 'start')
  assert.equal(context.model().status, 'waiting')
})

test('flow button and detail agree across active, stale, stopped, and blocked states', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function flowButtonModel\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && definition)
  const modes = ['timeline', 'notifications', 'mutual-unfollow', 'mutual-followBack', 'mutual-targetFollow', 'poster', 'poster-premium', 'likes-posts', 'likes-replies']
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: modes.map((mode) => [mode, mode]),
    FLOW_STALE_MS: 90000,
    flowStarting: false,
    flowStopping: false,
    taskSchedule: { enabled: true, items: {} },
    pluginRuntime: { flow: { phase: 'running', updatedAt: now }, tasks: {} },
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${definition}\nglobalThis.model = flowButtonModel; globalThis.overview = flowTaskOverview`, context)
  const read = () => ({ label: context.model().label, hint: context.model().hint, action: context.model().action, canStop: context.model().canStop, counts: JSON.parse(JSON.stringify(context.overview(context.pluginRuntime, now).counts)) })

  context.taskSchedule.items = Object.fromEntries(modes.map((mode) => [mode, { manualStopped: true }]))
  assert.equal(read().label, '启动未运行')
  context.pluginRuntime.tasks.poster = { phase: 'running', updatedAt: now }
  assert.equal(read().counts.running, 1)
  assert.deepEqual({ label: read().label, action: read().action, canStop: read().canStop }, { label: '运行中', action: '', canStop: true })
  context.taskSchedule.items.poster = { blocked: true }
  assert.equal(read().counts.running, 1)

  context.pluginRuntime.tasks = {}
  context.taskSchedule.items = Object.fromEntries(modes.map((mode) => [mode, { blocked: true }]))
  assert.deepEqual({ label: read().label, action: read().action, canStop: read().canStop }, { label: '需处理', action: '', canStop: true })
  context.taskSchedule.enabled = false
  assert.deepEqual({ label: read().label, action: read().action }, { label: '需处理', action: '' })
  context.taskSchedule.enabled = true
  context.taskSchedule.items = {}
  assert.equal(read().label, '后台调度中')
  assert.equal(read().action, '')
  assert.equal(read().hint, '等待下一项到期后自动切换。')
  context.pluginRuntime.flow.phase = 'stopping'
  assert.equal(read().label, '正在停止')

  context.taskSchedule.enabled = false
  context.pluginRuntime.flow = { phase: 'running', updatedAt: now }
  context.pluginRuntime.tasks.poster = { phase: 'running', updatedAt: now - 91000 }
  assert.equal(read().counts.unknown, 1)
  assert.equal(read().label, '检查并启动')
  context.pluginRuntime.flow.phase = 'paused'
  assert.equal(read().label, '启动排班')
  context.pluginRuntime.flow = { phase: 'running', updatedAt: now }
  context.pluginRuntime.tasks.poster = { phase: 'stopping', updatedAt: now - 91000 }
  assert.equal(read().counts.stopping, 1)
  assert.equal(read().label, '停止超时')
  assert.equal(read().canStop, true)
  context.pluginRuntime.flow.phase = 'paused'
  assert.equal(read().counts.missing, 9)
  assert.equal(read().label, '启动排班')
  context.pluginRuntime.tasks = {}
  context.pluginRuntime.flow = { phase: 'stopped', updatedAt: now }
  assert.deepEqual({ label: read().label, action: read().action }, { label: '启动排班', action: 'start' })
  context.pluginRuntime.flow = {}
  assert.deepEqual({ label: read().label, action: read().action }, { label: '启动排班', action: 'start' })
  context.flowStarting = true
  assert.deepEqual({ label: read().label, action: read().action }, { label: '启动中', action: '' })
  context.flowStarting = false
  context.flowStopping = true
  assert.deepEqual({ label: read().label, action: read().action }, { label: '正在停止', action: '' })
  assert.match(source, /toggle\.textContent = mode === "pause" \? "暂停" : "开始"/)
  assert.match(source, /data-xrc-flow-stop/)
  assert.match(source, /data-xrc-flow-hint/)
})

test('all seven scheduled task buttons use the same waiting state as the flow detail', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const control = source.match(/  function scheduledTaskButtonState\(mode, localActive, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const deskDefinition = source.match(/  function scheduleDashboardActive\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && control && deskDefinition)
  const modes = ['timeline', 'notifications', 'mutual-unfollow', 'mutual-followBack', 'poster', 'poster-premium', 'likes-posts', 'likes-replies']
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: modes.map((mode) => [mode, mode]),
    FLOW_STALE_MS: 90000,
    deskHome: true,
    selectedTaskMode: '',
    taskSchedule: {
      enabled: true,
      dueModes: modes,
      timeline: { future: modes.map((mode) => ({ mode, status: 'ready' })) },
      items: { poster: { resumeAt: now + 60000, reason: '轮换等待' } },
    },
    pluginRuntime: { flow: { phase: 'running' }, tasks: {} },
    formatClock: () => '01:00',
    formatCountdown: () => '1 分 0 秒',
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${deskDefinition}\n${overview}\n${control}\nglobalThis.control = scheduledTaskButtonState`, context)
  for (const mode of modes) {
    const expected = mode === 'poster'
      ? '等待中 · 约 1 分 0 秒 · 点击查看'
      : '等待中 · 点击查看'
    assert.equal(context.control(mode, false, now).label, expected)
    assert.equal(context.control(mode, false, now).action, 'inspect')
    assert.equal(context.control(mode, true, now), null)
  }
  assert.match(context.control('poster', false, now).title, /轮换等待，还剩 约 1 分 0 秒/)
  context.deskHome = false
  context.selectedTaskMode = 'poster'
  assert.equal(context.control('poster', false, now).action, 'start')
  assert.equal(context.control('poster', false, now).label, '等待中 · 约 1 分 0 秒 · 立即开启当前任务')
  assert.match(context.control('poster', false, now).title, /会先停止再开启这项/)
  context.deskHome = true
  context.taskSchedule.items.poster.manualStopped = true
  assert.equal(context.control('poster', false, now).label, '已停止 · 点击启动')
  context.deskHome = false
  assert.equal(context.control('poster', false, now).label, '已停止 · 立即开启当前任务')
  context.deskHome = true
  context.taskSchedule.items.poster.manualStopped = false
  context.taskSchedule.items.poster.blocked = true
  assert.equal(context.control('poster', false, now).label, '需处理 · 点击启动')
  context.deskHome = false
  assert.equal(context.control('poster', false, now).label, '需处理 · 立即开启当前任务')
  context.deskHome = true
  context.taskSchedule.items.poster.blocked = false
  context.taskSchedule.items.poster.resumeAt = 0
  context.pluginRuntime.tasks.poster = { phase: 'running', updatedAt: now }
  assert.equal(context.control('poster', false, now).label, '运行中 · 点击查看')
  assert.equal(context.control('poster', false, now).action, 'inspect')
  context.pluginRuntime.tasks.poster = { phase: 'paused', updatedAt: now }
  context.taskSchedule.enabled = false
  assert.equal(context.control('poster', false, now).label, '等待中 · 点击查看')
  assert.equal(context.control('poster', false, now).action, 'focus')
  context.taskSchedule.strategyVersion = 4
  assert.equal(context.control('poster', false, now).action, 'inspect')
  context.taskSchedule.strategyVersion = 5
  assert.equal(context.control('poster', false, now).action, 'inspect')
  context.taskSchedule.strategyVersion = undefined
  context.pluginRuntime.tasks.poster = { phase: 'running', updatedAt: now - 91000 }
  assert.equal(context.control('poster', false, now).label, '需处理 · 点击查看')
  assert.equal(context.control('timeline', false, now), null)
})

test('single task click refreshes background schedule before acting on a stale start label', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  async function stopScheduledWaitingTask\(mode, localActive\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  assert.match(source, /确定立即开启/)
  assert.match(source, /会停止正在执行的/)
  assert.match(source, /立即开启当前任务/)
  const actions = []
  const busyModes = new Set()
  const context = vm.createContext({
    taskSchedule: { enabled: false, items: {} }, pluginRuntime: { tasks: {} }, state: {},
    TASK_MODE_LABELS: { 'likes-posts': '点赞帖子', timeline: '评论首页' },
    setTaskActionBusy(mode, busy) {
      if (busy) busyModes.add(mode)
      else busyModes.delete(mode)
    },
    readRuntimeMessage: async () => ({ runtime: { tasks: {} }, schedule: { enabled: true, items: {} } }),
    scheduledTaskButtonState: () => ({ action: 'start' }),
    confirmOpenViewedTask: () => true,
    sendExtensionMessage: async (message) => { actions.push(message.type); return { ok: true } },
    renderPanel() {},
  })
  vm.runInContext(`${definition}\nglobalThis.stopWaiting = stopScheduledWaitingTask`, context)
  assert.equal(await context.stopWaiting('likes-posts', false), true)
  assert.deepEqual(actions, ['xrc-task-manual-start'])
  assert.equal(context.taskSchedule.items['likes-posts'].manualStopped, false)
  assert.equal(context.taskSchedule.items['likes-posts'].resumeAt, 0)

  context.confirmOpenViewedTask = () => false
  actions.length = 0
  assert.equal(await context.stopWaiting('likes-posts', false), true)
  assert.deepEqual(actions, [])
  assert.match(context.state.status, /已取消开启/)

  context.scheduledTaskButtonState = () => ({ action: 'focus' })
  context.sendTaskMessage = async (type) => { actions.push(type); return { ok: true } }
  context.loadOpenTaskTabs = async () => {}
  context.TASK_MODE_LABELS = { 'likes-posts': '点赞帖子' }
  assert.equal(await context.stopWaiting('likes-posts', false), true)
  assert.equal(actions.at(-1), 'xrc-task-open')

  context.scheduledTaskButtonState = () => ({ action: 'inspect' })
  context.selectTaskForInspection = (mode) => { actions.push(`inspect:${mode}`) }
  assert.equal(await context.stopWaiting('likes-posts', false), true)
  assert.equal(actions.at(-1), 'inspect:likes-posts')
  assert.match(context.state.status, /排班未改变/)

  context.readRuntimeMessage = async () => { throw new Error('后台暂不可用') }
  assert.equal(await context.stopWaiting('likes-posts', false), true)
  assert.match(context.state.status, /无法确认后台任务状态/)
})

test('starting the inspected reply targets that task while another task owns the shared tab', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const toggle = source.match(/  async function onToggle\(\{ scheduledStart = false, requestedMode = "" \} = \{\}\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(toggle)
  const requested = []
  const context = vm.createContext({
    state: { running: false, loopPromise: null },
    validTaskKey: (mode) => mode,
    currentTaskKey: () => 'likes-replies',
    stopScheduledWaitingTask: async (mode, localActive) => {
      requested.push({ mode, localActive })
      return true
    },
  })
  vm.runInContext(`${toggle}\nglobalThis.toggle = onToggle`, context)
  await context.toggle({ requestedMode: 'notifications' })
  assert.deepEqual(requested, [{ mode: 'notifications', localActive: false }])
  assert.match(source, /else onToggle\(\{ requestedMode \}\)/)
  assert.match(source, /toggleLikes\(\{ requestedMode: viewTaskKey\(\) \}\)/)
  assert.match(source, /onPosterToggle\(\{ requestedMode: viewTaskKey\(\) \}\)/)
})

test('inspecting another task keeps the live runtime mode and only changes the view', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helpers = [
    source.match(/  function validAssistantMode\(value\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function validTaskKey\(value\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function mutualTaskKey\(mode = state\.mutualMode\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function currentTaskKey\(\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function anyLocalTaskRunning\(\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function viewTaskKey\(\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function viewAssistantMode\(\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function assistantModeForTask\(mode\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function isPosterMode\(mode = state\.assistantMode\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function openTaskSubpage\(mode\) \{[\s\S]*?\n  \}/)?.[0],
  ].join('\n')
  assert.match(source, /Body visibility follows the inspected card/)
  assert.match(source, /do not hijack the live runtime assistantMode|Only retarget the runtime assistant/)
  assert.ok(helpers.includes('viewAssistantMode') && helpers.includes('openTaskSubpage'))
  const session = new Map()
  const context = vm.createContext({
    ASSISTANT_MODES: new Set(['timeline', 'notifications', 'likes-posts', 'likes-replies', 'mutual', 'poster', 'poster-premium']),
    PANEL_ID: 'x-reply-clipboard-panel',
    state: { assistantMode: 'poster', mutualMode: 'unfollow', poster: { running: true }, running: false, loopPromise: null },
    likeState: { running: false, stopping: false },
    selectedTaskMode: 'poster',
    deskHome: true,
    sessionStorage: {
      setItem(key, value) { session.set(key, String(value)) },
      getItem(key) { return session.has(key) ? session.get(key) : null },
    },
    document: { querySelector() { return null }, getElementById() { return null } },
    postApi: { setPostKind() { context.kindSet = true } },
    renderPanel() { context.rendered = true },
    refreshScheduleView() { return Promise.resolve() },
    taskBodySelector(mode) { return mode },
  })
  vm.runInContext(`${helpers}\nglobalThis.open = openTaskSubpage; globalThis.viewMode = viewAssistantMode; globalThis.viewKey = viewTaskKey; globalThis.liveKey = currentTaskKey`, context)
  context.open('notifications')
  assert.equal(context.deskHome, false)
  assert.equal(context.selectedTaskMode, 'notifications')
  assert.equal(context.viewMode(), 'notifications')
  assert.equal(context.viewKey(), 'notifications')
  assert.equal(context.state.assistantMode, 'poster')
  assert.equal(context.liveKey(), 'poster')
  assert.equal(context.rendered, true)
  assert.equal(session.get('xrcSelectedTaskMode'), 'notifications')
  assert.equal(session.get('xrcDeskHome'), '0')
})

test('inspecting another follow task preserves the running follow task and scrolls its own detail', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const names = ['validAssistantMode', 'validTaskKey', 'validMutualMode', 'mutualTaskKey', 'currentTaskKey',
    'anyLocalTaskRunning', 'viewTaskKey', 'viewAssistantMode', 'assistantModeForTask', 'isPosterMode',
    'taskBodySelector', 'openTaskSubpage']
  const definitions = names.map((name) => source.match(new RegExp(`  function ${name}\\([^]*?\\n  \\}`))?.[0])
  assert.ok(definitions.every(Boolean))
  const state = { assistantMode: 'mutual', mutualMode: 'followBack', mutual: { running: true, mode: 'followBack' } }
  const session = new Map()
  const context = vm.createContext({
    state, likeState: { running: false, stopping: false }, taskSchedule: { enabled: true, current: 'mutual-followBack' },
    selectedTaskMode: 'mutual-followBack', deskHome: false,
    ASSISTANT_MODES: new Set(['timeline', 'notifications', 'likes-posts', 'likes-replies', 'mutual', 'poster', 'poster-premium']),
    PANEL_ID: 'x-reply-clipboard-panel',
    sessionStorage: { setItem(key, value) { session.set(key, value) } },
    document: { querySelector() { return null }, getElementById() { return null } },
    renderPanel() {}, refreshScheduleView() { return Promise.resolve() },
  })
  vm.runInContext(`${definitions.join('\n')}\nglobalThis.open = openTaskSubpage; globalThis.live = currentTaskKey; globalThis.view = viewTaskKey; globalThis.body = taskBodySelector`, context)
  context.open('mutual-unfollow')
  assert.equal(context.view(), 'mutual-unfollow')
  assert.equal(context.live(), 'mutual-followBack')
  assert.equal(state.mutualMode, 'followBack')
  assert.equal(context.body(context.view()), '.xrc-mutual-body')
  assert.equal(session.get('xrcSelectedTaskMode'), 'mutual-unfollow')
})

test('a reserved schedule slot waits until its page confirms the loop', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const waitInfo = source.match(/  function scheduledWaitInfo\(mode, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const notice = source.match(/  function taskScheduleNotice\(mode, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && waitInfo && notice)
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['mutual-unfollow', '清理未回关'], ['mutual-followBack', '回关粉丝'], ['poster', '普通发帖'], ['poster-premium', '精品发帖'], ['likes-posts', '点赞帖子'], ['likes-replies', '点赞评论']],
    FLOW_STALE_MS: 90000,
    taskSchedule: { enabled: true, current: 'timeline', items: { timeline: { reason: '等待后台调度' } } },
    pluginRuntime: { tasks: {} },
    formatClock: () => '01:00',
    waitHeadline: (prefix, ms) => ms > 0 ? `${prefix} · 约 1 分 0 秒` : prefix,
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${waitInfo}\n${notice}\nglobalThis.overview = flowTaskOverview; globalThis.notice = taskScheduleNotice`, context)
  const result = context.overview({ tasks: {} }, now)
  assert.equal(result.tasks.find((task) => task.key === 'timeline').status, 'waiting')
  assert.equal(result.tasks.find((task) => task.key === 'notifications').status, 'waiting')
  assert.equal(context.notice('timeline', now).title, '启动中')
  context.pluginRuntime.tasks.timeline = { phase: 'running', updatedAt: now }
  assert.equal(context.overview({ tasks: context.pluginRuntime.tasks }, now).tasks.find((task) => task.key === 'timeline').status, 'running')
  assert.equal(context.notice('timeline', now), null)
  context.taskSchedule.items.timeline.resumeAt = now + 60000
  context.pluginRuntime.tasks.timeline = { phase: 'paused', updatedAt: now, waitUntil: now + 60000 }
  assert.equal(context.overview({ tasks: context.pluginRuntime.tasks }, now).tasks.find((task) => task.key === 'timeline').status, 'waiting')
  assert.match(context.notice('timeline', now).detail, /到期后自动继续/)
})

test('waiting copy explains queue, platform cooldown, and fixed posting slot', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const definition = source.match(/  function scheduledWaitInfo\(mode, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const now = Date.now()
  const context = vm.createContext({
    FLOW_TASKS: [['timeline', '评论首页'], ['notifications', '评论回复'], ['poster-premium', '精品发帖']],
    taskSchedule: { current: 'timeline', items: {}, timeline: { future: [] } },
    pluginRuntime: { tasks: { timeline: { phase: 'running' } } },
  })
  vm.runInContext(`${definition}\nglobalThis.waitInfo = scheduledWaitInfo`, context)
  const queued = context.waitInfo('notifications', now)
  assert.equal(queued.label, '排队中')
  assert.equal(queued.waitingFor, '评论首页')
  context.taskSchedule.items.notifications = { reason: 'X 提示疑似自动化，第 2 次冷却后自动重试', resumeAt: now + 60000 }
  const limited = context.waitInfo('notifications', now)
  assert.equal(limited.label, 'X 限制冷却')
  assert.equal(limited.detail, '到期自动重试')
  assert.equal(limited.remaining, 60000)
  context.taskSchedule.timeline.future = [{ mode: 'poster-premium', readyAt: now + 3600000 }]
  assert.equal(context.waitInfo('poster-premium', now).label, '等待精品档位')
  assert.match(css, /xrc-task-schedule-notice\[data-state="waiting"\] strong::before/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('schedule card notes use titled fields separated by fullwidth bars', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helpers = [
    source.match(/  const DEFAULT_SCHEDULE_PRIORITY = Object\.freeze\(\{[\s\S]*?\}\);/)?.[0],
    source.match(/  function schedulePriorityFor\(mode, rule\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function schedulePriorityLabel\(priority\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function scheduleWindowLabel\(window\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function schedulePaceLabel\(minGapMs\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function isRedundantScheduleDetail\(label, detail\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function joinScheduleFields\(entries\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function formatScheduleCardNote\(task, wait\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function formatDeskPastNote\(latest\) \{[\s\S]*?\n  \}/)?.[0],
    source.match(/  function formatDeskDispatchNote\(\{ nextEntry, preview, waitMs \}\) \{[\s\S]*?\n  \}/)?.[0],
  ].join('\n')
  assert.match(helpers, /\["状态"/)
  assert.match(helpers, /function formatDeskPastNote/)
  assert.match(helpers, /function formatDeskDispatchNote/)
  const context = vm.createContext({
    formatClock: (ms) => ms === 60000 ? '01:00' : '00:00',
    formatCountdown: () => '13 分 14 秒',
    formatScheduleTime: () => '10/29 08:59',
    taskActionCount: () => '0 条帖子',
    TASK_MODE_LABELS: { timeline: '评论首页', poster: '普通发帖' },
  })
  vm.runInContext(`${helpers}\nglobalThis.format = formatScheduleCardNote; globalThis.pastNote = formatDeskPastNote; globalThis.dispatchNote = formatDeskDispatchNote`, context)
  const task = { reason: '', rule: { priority: 9, window: 'all', minGapMs: 0 } }
  assert.equal(
    context.format(task, { label: 'X 限制冷却', detail: '到期自动重试', remaining: 60000 }),
    '状态：X 限制冷却｜剩余：01:00｜说明：到期自动重试｜优先级：9分｜时段：全天'
  )
  assert.equal(
    context.format(task, { label: 'X 限制冷却', detail: '风控等待中', remaining: 60000 }),
    '状态：X 限制冷却｜剩余：01:00｜优先级：9分｜时段：全天'
  )
  assert.equal(
    context.format({ ...task, rule: { priority: 5, window: 'all', minGapMs: 0 } }, { label: '排队中', waitingFor: '评论首页', detail: '当前项结束后自动轮到', remaining: 0 }),
    '状态：排队中｜等待：评论首页｜优先级：5分｜时段：全天'
  )
  assert.equal(
    context.format(task, { label: '本次已完成', detail: '等待下次排班', remaining: 60000 }),
    '状态：本次已完成｜剩余：01:00｜说明：等待下次排班｜优先级：9分｜时段：全天'
  )
  assert.equal(
    context.format(task, { label: '本次已完成', detail: '本次 5 轮已完成，等待下次排班', remaining: 60000 }),
    '状态：本次已完成｜剩余：01:00｜优先级：9分｜时段：全天'
  )
  assert.equal(
    context.pastNote({ mode: 'poster', startedAt: 1, endedAt: 1, actions: 0, reason: '风控等待中' }),
    '起止：10/29 08:59–10/29 08:59｜完成：0 条帖子｜说明：风控等待中'
  )
  assert.equal(
    context.dispatchNote({
      nextEntry: { mode: 'timeline', status: 'scheduled', readyAt: 2 },
      preview: {},
      waitMs: 451000,
    }),
    '下一：评论首页｜剩余：约 13 分 14 秒｜预计：10/29 08:59'
  )
})

test('comment, like and poster handoff wait for the target loop before reporting success', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const start = source.match(/  async function startLaunchedTask\(launch\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(start)
  const likeState = { running: false, status: '点赞任务待命' }
  const state = {
    running: false, loopPromise: null, status: '评论任务待命',
    poster: { running: false, status: '发帖任务待命' },
    mutual: { running: false, status: '回关任务待命', mode: '' },
  }
  let releaseLike
  let releasePoster
  let releaseMutual
  const context = vm.createContext({
    likeState, state,
    toggleLikes: async (options) => {
      assert.equal(options.scheduledStart, true)
      await new Promise((resolve) => { releaseLike = resolve })
      likeState.running = true
    },
    onPosterToggle: async (options) => {
      assert.equal(options.scheduledStart, true)
      await new Promise((resolve) => { releasePoster = resolve })
      state.poster.running = true
    },
    onToggle: async (options) => {
      assert.equal(options.scheduledStart, true)
      state.running = true
    },
    onMutualAction: async (mode, options) => {
      assert.equal(options.scheduledStart, true)
      assert.equal(mode, 'followBack')
      await new Promise((resolve) => { releaseMutual = resolve })
      state.mutual.running = true
      state.mutual.mode = mode
    },
    isPosterMode: (mode) => mode === 'poster' || mode === 'poster-premium',
    pendingMutualAutostart: false,
  })
  vm.runInContext(`${start}\nglobalThis.startLaunchedTask = startLaunchedTask`, context)
  let settled = false
  const likeStart = context.startLaunchedTask({ start: true, assistantMode: 'likes-posts' }).then(() => { settled = true })
  await Promise.resolve()
  assert.equal(settled, false)
  releaseLike()
  await likeStart
  assert.equal(likeState.running, true)
  const postStart = context.startLaunchedTask({ start: true, assistantMode: 'poster-premium' })
  await Promise.resolve()
  assert.equal(state.poster.running, false)
  releasePoster()
  await postStart
  assert.equal(state.poster.running, true)
  state.poster.running = false
  context.onPosterToggle = async () => {}
  await assert.rejects(context.startLaunchedTask({ start: true, assistantMode: 'poster' }), /发帖任务待命/)
  await context.startLaunchedTask({ start: true, assistantMode: 'timeline' })
  assert.equal(state.running, true)
  state.running = false
  context.onToggle = async () => {}
  await assert.rejects(context.startLaunchedTask({ start: true, assistantMode: 'timeline' }), /评论任务待命/)
  settled = false
  const mutualStart = context.startLaunchedTask({ start: true, assistantMode: 'mutual', mutualMode: 'followBack' }).then(() => { settled = true })
  await Promise.resolve()
  assert.equal(settled, false)
  releaseMutual()
  await mutualStart
  assert.equal(state.mutual.running, true)
  state.mutual.running = false
  context.onMutualAction = async () => {}
  await assert.rejects(context.startLaunchedTask({ start: true, assistantMode: 'mutual', mutualMode: 'followBack' }), /回关任务待命/)
})

test('scheduled starts bypass manual waiting-button actions', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const likeToggle = source.match(/  async function toggleLikes\(\{ scheduledStart = false, requestedMode = "" \} = \{\}\) \{[\s\S]*?\n  \}/)?.[0]
  const posterToggle = source.match(/  async function onPosterToggle\(\{ scheduledStart = false, requestedMode = "" \} = \{\}\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(likeToggle && posterToggle)
  assert.match(source, /async function onToggle\(\{ scheduledStart = false, requestedMode = "" \} = \{\}\)/)
  assert.match(source, /async function onMutualAction\(mode, \{ scheduledStart = false \} = \{\}\)/)
  assert.match(source, /if \(!scheduledStart && await stopScheduledWaitingTask\(mutualTaskKey\(mode\)/)
  assert.match(source, /await onMutualAction\(launch\.mutualMode, \{ scheduledStart: true \}\)/)
  assert.match(source, /if \(!state\.running\) await onToggle\(\{ scheduledStart: true \}\)/)
  const likeState = { running: false }
  const state = { poster: { running: false }, aiKey: 'test-key', riskPaused: true, posterPace: 'medium' }
  let manualActions = 0
  let starts = 0
  const context = vm.createContext({
    likeState, state,
    currentTaskKey: () => 'likes-posts', posterTaskKey: () => 'poster', posterKindFromMode: () => 'normal', validTaskKey: () => '',
    stopScheduledWaitingTask: async () => { manualActions += 1; return true },
    resumeManuallyStoppedTask: async () => { manualActions += 1; return false },
    getLikeController: () => ({ start() { likeState.running = true; starts += 1 } }),
    postApi: { setPostKind() {}, start() { state.poster.running = true; starts += 1 } },
    flushConfigSave: async () => true, loadAiSettings: async () => {},
    registerCurrentTaskTab() {}, updatePosterState() {}, renderPanel() {},
  })
  vm.runInContext(`${likeToggle}\n${posterToggle}\nglobalThis.startLike = toggleLikes; globalThis.startPoster = onPosterToggle`, context)
  await context.startLike({ scheduledStart: true })
  await context.startPoster({ scheduledStart: true })
  assert.equal(starts, 2)
  assert.equal(manualActions, 0)
})

test('handoff cannot report running from another task while the target is idle', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const handoff = source.match(/  async function handoffInPageTask\(mode\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(handoff)
  const state = { running: true, loopPromise: null, mutual: { running: false }, poster: { running: false } }
  const context = vm.createContext({
    state, likeState: { running: false, stopping: false }, deskHome: false, selectedTaskMode: 'notifications',
    launchFromMode: () => ({ taskKey: 'likes-posts', assistantMode: 'likes-posts', start: true }),
    pathReadyForTask: () => true,
    currentTaskKey: () => 'timeline', stopLocalTasks: () => { state.running = false },
    sessionStorage: { setItem() {} },
    applyTaskTitle() {}, registerCurrentTaskTab: async () => {},
    startLaunchedTask: async () => {}, renderPanel() {}, currentTaskPhase: () => '',
  })
  vm.runInContext(`${handoff}\nglobalThis.handoff = handoffInPageTask`, context)
  const result = await context.handoff('likes-posts')
  assert.equal(result.ok, false)
  assert.match(result.error, /任务未能启动/)
  assert.equal(context.deskHome, false)
  assert.equal(context.selectedTaskMode, 'notifications')
})

test('all seven task panels show the same blocked state with a readable reason', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const overview = source.match(/  function flowTaskOverview\(runtime, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  const readable = source.match(/  function readableTaskLimitReason\(reason\) \{[\s\S]*?\n  \}/)?.[0]
  const notice = source.match(/  function taskScheduleNotice\(mode, now = Date\.now\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(overview && readable && notice)
  const modes = ['timeline', 'notifications', 'mutual-unfollow', 'mutual-followBack', 'poster', 'poster-premium', 'likes-posts', 'likes-replies']
  const context = vm.createContext({
    FLOW_TASKS: modes.map((mode) => [mode, mode]), FLOW_STALE_MS: 90000,
    taskSchedule: { enabled: true, items: Object.fromEntries(modes.map((mode) => [mode, { blocked: true, reason: 'risk-blocked' }])) },
    pluginRuntime: { tasks: {} }, formatClock: () => '01:00',
    waitHeadline: (prefix, ms) => ms > 0 ? `${prefix} · 约 1 分 0 秒` : prefix,
  })
  vm.runInContext(`${USER_STATE_HELPERS}\n${overview}\n${readable}\n${notice}\nglobalThis.notice = taskScheduleNotice`, context)
  for (const mode of modes) {
    const result = context.notice(mode)
    assert.equal(result.status, 'blocked')
    assert.match(result.title, /需处理.*连续受限/)
    assert.match(result.detail, /疑似自动化或账号受限/)
    assert.doesNotMatch(result.detail, /risk-blocked/)
  }
  const paint = source.match(/  function paintTaskScheduleNotice\(panel = document\.getElementById\(PANEL_ID\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(paint)
  const title = { textContent: '' }
  const detail = { textContent: '' }
  const element = { hidden: true, dataset: {}, querySelector: (selector) => selector === 'strong' ? title : detail }
  context.state = { assistantMode: 'timeline' }
  context.deskHome = false
  context.selectedTaskMode = 'timeline'
  context.currentTaskKey = () => 'timeline'
  context.viewTaskKey = () => context.selectedTaskMode || context.currentTaskKey()
  context.viewAssistantMode = () => context.viewTaskKey()
  vm.runInContext(`function isPosterMode(mode) { const current = mode === undefined ? state.assistantMode : mode; return current === "poster" || current === "poster-premium"; }\n${paint}\nglobalThis.paintNotice = paintTaskScheduleNotice`, context)
  context.paintNotice({ querySelector: () => element })
  assert.equal(element.hidden, false)
  assert.equal(element.dataset.state, 'blocked')
  assert.match(title.textContent, /需处理/)
  assert.match(detail.textContent, /疑似自动化或账号受限/)
  assert.equal((source.match(/data-xrc-button-note hidden/g) || []).length, 6)
  assert.doesNotMatch(source, /data-xrc-task-schedule-notice/)
  assert.match(source, /info\.status !== "waiting"/)
  assert.match(source, /paintTaskScheduleNotice\(panel\)/)
  assert.match(source, /openScheduleDesk\(/)
  assert.match(source, /void refreshScheduleView\(\)/)
})

test('missing DeepSeek key guide opens model settings and focuses its saved key field', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function openModelSettingsForKey\(panel\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  let focused = 0
  const panel = { querySelector(selector) {
    assert.equal(selector, '[data-xrc-config-key]')
    return { focus() { focused += 1 } }
  } }
  const context = vm.createContext({
    state: { panelView: 'collapsed', running: false, total: 0 },
    configOpen: false, configPage: 'other', monitorOpen: true, reportOpen: true,
    toolboxOpen: true, hubOpen: true,
    writeSaved() {}, syncConfigMenu() {}, syncMonitorMenu() {}, syncReportPage() {},
    syncToolboxMenu() {}, syncHubPage() {}, renderPanel() {},
  })
  vm.runInContext(`${definition}\nglobalThis.open = openModelSettingsForKey`, context)
  context.open(panel)
  assert.equal(context.configOpen, true)
  assert.equal(context.configPage, 'model')
  assert.equal(context.state.panelView, 'normal')
  assert.equal(focused, 1)
  assert.doesNotMatch(source, /data-xrc-ai-key|xrc-deepseek-global-token/)
})

test('manual restart clears only the selected task stop and restriction flags', async () => {
  const originalChrome = globalThis.chrome
  let schedule = { enabled: false, current: '', items: {
    'likes-posts': { manualStopped: true, blocked: true, resumeAt: 30000, limitedStreak: 3 },
    poster: { resumeAt: 60000, reason: '等待发帖' },
  } }
  globalThis.chrome = {
    storage: { local: {
      async get() { return { xrcTaskSchedule: schedule } },
      async set(value) { schedule = value.xrcTaskSchedule },
    } },
    alarms: { async create() {} },
  }
  try {
    const result = await background.markManualTaskStart('likes-posts')
    assert.equal(result.ok, true)
    assert.equal(schedule.items['likes-posts'].manualStopped, false)
    assert.equal(schedule.items['likes-posts'].blocked, false)
    assert.equal(schedule.items['likes-posts'].resumeAt, 0)
    assert.equal(schedule.items['likes-posts'].limitedStreak, 0)
    assert.ok(schedule.items['likes-posts'].manualRequestedAt > 0)
    assert.deepEqual(schedule.items.poster, { resumeAt: 60000, reason: '等待发帖' })
  } finally {
    globalThis.chrome = originalChrome
  }
})

test('legacy like cooldowns based on old alerts are rechecked after update', async () => {
  const originalChrome = globalThis.chrome
  const schedule = { enabled: true, current: '', items: {
    'likes-posts': { blocked: true, limitedStreak: 3, resumeAt: 9999999, reason: 'automation-restricted' },
    'likes-replies': { resumeAt: 9999999, reason: 'X 点赞次数受限' },
    poster: { resumeAt: 9999999, reason: '等待发帖' },
  } }
  globalThis.chrome = { storage: { local: {
    async get() { return { xrcTaskSchedule: schedule } },
    async set(value) { Object.assign(schedule, value.xrcTaskSchedule) },
  } } }
  try {
    const migrated = await background.readTaskSchedule()
    assert.equal(migrated.likeDetectionVersion, 2)
    for (const mode of ['likes-posts', 'likes-replies']) {
      assert.equal(migrated.items[mode].resumeAt, 0)
      assert.equal(migrated.items[mode].limitedStreak, 0)
      assert.equal(migrated.items[mode].blocked, false)
    }
    assert.deepEqual(migrated.items.poster, schedule.items.poster)
  } finally {
    globalThis.chrome = originalChrome
  }
})

test('scheduled post risk cooldown reports waiting even before the next post deadline', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function currentTaskPhase\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({
    state: { assistantMode: 'poster', poster: { running: true, stopping: false, nextPostAt: 0, riskCooldownUntil: Date.now() + 600000 } },
  })
  vm.runInContext(`function isPosterMode(mode) { const current = mode === undefined ? state.assistantMode : mode; return current === "poster" || current === "poster-premium"; }\n${definition}\nglobalThis.phase = currentTaskPhase`, context)
  assert.equal(context.phase(), 'paused')
})

test('background status reports resident recovery as waiting but manual stops as idle', async () => {
  const source = await readFile(new URL('background.js', extensionDir), 'utf8')
  const provider = source.match(/globalThis\.XrcCommunityReceipt\?\.setRuntimeProvider\(async \(\) => \{[\s\S]*?\n\}\);/)?.[0]
  const waitReason = source.match(/function isScheduleWaitReason\(reason\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(provider && waitReason)
  let readStatus
  const context = vm.createContext({
    globalThis: { XrcCommunityReceipt: { setRuntimeProvider(callback) { readStatus = callback } } },
    RUNTIME_REPORT_MODES: ['timeline', 'notifications', 'likes-posts', 'poster'],
    RUNTIME_REPORT_STALE_MS: 90_000,
    MAX_TASK_PRIORITY: 10,
    SCHEDULE_PRIORITY_HINT: '优先级 1～10 分，分值越大越重要',
    RESIDENT_TASKS: ['timeline', 'notifications'],
    QUEUED_TASKS: ['poster'],
    TASK_TITLE_LABELS: { timeline: '评论首页', notifications: '评论回复', 'likes-posts': '点赞帖子', poster: '普通发帖' },
    defaultTaskPriority: (mode) => ({ notifications: 9, timeline: 8, poster: 6, 'likes-posts': 5 }[mode] || 1),
    normalizedTaskRules: () => ({
      timeline: { enabled: true, priority: 8 },
      notifications: { enabled: true, priority: 9 },
      'likes-posts': { enabled: true, priority: 5 },
      poster: { enabled: true, priority: 6 },
    }),
    normalizedSliceSeconds: (value) => [20, 30, 45].includes(Number(value)) ? Number(value) : 30,
    scheduleTimeline: () => ({ history: [], future: [{ mode: 'notifications', status: 'scheduled', readyAt: Date.now() + 60000, reason: '等待自动恢复' }] }),
    readPluginRuntime: async () => ({
      tasks: {
        // Stale runtime row must not override an explicit manual stop.
        'likes-posts': { phase: 'paused', updatedAt: Date.now(), detail: '旧等待状态' },
      },
      flow: { phase: 'running' },
    }),
    verifyTaskRuntime: async (runtime) => runtime,
    readTaskSchedule: async () => ({ enabled: true, current: '', items: {
      timeline: { manualStopped: true, reason: '已手动停止' },
      notifications: { resumeAt: Date.now() + 60000, reason: '等待自动恢复' },
      'likes-posts': { manualStopped: true, reason: '已手动停止' },
      poster: { blocked: true, reason: '连续受限' },
    }, rules: {} }),
  })
  vm.runInContext(`${waitReason}\n${provider}`, context)
  const report = await readStatus()
  assert.equal(report.phase, 'running')
  assert.equal(report.tasks.find((task) => task.mode === 'timeline').phase, 'idle')
  assert.equal(report.tasks.find((task) => task.mode === 'notifications').phase, 'paused')
  assert.equal(report.tasks.find((task) => task.mode === 'likes-posts').phase, 'idle')
  assert.match(report.tasks.find((task) => task.mode === 'likes-posts').detail, /已手动停止/)
  assert.equal(report.tasks.find((task) => task.mode === 'poster').phase, 'unknown')
  assert.equal(report.schedule.enabled, true)
  assert.equal(report.schedule.next.mode, 'notifications')
  assert.equal(report.schedule.facing.waiting, 1)
  assert.equal(report.schedule.facing.needs, 1)
  assert.equal(report.schedule.facing.stopped, 2)
})

test('global pause clears the local scheduler flag as soon as background confirms', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  async function pauseAllTasks\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({
    flowStarting: false,
    flowStopping: false,
    taskSchedule: { enabled: true, current: 'poster', items: {} },
    pluginRuntime: { flow: { phase: 'running' }, tasks: { poster: { phase: 'paused' } } },
    state: { status: '' },
    stopLocalTasks() {}, paintFlowButton() {}, renderPanel() {},
    sendExtensionMessage: async () => ({ runtime: { flow: { phase: 'paused' }, tasks: {} } }),
  })
  vm.runInContext(`${definition}\nglobalThis.pause = pauseAllTasks; globalThis.snapshot = () => ({ schedule: taskSchedule, runtime: pluginRuntime })`, context)
  await context.pause()
  assert.equal(context.snapshot().schedule.enabled, false)
  assert.equal(context.snapshot().schedule.current, '')
  assert.equal(context.snapshot().runtime.flow.phase, 'paused')
})

test('header keeps version badge and omits the runtime status line under it', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(source, /xrc-version-line/)
  assert.match(source, /data-xrc-version-badge/)
  assert.doesNotMatch(source, /data-xrc-stable-runtime/)
  assert.doesNotMatch(source, /function flowRuntimeLabel/)
  assert.doesNotMatch(source, /xrc-runtime-line/)
  assert.doesNotMatch(css, /xrc-runtime-line/)
})

test('limit observations retain per-account windows and deduplicate receipts', async () => {
  const stored = {}
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value) },
  } } }
  try {
    const base = Date.now() - 20000
    const samples = [
      { id: 'success-001', task: 'timeline-reply', result: 'success', occurredAt: base - 1800000 },
      { id: 'success-002', task: 'notification-reply', result: 'success', occurredAt: base - 240000 },
      { id: 'success-003', task: 'post-like', result: 'success', occurredAt: base - 120000 },
      { id: 'limited-001', task: 'timeline-reply', result: 'limited', occurredAt: base, errorCode: 'risk-blocked' },
    ]
    for (const event of samples) await receipt.recordLimitObservation(event, 'alpha')
    await receipt.recordLimitObservation(samples[0], 'alpha')
    await receipt.recordLimitObservation({ id: 'success-004', task: 'timeline-reply', result: 'success', occurredAt: base - 60000 }, 'beta')
    const analysis = receipt.analyzeLimitObservations(await receipt.limitObservations(), 'alpha')
    assert.equal(analysis.events, 4)
    assert.equal(analysis.replySamples.length, 1)
    assert.deepEqual([analysis.replySamples[0].in10m, analysis.replySamples[0].in30m, analysis.replySamples[0].in1h, analysis.replySamples[0].in24h], [1, 2, 2, 2])
    assert.equal(analysis.replySamples[0].lastGapMs, 240000)
    assert.equal(analysis.replySamples[0].recentMedianGapMs, 1560000)
  } finally { delete globalThis.chrome }
})

test('merge account data consolidates legacy default logs into the active handle', async () => {
  const stored = {
    xrcDailyReports: [
      { date: '2026-10-16', accountHandle: 'default', counts: { comments: 2, likes: 1 }, eventIds: ['old-1'], updatedAt: 10 },
      { date: '2026-10-16', accountHandle: 'tarsixseveneig1', counts: { comments: 3, likes: 4 }, eventIds: ['new-1'], updatedAt: 20 },
    ],
    xrcLimitObservations: [{ id: 'old-limit', accountHandle: 'default', task: 'timeline-reply', result: 'limited', at: 10 }],
    xrcCommunityReport: { accountHandle: 'default', queue: [{ id: 'old-event', accountHandle: 'default' }] },
  }
  const previousChrome = globalThis.chrome
  globalThis.chrome = { storage: { local: {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.map((key) => [key, stored[key]]))
    },
    async set(value) { Object.assign(stored, value) },
  } } }
  try {
    const result = await receipt.mergeAccountData('default', 'tarsixseveneig1')
    assert.equal(result.changed, true)
    assert.deepEqual(stored.xrcDailyReports[0].counts, {
      comments: 5, timelineComments: 0, notificationComments: 0,
      likes: 5, follows: 0, unfollows: 0, followBacks: 0, posts: 0,
    })
    assert.equal(stored.xrcDailyReports[0].accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcLimitObservations[0].accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcCommunityReport.accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcCommunityReport.queue[0].accountHandle, 'tarsixseveneig1')
  } finally { globalThis.chrome = previousChrome }
})

test('daily report totals combine local days and accounts without changing the selected day', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function sumDailyCounts\(reports\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({ REPORT_METRICS: ['comments', 'likes', 'follows', 'unfollows', 'followBacks'] })
  vm.runInContext(`${definition}\nglobalThis.sum = sumDailyCounts`, context)
  const reports = [
    { date: '2026-10-13', accountHandle: 'a', counts: { comments: 2, likes: 3, follows: 1 } },
    { date: '2026-10-14', accountHandle: 'a', counts: { comments: 4, likes: 5, unfollows: 2 } },
    { date: '2026-10-14', accountHandle: 'b', counts: { comments: 7, followBacks: 3 } },
  ]
  const plain = (value) => JSON.parse(JSON.stringify(value))
  assert.deepEqual(plain(context.sum(reports)), { comments: 13, likes: 8, follows: 1, unfollows: 2, followBacks: 3 })
  assert.deepEqual(plain(context.sum(reports.filter((row) => row.date === '2026-10-14'))), { comments: 11, likes: 5, follows: 0, unfollows: 2, followBacks: 3 })
  assert.deepEqual(plain(context.sum(reports.filter((row) => row.date === '2026-10-14' && row.accountHandle === 'a'))), { comments: 4, likes: 5, follows: 0, unfollows: 2, followBacks: 0 })
})

test('daily backfill uploads only older reports that changed since the last upload', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const nowDate = receipt.shanghaiDate()
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'account', queue: [] },
    xrcDailyReports: [
      { date: '2026-10-20', accountHandle: 'account', counts: { comments: 3 }, updatedAt: 50, uploadedAt: 100 },
      { date: '2026-10-21', accountHandle: 'account', counts: { comments: 5 }, updatedAt: 200, uploadedAt: 100 },
      { date: '2026-10-22', accountHandle: 'account', counts: { comments: 7 }, updatedAt: 300, uploadedAt: 0 },
      { date: nowDate, accountHandle: 'account', counts: { comments: 9 }, updatedAt: 400, uploadedAt: 0 },
    ],
  }
  const sent = []
  globalThis.chrome = { runtime: { getManifest: () => ({ version: '3.29.0' }) }, storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async (_url, options) => {
    sent.push(JSON.parse(options.body).dailyReport.date)
    return { ok: true, async json() { return { dailyReportSaved: true } } }
  }
  try {
    const result = await receipt.uploadPendingDailyReports(nowDate)
    assert.equal(result.ok, true)
    assert.equal(result.uploaded, 2)
    assert.deepEqual(sent, ['2026-10-21', '2026-10-22'])
    assert.ok(stored.xrcDailyReports[1].uploadedAt > 0)
    assert.equal(stored.xrcDailyReports[3].uploadedAt, 0)
    assert.equal((await receipt.uploadPendingDailyReports(nowDate)).uploaded, 0)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('receipt cleanHandle rejects default placeholder accounts', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'tarsixseveneig1', queue: [] },
    xrcDailyReports: [{ date: '2026-10-21', accountHandle: 'default', counts: { comments: 2 }, updatedAt: 200, uploadedAt: 0 }],
  }
  const bodies = []
  globalThis.chrome = { runtime: { getManifest: () => ({ version: '3.32.16' }) }, storage: { local: {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.map((key) => [key, stored[key]]))
    },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body))
    return { ok: true, async json() { return { dailyReportSaved: true, commands: [] } } }
  }
  try {
    const skipped = await receipt.uploadDaily('2026-10-21', 'default')
    assert.equal(skipped.ok, false)
    assert.match(skipped.error, /账号未识别/)
    const accepted = await receipt.accept({ task: 'post-like', result: 'success', targetId: 'tweet-1', accountHandle: 'default' })
    assert.equal(accepted.ok, true)
    assert.equal(stored.xrcCommunityReport.accountHandle, 'tarsixseveneig1')
    assert.equal(stored.xrcCommunityReport.queue[0].accountHandle, '')
    await receipt.syncStatsFromBackground('tarsixseveneig1', { force: true })
    assert.equal(bodies.at(-1).accountHandle, 'tarsixseveneig1')
    assert.equal(bodies.every((body) => body.accountHandle !== 'default'), true)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('hourly stats sync uploads dirty daily reports including today', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const nowDate = receipt.shanghaiDate()
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'account', queue: [] },
    xrcDailyReports: [
      { date: '2026-10-21', accountHandle: 'account', counts: { comments: 2 }, updatedAt: 200, uploadedAt: 0 },
      { date: nowDate, accountHandle: 'account', counts: { comments: 4 }, updatedAt: 400, uploadedAt: 0 },
    ],
  }
  const bodies = []
  globalThis.chrome = { runtime: { getManifest: () => ({ version: '3.32.14' }) }, storage: { local: {
    async get(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(list.map((key) => [key, stored[key]]))
    },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async (_url, options) => {
    bodies.push(JSON.parse(options.body))
    return { ok: true, async json() { return { dailyReportSaved: true, commands: [] } } }
  }
  try {
    const monitor = await receipt.heartbeatFromBackground('account')
    assert.equal(monitor.ok, true)
    assert.equal(monitor.mode, 'monitor')
    assert.equal(bodies.every((body) => !body.dailyReport && Array.isArray(body.events) && body.events.length === 0), true)
    const result = await receipt.syncStatsFromBackground('account', { force: true })
    assert.equal(result.ok, true)
    assert.equal(result.daily.uploaded, 2)
    assert.deepEqual(bodies.filter((body) => body.dailyReport).map((body) => body.dailyReport.date), ['2026-10-21', nowDate])
    assert.ok(stored.xrcDailyReports.every((row) => row.uploadedAt > 0))
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('daily report panel relies on automatic sync instead of manual upload or pull', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const monitor = await readFile(new URL('../../app/(admin)/admin/community-actions/monitor/PluginMonitorClient.jsx', extensionDir), 'utf8')
  assert.match(content, /次数统计约每小时/)
  assert.match(content, /立即更新监控状态/)
  assert.match(content, /data-xrc-community-stats-sync/)
  assert.match(content, /data-xrc-daily-schedule/)
  assert.doesNotMatch(content, /data-xrc-daily-upload(?!-|[a-z])/)
  assert.doesNotMatch(content, /data-xrc-daily-pull/)
  assert.doesNotMatch(content, /data-xrc-daily-upload-pending/)
  assert.doesNotMatch(content, /同步云端/)
  assert.doesNotMatch(content, /上传当日报告/)
  assert.match(monitor, /自动同步日报/)
  assert.match(monitor, /Daily Sync/)
  assert.match(monitor, /DEFAULT_X_ACCOUNT = 'tarsixseveneig1'/)
  assert.match(monitor, /状态监控/)
  assert.match(monitor, /XPluginStatusDeck/)
  assert.match(monitor, /LIVE_POLL_INTERVAL_MS = 10_000/)
  assert.match(monitor, /FULL_REFRESH_INTERVAL_MS = 60_000/)
  assert.match(monitor, /可更新/)
  const statusDeck = await readFile(new URL('../../app/(admin)/admin/community-actions/monitor/XPluginStatusDeck.jsx', extensionDir), 'utf8')
  assert.match(statusDeck, /插件版本/)
  assert.match(statusDeck, /远程更新到 v/)
  assert.match(statusDeck, /ext-update/)
  assert.doesNotMatch(monitor, /本地上传报告/)
})

test('daily upload alarm starts at tomorrow 09:00 Shanghai time and retries failed uploads', async () => {
  const previousChrome = globalThis.chrome
  const previousFetch = globalThis.fetch
  const stored = {
    xrcCommunityReport: { secret: 'test-secret', deviceId: 'device-12345678', accountHandle: 'account', queue: [] },
    xrcDailyReports: [{ date: '2026-10-21', accountHandle: 'account', counts: { comments: 1 }, updatedAt: 1, uploadedAt: 0 }],
  }
  const alarms = []
  globalThis.chrome = { alarms: { async create(name, options) { alarms.push({ name, when: options.when }) } }, storage: { local: {
    async get(keys) { return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, stored[key]])) },
    async set(value) { Object.assign(stored, value) },
  } } }
  globalThis.fetch = async () => ({ ok: false, status: 503 })
  try {
    assert.equal(new Date(receipt.tomorrowShanghaiNine(Date.parse('2026-10-23T00:00:00Z'))).toISOString(), '2026-10-24T01:00:00.000Z')
    const result = await receipt.installDailyUploadSchedule()
    assert.equal(result.ok, false)
    assert.equal(result.failedDate, '2026-10-21')
    assert.ok(alarms.some((alarm) => alarm.name === 'xrc-daily-upload' && alarm.when > Date.now()))
    assert.equal(stored.xrcDailyReports[0].uploadedAt, 0)
    assert.equal(stored.xrcDailyUploadSchedule.lastResult.ok, false)
  } finally {
    globalThis.chrome = previousChrome
    globalThis.fetch = previousFetch
  }
})

test('cumulative report counts use one decimal only when needed and keep exact daily counts', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function formatCompactCount\(value\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const context = vm.createContext({})
  vm.runInContext(`${definition}\nglobalThis.compact = formatCompactCount`, context)
  for (const [value, expected] of [[0, '0'], [999, '999'], [1000, '1k'], [1099, '1k'], [1100, '1.1k'], [1204, '1.2k'], [9999, '9.9k'], [10000, '10k'], [10100, '10.1k'], [999999, '999.9k'], [1000000, '1m'], [1200000, '1.2m']]) {
    assert.equal(context.compact(value), expected)
  }
  assert.match(source, /data-xrc-report-total-\$\{metric\}\]\`\);[\s\S]*?formatCompactCount\(total\[metric\]\)/)
  assert.match(source, /data-xrc-daily-\$\{metric\}\]\`\);[\s\S]*?String\(dayCounts\[metric\]\)/)
})

test('background reset clears task state while retaining API credentials and logs', async () => {
  const saved = {
    xrcAiSettings: { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key', replyPrompt: 'old custom prompt' },
    xrcCommunityReport: { secret: 'receipt-secret', deviceId: 'device-123', queue: [{ id: 'old-event' }] },
    xrcDailyReports: [{ date: '2026-10-15', counts: { comments: 3 } }],
    xrcLimitObservations: [{ id: 'limit-event', result: 'limited' }],
    xrcPluginRuntime: { tasks: { timeline: { tabId: 11 } } },
    xrcPosterPublishList: [{ text: 'old draft' }],
    xrcPosterHistoryV2: { published: ['old-post'] },
    'xrcAutoLikeSeen:test:posts': ['123'],
  }
  const prepared = []
  const reloaded = []
  globalThis.chrome = {
    storage: { local: {
      async get(keys) { return keys === null ? { ...saved } : Object.fromEntries(keys.map((key) => [key, saved[key]])) },
      async remove(keys) { for (const key of keys) delete saved[key] },
      async set(value) { Object.assign(saved, value) },
    } },
    tabs: {
      async query() { return [{ id: 11 }, { id: 22 }] },
      async sendMessage(tabId, message) { prepared.push([tabId, message.type]); return { ok: true } },
      async reload(tabId) { reloaded.push(tabId) },
    },
  }
  try {
    const result = await background.resetExtensionState({ tab: { id: 11 } })
    assert.equal(result.ok, true)
    assert.deepEqual(prepared, [[11, 'xrc-reset-prepare'], [22, 'xrc-reset-prepare']])
    assert.deepEqual(reloaded, [22])
    assert.deepEqual(saved.xrcAiSettings, { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key' })
    assert.deepEqual(saved.xrcCommunityReport, { secret: 'receipt-secret', deviceId: 'device-123', queue: [{ id: 'old-event' }] })
    assert.deepEqual(saved.xrcDailyReports, [{ date: '2026-10-15', counts: { comments: 3 } }])
    assert.deepEqual(saved.xrcLimitObservations, [{ id: 'limit-event', result: 'limited' }])
    assert.match(saved.xrcResetEpoch, /^\d+-/)
    assert.equal(saved.xrcPluginRuntime, undefined)
    assert.equal(saved.xrcPosterPublishList, undefined)
    assert.equal(saved.xrcPosterHistoryV2, undefined)
    assert.equal(saved['xrcAutoLikeSeen:test:posts'], undefined)
  } finally {
    delete globalThis.chrome
  }
})

test('main flow keeps only the start and details controls', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /data-xrc-flow-start/)
  assert.match(source, /data-xrc-desk-home/)
  assert.match(source, /data-xrc-schedule-desk/)
  assert.doesNotMatch(source, /xrc-desk-legend/)
  assert.match(source, /data-xrc-task-subnav-label>任务子页<\/strong>\s*<button type="button" class="xrc-task-docs-link" data-xrc-task-docs/)
  assert.doesNotMatch(source, /xrc-task-docs-row/)
  assert.doesNotMatch(source, /data-xrc-reset-state|data-xrc-flow-help|data-xrc-reset-confirm/)
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(css, /\.xrc-flow-launch\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/)
})

test('memory refresh reloads only idle registered task tabs and preserves state', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.doesNotMatch(source, /data-xrc-refresh-idle-tabs/)
  const local = { xrcPluginRuntime: { tasks: { timeline: { tabId: 11, phase: 'running' } } }, xrcAutoLikeSeen: ['123'] }
  const session = { xrcTaskTabs: { timeline: 11, 'likes-posts': 22, poster: 33 } }
  const reloaded = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { return { id } },
      async reload(id) { reloaded.push(id) },
    },
  }
  try {
    const result = await background.refreshIdleTaskTabs({ tab: { id: 33 } })
    assert.deepEqual(result, { ok: true, refreshed: 1, skipped: 1, reloadCurrent: true })
    assert.deepEqual(reloaded, [22])
    assert.deepEqual(local.xrcAutoLikeSeen, ['123'])
  } finally {
    delete globalThis.chrome
  }
})

test('notification context cache drops oldest entries after 100 conversations', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function cacheNotificationContext\(id, conversation\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const context = vm.createContext({ Map, NOTIFICATION_CONTEXT_CACHE_LIMIT: 100, notificationContextCache: new Map() })
  vm.runInContext(`${helper}\nglobalThis.add = cacheNotificationContext`, context)
  for (let id = 0; id < 101; id += 1) context.add(String(id), { id })
  assert.equal(context.notificationContextCache.size, 100)
  assert.equal(context.notificationContextCache.has('0'), false)
  assert.equal(context.notificationContextCache.has('100'), true)
})

test('settings expose four editable prompt fields without a clickbait preset', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /data-xrc-reply-timeline-prompt/)
  assert.match(source, /data-xrc-reply-comment-prompt/)
  assert.match(source, /data-xrc-post-normal-prompt/)
  assert.match(source, /data-xrc-post-premium-prompt/)
  assert.doesNotMatch(source, /data-xrc-post-preset/)
  assert.match(source, /DEFAULT_REPLY_TIMELINE_PROMPT/)
  assert.match(source, /DEFAULT_POST_PREMIUM_PROMPT/)
})

test('reply-like task visits threads without liking their root posts', async () => {
  const location = { pathname: '/home' }
  const clicks = { root: 0, reply: 0 }
  const makeTweet = (id, kind) => {
    let liked = false
    const link = {
      href: `https://x.com/a/status/${id}`,
      getAttribute: () => `/a/status/${id}`,
      click: () => { location.pathname = `/a/status/${id}` },
    }
    return {
      querySelector(selector) {
        if (selector === 'time') return { closest: () => link }
        if (selector === '[data-testid="unlike"]') return liked ? {} : null
        if (selector === '[data-testid="like"]') return liked ? null : { click: () => { liked = true; clicks[kind] += 1 } }
        return null
      },
    }
  }
  const root = makeTweet('123', 'root')
  const reply = makeTweet('456', 'reply')
  const homeLink = { click: () => { location.pathname = '/home' } }
  const doc = {
    querySelector(selector) {
      if (selector === '[data-testid="primaryColumn"]') return { querySelectorAll: () => location.pathname === '/home' ? [root] : [root, reply] }
      if (selector.includes('AppTabBar_Home_Link')) return homeLink
      return null
    },
    querySelectorAll: () => [],
  }
  const saved = {}
  let limits = 0
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location, setTimeout: (callback) => { queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'test',
    target: 'replies',
    onLimit() { limits += 1 },
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.deepEqual(clicks, { root: 0, reply: 1 })
  assert.deepEqual(saved['xrcAutoLikeSeen:test:replies'], ['123'])
  assert.equal(controller.snapshot().running, false)
  assert.equal(limits, 0)
})

test('post-like task stays on Home and has its own processed history', async () => {
  const location = { pathname: '/home' }
  let clicks = 0
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click: () => { throw new Error('must not enter thread') } }
  let liked = false
  const article = {
    querySelector(selector) {
      if (selector === 'time') return { closest: () => link }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return liked ? null : { click: () => { liked = true; clicks += 1 } }
      return null
    },
  }
  const saved = {}
  let controller
  controller = autoLike.createController({
    document: {
      querySelector: () => ({ querySelectorAll: () => [article] }),
      querySelectorAll: () => [],
    },
    window: { location, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'test',
    target: 'posts',
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 1)
  assert.deepEqual(saved['xrcAutoLikeSeen:test:posts'], ['123'])
  assert.equal(location.pathname, '/home')
})

test('post likes dismiss only the X Views dialog and continue liking', async () => {
  const location = { pathname: '/home' }
  let viewsOpen = true
  let dismisses = 0
  let clickedLike = 0
  let liked = false
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return liked ? null : { click() { assert.equal(viewsOpen, false); clickedLike += 1; liked = true } }
    return null
  } }
  const dismissButton = { textContent: 'Dismiss', click() { dismisses += 1; viewsOpen = false } }
  const views = { textContent: 'Views Times this post was seen. Dismiss', querySelectorAll: () => [dismissButton] }
  const unrelated = { textContent: 'Delete post? Dismiss', querySelectorAll: () => [{ textContent: 'Dismiss', click() { throw new Error('wrong dialog') } }] }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [article] }),
    querySelectorAll(selector) { return selector.includes('[role="dialog"]') && viewsOpen ? [unrelated, views] : [] },
  }
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location, setTimeout: (callback) => queueMicrotask(callback), scrollBy() {}, innerHeight: 700 },
    storage: { async get() { return {} }, async set() {} },
    target: 'posts',
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(dismisses, 1)
  assert.equal(clickedLike, 1)
  assert.equal(controller.snapshot().count, 1)
})

test('post likes finish the configured two-round run before entering the scheduler wait', async () => {
  const originalPlan = loop.createRunPlan
  const originalDelay = loop.randomCycleDelayMs
  loop.createRunPlan = () => ({ pace: 'medium', rounds: 2, roundTargets: [1, 1], total: 2 })
  loop.randomCycleDelayMs = () => 60000
  let clock = 1000
  const articles = ['101', '102'].map((id) => {
    let liked = false
    const link = { href: `https://x.com/a/status/${id}`, getAttribute: () => `/a/status/${id}` }
    return { querySelector(selector) {
      if (selector === 'time') return { closest: () => link }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return liked ? null : { click() { liked = true } }
      return null
    } }
  })
  let controller
  const phases = []
  try {
    controller = autoLike.createController({
      document: { querySelector: () => ({ querySelectorAll: () => articles }), querySelectorAll: () => [] },
      window: { location: { pathname: '/home' }, setTimeout(callback) { clock += 1000; queueMicrotask(callback) }, scrollBy() {}, innerHeight: 700 },
      storage: { async get() { return {} }, async set() {} },
      target: 'posts', now: () => clock,
      onUpdate(snapshot) {
        phases.push({ count: snapshot.runCount, rounds: snapshot.completedRounds, waitUntil: snapshot.cooldownUntil })
        if (snapshot.cooldownUntil > clock && snapshot.completedRounds === 2) controller.stop()
      },
    })
    await controller.start()
    assert.ok(phases.some((phase) => phase.count === 1 && phase.rounds === 1 && !phase.waitUntil))
    assert.ok(phases.some((phase) => phase.count === 2 && phase.rounds === 2 && phase.waitUntil > clock - 60000))
  } finally {
    loop.createRunPlan = originalPlan
    loop.randomCycleDelayMs = originalDelay
  }
})

test('using the panel pauses auto-like clicks while Stop remains responsive', async () => {
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  let clicks = 0
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="like"]') return { click() { clicks += 1 } }
    return null
  } }
  const controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), querySelectorAll: () => [] },
    window: { location: { pathname: '/home' }, setTimeout, scrollBy() {}, innerHeight: 700 },
    storage: { async get() { return {} }, async set() {} },
    target: 'posts',
  })
  controller.pauseForInteraction(500)
  const work = controller.start()
  controller.pauseForInteraction(500)
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(clicks, 0)
  controller.stop()
  await work
  assert.equal(clicks, 0)
})

test('an unconfirmed like continues to the next post and only confirmed likes enter the daily count', async () => {
  const saved = {}
  const clicked = []
  const reported = []
  let limits = 0
  const makeTweet = (id, confirms) => {
    let liked = false
    const link = { href: `https://x.com/a/status/${id}`, getAttribute: () => `/a/status/${id}` }
    return { querySelector(selector) {
      if (selector === 'time') return { closest: () => link }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return { click() { clicked.push(id); liked = confirms } }
      return null
    } }
  }
  const articles = [makeTweet('123', false), makeTweet('456', true)]
  let controller
  controller = autoLike.createController({
    document: {
      querySelector: () => ({ querySelectorAll: () => articles }),
      querySelectorAll: () => [],
    },
    window: { location: { pathname: '/home' }, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts',
    onLike(id) { reported.push(id) },
    onLimit() { limits += 1 },
    onUpdate(snapshot) { if (snapshot.posts === 2) controller.stop() },
  })
  await controller.start()
  assert.deepEqual(clicked, ['123', '456'])
  assert.deepEqual(reported, ['456'])
  assert.equal(controller.snapshot().count, 1)
  assert.equal(limits, 0)
  assert.deepEqual(saved['xrcAutoLikeSeen:default:posts'], ['123', '456'])
})

test('a like confirmed on X replacement node is counted', async () => {
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  let replacement = false
  let restricted = false
  const original = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="like"]') return { click() { replacement = true } }
    return null
  } }
  const updated = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return {}
    return null
  } }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [replacement ? updated : original] }),
    querySelectorAll: () => restricted ? [{ textContent: 'rate limit' }] : [],
  }
  const saved = {}
  const reported = []
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location: { pathname: '/home' }, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts', onLike(id) { reported.push(id) },
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.deepEqual(reported, ['123'])
  assert.equal(controller.snapshot().count, 1)
})

test('an optimistic unlike with an automation toast counts neither post nor reply likes', async () => {
  for (const target of ['posts', 'replies']) {
    let clock = 1000
    let clicks = 0
    let warning = null
    let liked = false
    const reported = []
    const saved = {}
    const location = { pathname: '/home' }
    const rootLink = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click() { location.pathname = '/a/status/123' } }
    const replyLink = { href: 'https://x.com/b/status/456', getAttribute: () => '/b/status/456' }
    const root = { querySelector(selector) {
      if (selector === 'time') return { closest: () => rootLink }
      if (target === 'posts' && selector === '[data-testid="unlike"]') return liked ? {} : null
      if (target === 'posts' && selector === '[data-testid="like"]') return { click() { clicks += 1; liked = true; warning = { textContent: 'This request looks like it might be automated' } } }
      return null
    } }
    const reply = { querySelector(selector) {
      if (selector === 'time') return { closest: () => replyLink }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return { click() { clicks += 1; liked = true; warning = { textContent: 'This request looks like it might be automated' } } }
      return null
    } }
    const doc = {
      querySelector(selector) {
        if (selector === '[data-testid="primaryColumn"]') return { querySelectorAll: () => location.pathname === '/home' ? [root] : [root, reply] }
        return null
      },
      querySelectorAll: () => warning ? [warning] : [],
    }
    let controller
    controller = autoLike.createController({
      document: doc,
      window: { location, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
      storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
      target, now: () => clock,
      onLike(id) { reported.push(id) },
      onUpdate(snapshot) { if (snapshot.cooldownUntil > clock) controller.stop() },
    })
    await controller.start()
    assert.equal(clicks, 1, `${target}: one attempted click`)
    assert.equal(controller.snapshot().count, 0, `${target}: no confirmed success`)
    assert.deepEqual(reported, [], `${target}: no success receipt`)
    assert.equal(saved['xrcAutoLikeCooldownV2:default'].reason, 'automation')
  }
})

test('a visible automation toast stops new likes before they can be counted', async () => {
  const oldToast = { textContent: 'This request looks like it might be automated' }
  let liked = false
  let limits = 0
  let clock = 1000
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return liked ? null : { click() { liked = true } }
    return null
  } }
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), querySelectorAll: () => [oldToast] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async () => ({}), set: async () => {} },
    target: 'posts', now: () => clock, onLimit() { limits += 1 },
    onUpdate(snapshot) { if (snapshot.cooldownUntil > clock) controller.stop() },
  })
  await controller.start()
  assert.equal(liked, false)
  assert.equal(controller.snapshot().count, 0)
  assert.equal(limits, 1)
})

test('views info dialog is closed from its X button', () => {
  const clicks = []
  const close = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 12, height: 12 }),
    ownerDocument: { defaultView: { MouseEvent: class MouseEvent {}, PointerEvent: class PointerEvent {} } },
    dispatchEvent() {},
    click() { clicks.push('close') }
  }
  const dismiss = { textContent: 'Dismiss', click() { clicks.push('dismiss') } }
  const dialog = {
    textContent: 'Views Times this post was seen. To learn more, visit the Help Center.',
    querySelector: (selector) => selector.includes('aria-label="Close"') ? close : null,
    querySelectorAll: () => [dismiss]
  }
  assert.equal(autoLike.dismissViewsDialog({ querySelectorAll: () => [dialog] }), true)
  assert.deepEqual(clicks, ['close'])
  assert.equal(autoLike.dismissViewsDialog({ querySelectorAll: () => [{ textContent: 'Reply to this post' }] }), false)
})

test('old warnings and extension panel text do not count as fresh like restrictions', () => {
  const panelAlert = { textContent: 'X 提示疑似自动化', closest: () => ({}) }
  const hiddenAlert = { textContent: 'rate limit', hidden: true }
  const oldToast = { textContent: 'This request looks like it might be automated' }
  const doc = { querySelectorAll: () => [panelAlert, hiddenAlert, oldToast] }
  assert.equal(autoLike.restrictionKind(doc), 'automation')
  assert.equal(autoLike.restrictionKind(doc, new Map([[oldToast, oldToast.textContent]])), '')
  assert.equal(autoLike.restrictionKind({ querySelectorAll: () => [{ textContent: 'Please wait and try again later' }] }), '')
})

test('a persistent X warning triggers cooldown without attempting two more likes', async () => {
  let clock = 1000
  let clicks = 0
  let limits = 0
  const oldToast = { textContent: 'This request looks like it might be automated' }
  const articles = ['123', '456'].map((id) => {
    const link = { href: `https://x.com/a/status/${id}`, getAttribute: () => `/a/status/${id}` }
    return { querySelector(selector) {
      if (selector === 'time') return { closest: () => link }
      if (selector === '[data-testid="like"]') return { click() { clicks += 1 } }
      return null
    } }
  })
  const saved = {}
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => articles }), querySelectorAll: () => [oldToast] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    now: () => clock, target: 'posts', onLimit() { limits += 1 },
    onUpdate(snapshot) { if (snapshot.cooldownUntil > clock) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 0)
  assert.equal(limits, 1)
  assert.equal(saved['xrcAutoLikeCooldownV2:default'].reason, 'automation')
})

test('like count limit cools down, preserves history, then resumes without a rapid retry', async () => {
  let clock = 1000
  let limitUntil = 0
  let likes = 0
  let liked = false
  const saved = {}
  const updates = []
  const limits = []
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return liked ? null : { click() {
      likes += 1
      if (likes === 1) limitUntil = clock + 600
      else liked = true
    } }
    return null
  } }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [article] }),
    querySelectorAll: () => clock < limitUntil ? [{ textContent: 'Rate limit exceeded' }] : [],
  }
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'a', target: 'posts', now: () => clock, rateLimitCooldowns: [1000],
    onLimit(account, target, kind) { limits.push([account, target, kind]) },
    onUpdate(snapshot) { updates.push(snapshot.status); if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(likes, 2)
  assert.equal(controller.snapshot().count, 1)
  assert.equal(saved['xrcAutoLikeCooldownV2:a'].retries, 1)
  assert.deepEqual(saved['xrcAutoLikeSeen:a:posts'], ['123'])
  assert.ok(updates.some((status) => /已结束本次轮次；冷却后重新排班/.test(status)))
  assert.deepEqual(limits, [['a', 'posts', 'rate-limited']])
})

test('repeated like rate limits extend the cooldown without rapidly retrying', async () => {
  let clock = 1000
  const saved = {}
  let warning = null
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="like"]') return { click() { warning = { textContent: 'You have exceeded your limit' } } }
    return null
  } }
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), querySelectorAll: () => warning ? [warning] : [] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {} },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'a', target: 'posts', now: () => clock, rateLimitCooldowns: [10, 20, 30],
    onUpdate(snapshot) { if (snapshot.rateLimitRetries === 4 && snapshot.cooldownUntil > clock) controller.stop() },
  })
  await controller.start()
  assert.match(controller.snapshot().status, /已停止自动点赞/)
  assert.equal(controller.snapshot().rateLimitRetries, 4)
  assert.equal(saved['xrcAutoLikeCooldownV2:a'].until - saved['xrcAutoLikeCooldownV2:a'].lastLimitedAt, 24 * 60 * 60 * 1000)
})

test('a restarted like task respects the saved account cooldown before clicking', async () => {
  let clock = 1000
  let clickedAt = 0
  let liked = false
  const saved = { 'xrcAutoLikeCooldownV2:a': { until: 2000, retries: 1, lastLimitedAt: 900 } }
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return liked ? null : { click() { clickedAt = clock; liked = true } }
    return null
  } }
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), querySelectorAll: () => [] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    accountKey: 'a', target: 'posts', now: () => clock,
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.ok(clickedAt >= 2000)
  assert.equal(controller.snapshot().count, 1)
})

test('a paused like task stops promptly without clicking another post', async () => {
  let clock = 1000
  let clicks = 0
  const saved = { 'xrcAutoLikeCooldownV2:a': { until: 3601000, retries: 1, lastLimitedAt: 900 } }
  let controller
  controller = autoLike.createController({
    document: { querySelector: () => ({ querySelectorAll: () => [{ querySelector: () => ({ click() { clicks += 1 } }) }] }), querySelectorAll: () => [] },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; controller.stop(); queueMicrotask(callback) }, scrollBy: () => {} },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async () => {} },
    accountKey: 'a', target: 'posts', now: () => clock,
  })
  await controller.start()
  assert.equal(clicks, 0)
  assert.equal(controller.snapshot().running, false)
  assert.ok(clock < 3601000)
})

test('reply-like task retries a temporary thread navigation failure without stopping', async () => {
  const location = { pathname: '/home' }
  let opens = 0
  let liked = false
  const rootLink = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click() {
    opens += 1
    if (opens === 1) throw new Error('X page still loading')
    location.pathname = '/a/status/123'
  } }
  const replyLink = { href: 'https://x.com/b/status/456', getAttribute: () => '/b/status/456' }
  const root = { querySelector(selector) { return selector === 'time' ? { closest: () => rootLink } : null } }
  const reply = { querySelector(selector) {
    if (selector === 'time') return { closest: () => replyLink }
    if (selector === '[data-testid="unlike"]') return liked ? {} : null
    if (selector === '[data-testid="like"]') return { click() { liked = true } }
    return null
  } }
  const doc = {
    querySelector(selector) {
      if (selector === '[data-testid="primaryColumn"]') return { querySelectorAll: () => location.pathname === '/home' ? [root] : [root, reply] }
      if (selector.includes('AppTabBar_Home_Link')) return { click() { location.pathname = '/home' } }
      return null
    },
    querySelectorAll: () => [],
  }
  let controller
  controller = autoLike.createController({
    document: doc,
    window: { location, setTimeout: (callback) => queueMicrotask(callback), scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async () => ({}), set: async () => {} },
    target: 'replies',
    onUpdate(snapshot) { if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(opens, 2)
  assert.equal(controller.snapshot().count, 1)
  assert.equal(controller.snapshot().posts, 1)
})

test('auto-like cools down after an automation warning and retries when it clears', async () => {
  let clock = 1000
  let clicks = 0
  let liked = false
  let warningUntil = 0
  let warning = null
  const updates = []
  const saved = {}
  let controller
  const article = {
    querySelector(selector) {
      if (selector === 'time') return { closest: () => ({ href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123', click: () => {} }) }
      if (selector === '[data-testid="unlike"]') return liked ? {} : null
      if (selector === '[data-testid="like"]') return liked ? null : { click: () => {
        clicks += 1
        if (clicks === 1) {
          warningUntil = clock + 600
          warning = { textContent: 'This request looks like it might be automated' }
        } else liked = true
      } }
      return null
    },
  }
  const doc = {
    querySelector: () => ({ querySelectorAll: () => [article] }),
    querySelectorAll: () => clock < warningUntil ? [warning] : [],
  }
  controller = autoLike.createController({
    document: doc,
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {}, innerHeight: 700 },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts', now: () => clock, rateLimitCooldowns: [200],
    onUpdate(snapshot) { updates.push(snapshot.status); if (snapshot.posts === 1) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 2)
  assert.ok(updates.some((status) => /已结束本次轮次；冷却后重新排班/.test(status)))
  assert.equal(saved['xrcAutoLikeCooldownV2:default'].reason, 'automation')
  assert.ok(saved['xrcAutoLikeCooldownV2:default'].until > 601000)
  assert.deepEqual(saved['xrcAutoLikeSeen:default:posts'], ['123'])
  assert.equal(controller.snapshot().running, false)
  assert.equal(controller.snapshot().count, 1)
})

test('an automation cooldown can be stopped without clicking a like', async () => {
  let clock = 1000
  let clicks = 0
  const saved = {}
  let warning = null
  const link = { href: 'https://x.com/a/status/123', getAttribute: () => '/a/status/123' }
  const article = { querySelector(selector) {
    if (selector === 'time') return { closest: () => link }
    if (selector === '[data-testid="like"]') return { click() { clicks += 1; warning = { textContent: 'This request looks like it might be automated' } } }
    return null
  } }
  let controller
  controller = autoLike.createController({
    document: {
      querySelector: () => ({ querySelectorAll: () => [article] }),
      querySelectorAll: () => warning ? [warning] : [],
    },
    window: { location: { pathname: '/home' }, setTimeout(callback, ms) { clock += ms; queueMicrotask(callback) }, scrollBy: () => {} },
    storage: { get: async (key) => ({ [key]: saved[key] }), set: async (value) => Object.assign(saved, value) },
    target: 'posts', now: () => clock, rateLimitCooldowns: [5000],
    onUpdate(snapshot) { if (snapshot.cooldownUntil > clock) controller.stop() },
  })
  await controller.start()
  assert.equal(clicks, 1)
  assert.equal(controller.snapshot().running, false)
  assert.equal(saved['xrcAutoLikeCooldownV2:default'].reason, 'automation')
  assert.ok(saved['xrcAutoLikeCooldownV2:default'].until > clock)
})

test('settings auto-save batches edits and flushes before a task starts', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helpers = source.match(/  function scheduleConfigSave\([\s\S]*?(?=\n  async function loadPosterPace\()/)?.[0]
  assert.ok(helpers)
  const timers = new Map()
  let nextTimer = 0
  let saves = 0
  const panel = { querySelector: () => ({ textContent: '' }) }
  const context = vm.createContext({
    Promise,
    panel,
    document: { getElementById: () => panel },
    PANEL_ID: 'x-reply-clipboard-panel',
    saveConfigForm: async () => { saves += 1; return true },
    window: {
      setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id },
      clearTimeout(id) { timers.delete(id) },
    },
  })
  vm.runInContext(`let configSaveTimer = 0; let configSavePromise = Promise.resolve(); ${helpers}`, context)
  vm.runInContext('scheduleConfigSave(panel); scheduleConfigSave(panel)', context)
  assert.equal(timers.size, 1)
  assert.equal(saves, 0)
  const [timerId, callback] = [...timers.entries()][0]
  timers.delete(timerId)
  callback()
  await vm.runInContext('configSavePromise', context)
  assert.equal(saves, 1)
  vm.runInContext('scheduleConfigSave(panel)', context)
  await vm.runInContext('flushConfigSave()', context)
  assert.equal(saves, 2)
  assert.equal(timers.size, 0)
})

test('PDF toolbox exports only the tweet matching the current status URL', async () => {
  const source = await readFile(new URL('tweetPdf.js', extensionDir), 'utf8')
  const makeArticle = (id, body) => ({
    querySelectorAll(selector) {
      if (selector === 'a[href*="/status/"]') return [{ href: `https://x.com/author/status/${id}`, getAttribute: () => `/author/status/${id}` }]
      return []
    },
    querySelector(selector) {
      if (selector === '[data-testid="tweetText"]') return { innerText: body }
      return null
    },
  })
  const stored = {}
  const messages = []
  const context = vm.createContext({
    URL,
    URLSearchParams,
    window: { location: { pathname: '/author/status/123', origin: 'https://x.com', href: 'https://x.com/author/status/123' } },
    document: { querySelectorAll: () => [makeArticle('456', 'other tweet'), makeArticle('123', 'correct tweet')] },
    chrome: {
      storage: { local: {
        async get(key) { return { [key]: stored[key] } },
        async set(values) { Object.assign(stored, values) },
        async remove(keys) { keys.forEach((key) => delete stored[key]) },
      } },
      runtime: { async sendMessage(message) { messages.push(message); return { ok: true } } },
    },
  })
  vm.runInContext(source, context)
  const tweet = await context.XrcTweetPdf.exportCurrent()
  assert.equal(tweet.text, 'correct tweet')
  assert.equal(tweet.sourceUrl, 'https://x.com/author/status/123')
  assert.equal(stored[messages[0].exportId].tweet.text, 'correct tweet')

  context.document.querySelectorAll = () => [makeArticle('456', 'other tweet')]
  assert.throws(() => context.XrcTweetPdf.extractTweet(), /还没找到当前这条推文/)
})

test('manual reply start is available for waits and stopped tasks, but not while stopping', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function canStartReplyNow\([\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { running: true, stopping: false, riskPaused: false, reconnectAt: 0, nextCycleAt: 0, nextRoundAt: 2000, waitUntil: 0, loopPromise: null, status: '' }
  const eligible = () => vm.runInNewContext(`${helper}\ncanStartReplyNow(1000)`, { state, riskRoundAdvancing: true })
  assert.equal(eligible(), true)
  state.nextRoundAt = 0
  state.reconnectAt = 1500
  assert.equal(eligible(), true)
  state.reconnectAt = 0
  state.waitUntil = 1500
  assert.equal(eligible(), true)
  state.waitUntil = 0
  state.running = false
  state.status = '已停止'
  assert.equal(eligible(), true)
  state.status = ''
  state.riskPaused = true
  assert.equal(eligible(), true)
  state.loopPromise = {}
  assert.equal(eligible(), false)
})

test('manual reply start clears a reconnect countdown and wakes its waiting loop', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function canStartReplyNow\([\s\S]*?\n  \}/)?.[0]
  const action = source.match(/  function startReplyNow\([\s\S]*?\n  \}/)?.[0]
  assert.ok(helper && action)
  const state = { running: true, stopping: false, riskPaused: false, reconnectAt: Date.now() + 60000, reconnectReason: '页面异常', nextCycleAt: 0, nextRoundAt: 0, waitUntil: 0, total: 3, status: '' }
  const calls = { wake: 0, saved: 0, restarted: 0 }
  const context = vm.createContext({
    state,
    Date,
    skipScheduledWait: false,
    writeSaved() { calls.saved += 1 },
    renderPanel() {},
    wakeScheduledWait() { calls.wake += 1 },
    onToggle() { calls.restarted += 1 },
  })
  vm.runInContext(`${helper}\n${action}\nstartReplyNow()`, context)
  assert.equal(state.reconnectAt, 0)
  assert.equal(state.reconnectReason, '')
  assert.equal(context.skipScheduledWait, true)
  assert.equal(calls.wake, 1)
  assert.equal(calls.saved, 1)
  state.running = false
  state.status = '已停止'
  vm.runInContext('startReplyNow()', context)
  assert.equal(calls.restarted, 1)
})

test('reply reconnect backs off quickly and caps its retry interval', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function reconnectDelay\(attempt\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const context = vm.createContext({ RECONNECT_INITIAL_MS: 2000, RECONNECT_MAX_MS: 30000 })
  vm.runInContext(helper, context)
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((attempt) => vm.runInContext(`reconnectDelay(${attempt})`, context)), [2000, 4000, 8000, 16000, 30000, 30000])
})

test('explicit in-place reconnect keeps the draft on the same X page', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function reconnectAndResume\([\s\S]*?(?=\n  async function waitRateLimit\()/)?.[0]
  assert.ok(helper)
  const state = { running: true, stopping: false, total: 0, pendingReply: '待重试的回复', pendingTweetId: '123', reconnectAt: 0, reconnectReason: '', status: '' }
  let reloads = 0
  let closes = 0
  const context = vm.createContext({
    state, Date, reconnectOnline: true, skipScheduledWait: false,
    reconnectDelay: () => 0, sleep: async () => {}, xIsReachable: async () => true,
    closeReplyComposer: async () => { closes += 1; return true },
    waitUntil: async () => true, transientErrorVisible: () => false,
    reloadAndResume: async () => { reloads += 1; return true },
    writeSaved() {}, renderPanel() {}, formatCountdown: () => '', reportCommunityAction() {},
  })
  vm.runInContext(helper, context)
  const result = await vm.runInContext('reconnectAndResume("X 暂时出错", { inPlace: true })', context)
  assert.equal(result, 'resume')
  assert.equal(closes, 1)
  assert.equal(reloads, 0)
  assert.equal(state.pendingReply, '待重试的回复')
  assert.equal(state.pendingTweetId, '123')
})

test('a failed X reply is recorded as skipped without increasing the success count', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function skipTransientReply\(tweet\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { assistantMode: 'timeline', total: 34, errors: 0, pendingReply: '未发出的草稿', pendingTweetId: '456', status: '' }
  const skippedIds = new Set()
  const processedIds = new Set()
  const reports = []
  let saved
  let closes = 0
  const sandbox = vm.createContext({
    state, skippedIds, processedIds,
    reportCommunityAction: (event) => reports.push(event),
    writeSaved: (value) => { saved = value },
    closeReplyComposer: async () => { closes += 1; return true },
    renderPanel() {},
  })
  vm.runInContext(helper, sandbox)
  assert.equal(await vm.runInContext('skipTransientReply({ id: "456" })', sandbox), true)
  assert.equal(skippedIds.has('456'), true)
  assert.equal(processedIds.has('456'), true)
  assert.equal(state.total, 34)
  assert.equal(state.pendingReply, '')
  assert.equal(state.pendingTweetId, '')
  assert.equal(state.errors, 1)
  assert.equal(closes, 1)
  assert.equal(saved.total, 34)
  assert.equal(reports[0].errorCode, 'x-transient-error')
})

test('reply submission detects an X error inside the existing composer dialog', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function publishReply\(composer, replyText\) \{[\s\S]*?(?=\n  async function replyOnce\()/)?.[0]
  assert.ok(helper)
  const alert = { text: '' }
  const composer = { dialog: { isConnected: true }, textbox: { isConnected: true }, submit: {} }
  let clicks = 0
  const sandbox = vm.createContext({
    state: { stopping: false },
    SUBMIT_TIMEOUT_MS: 5000, SEND_START_TIMEOUT_MS: 2500, SEND_CONFIRM_TIMEOUT_MS: 5000,
    loopApi: { composerText: () => '待发送回复', normalizePhraseText: (text) => text, isSubmitEnabled: () => true },
    ensureReplyComposerText: async () => true,
    findReplyRestrictionDialog: () => false, unavailablePostInDialog: () => false,
    transientErrorVisible: () => Boolean(alert.text),
    transientErrorNodes: () => alert.text ? [alert] : [],
    textOf: (node) => node.text,
    findDialogComposer: () => composer, waitUntil: async (predicate) => predicate(),
    successNoticeNodes: () => [], unavailablePostToasts: () => [], unavailablePostVisible: () => false,
    automationWarningNodes: () => [], duplicateReplyWarningVisible: () => false,
    realClick: () => { clicks += 1; alert.text = 'Something went wrong, but don’t fret — let’s give it another shot.' },
  })
  vm.runInContext(`${helper}\nglobalThis.publish = publishReply`, sandbox)
  assert.equal(await sandbox.publish(composer, '待发送回复'), 'transient-error')
  assert.equal(clicks, 1)
  assert.equal(await sandbox.publish(composer, '待发送回复'), 'transient-error')
  assert.equal(clicks, 1)
})

test('persistent X send errors end the reply task with a visible reason', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function endReplyTaskAfterTransientError\(message\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { running: true, stopping: false, pendingReply: '未发草稿', pendingTweetId: '123', status: '' }
  let cleared = 0
  let rendered = 0
  const sandbox = vm.createContext({ state, clearSaved: () => { cleared += 1 }, renderPanel: () => { rendered += 1 } })
  vm.runInContext(`${helper}\nglobalThis.end = endReplyTaskAfterTransientError`, sandbox)
  assert.equal(sandbox.end('X 仍显示发送错误；评论任务已结束'), 'stopped')
  assert.equal(state.running, false)
  assert.equal(state.pendingReply, '')
  assert.equal(state.status, 'X 仍显示发送错误；评论任务已结束')
  assert.equal(cleared, 1)
  assert.equal(rendered, 1)
})

test('a restricted reply clears its managed draft immediately and enters a timed retry', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  function applyRiskStop\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { assistantMode: 'timeline', loopPromise: {}, running: true, stopping: false, riskPaused: false, riskCooldownUntil: 0, riskRetries: 0, status: '', total: 0, pendingReply: '尚未发出的回复', pendingTweetId: '123' }
  const calls = { like: 0, mutual: 0, poster: 0, canceled: 0, saved: 0 }
  const acknowledgedAutomationNotices = new WeakMap()
  const sandbox = vm.createContext({
    state, Date: { now: () => 1000 }, loopApi: { automationCooldownMs: (retries) => retries * 600000 },
    automationWarningNodes: () => [], acknowledgedAutomationNotices,
    mutualApi: { coolDownForRisk() { calls.mutual += 1 } }, postApi: { coolDownForRisk() { calls.poster += 1 } },
    prepareReplyForTabSwitch: async () => true,
    cancelActiveAiRequest() { calls.canceled += 1 }, writeSaved() { calls.saved += 1 },
    formatCountdown: () => '10:00', renderPanel() {},
  })
  vm.runInContext(`function isPosterMode(mode) { const current = mode === undefined ? state.assistantMode : mode; return current === "poster" || current === "poster-premium"; }\nlet riskRoundRequested = false;\n${helper}\nglobalThis.cool = applyRiskStop; globalThis.requested = () => riskRoundRequested`, sandbox)
  sandbox.cool()
  assert.equal(state.running, true)
  assert.equal(state.riskPaused, true)
  assert.equal(state.riskCooldownUntil, 601000)
  assert.equal(sandbox.requested(), true)
  assert.equal(state.pendingReply, '尚未发出的回复')
  assert.equal(state.pendingTweetId, '123')
  assert.match(state.status, /后自动重试/)
  assert.deepEqual(calls, { like: 0, mutual: 0, poster: 0, canceled: 1, saved: 1 })
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(state.pendingReply, '')
  assert.equal(state.pendingTweetId, '')
  assert.equal(calls.saved, 2)
  sandbox.cool()
  assert.equal(calls.canceled, 1)
  state.riskCooldownUntil = 0
  sandbox.cool()
  assert.equal(state.riskCooldownUntil, 1201000)
  state.assistantMode = 'mutual'
  sandbox.cool()
  assert.equal(calls.mutual, 1)
  state.assistantMode = 'poster'
  sandbox.cool()
  assert.equal(calls.poster, 1)
  const likeLimitHandler = source.match(/        onLimit\(_accountKey, target, errorCode\) \{[\s\S]*?\n        \},/)?.[0]
  assert.ok(likeLimitHandler)
  assert.match(likeLimitHandler, /currentAccountHandle\(\) \|\| lastKnownAccountHandle/)
  assert.doesNotMatch(likeLimitHandler, /xrc-flow-pause/)
})

test('a restricted reply waits for its deadline then resumes the same task', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const helper = source.match(/  async function advanceRoundAfterRisk\([\s\S]*?\n  \}/)?.[0]
  assert.ok(helper)
  const state = { assistantMode: 'timeline', running: true, stopping: false, riskCooldownUntil: 601000, riskRetries: 1, riskPaused: true, total: 3 }
  let waitedUntil = 0
  let reloaded = 0
  const sandbox = vm.createContext({
    state, loopApi: loop, Date: { now: () => 1000 }, writeSaved() {}, formatCountdown: () => '10:00',
    async waitForDeadline(deadline, status) { waitedUntil = deadline; assert.match(status(600000), /自动重试/); return true },
    async prepareReplyForTabSwitch() { return true },
    async reloadAndResume() { reloaded += 1; return true },
  })
  vm.runInContext(`let riskRoundRequested = true; let riskRoundAdvancing = false;\n${helper}\nglobalThis.resume = advanceRoundAfterRisk; globalThis.pending = () => riskRoundRequested`, sandbox)
  assert.equal(await sandbox.resume(), 'reload')
  assert.equal(waitedUntil, 601000)
  assert.equal(reloaded, 1)
  assert.equal(state.riskCooldownUntil, 0)
  assert.equal(state.riskPaused, false)
  assert.equal(sandbox.pending(), false)
})

test('reply handoff clears a managed composer before navigation and keeps an idle user draft in place', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const prepare = source.match(/  async function prepareReplyForTabSwitch\(\) \{[\s\S]*?\n  \}/)?.[0]
  const reload = source.match(/  async function reloadManagedReplyDraft\(message\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(prepare && reload)
  let draft = '扩展生成但未发送'
  let closes = 0
  let reloads = 0
  let allowClose = false
  const editor = { closest: () => null }
  const state = { pendingReply: draft, status: '', total: 0, running: false }
  const dialog = { textbox: editor, dialog: { querySelector: () => null } }
  const context = vm.createContext({
    state, PANEL_ID: 'xrc-panel', REPLY_EDITOR_SELECTOR: '[role="textbox"]',
    taskSchedule: { enabled: false, current: '' },
    findDialogComposer: () => draft ? dialog : null,
    async closeReplyComposer() { closes += 1; if (!allowClose) return false; draft = ''; return true },
    async clearInlineReplyEditors() { return !draft },
    automationOwnsReplyDraft: () => Boolean(state.running),
    document: { querySelectorAll: () => draft ? [editor] : [] },
    loopApi: { composerText: () => draft }, isManagedDraft: () => true,
    writeSaved() {}, renderPanel() {}, window: { location: { reload() { reloads += 1 } } },
  })
  vm.runInContext(`let replyComposerCleanup = null;\n${prepare}\n${reload}\nglobalThis.prepare = prepareReplyForTabSwitch; globalThis.reload = reloadManagedReplyDraft`, context)
  assert.equal(await context.prepare(), false)
  assert.equal(await context.reload('等待安全重试'), false)
  assert.equal(reloads, 0)
  allowClose = true
  assert.equal(await context.reload('已清理草稿'), true)
  assert.equal(reloads, 1)
  assert.ok(closes >= 2)
  draft = '用户尚未发送的内容'
  allowClose = false
  state.running = false
  assert.equal(await context.prepare(), false)
})

test('a blocked reply composer releases the schedule slot without discarding a user draft', async () => {
  for (const response of [
    { ok: false, errorCode: 'composer-cleanup-failed' },
    { ok: false, errorCode: 'user-draft' },
    { ok: false, error: '当前动作尚未安全结束' },
  ]) {
    const tabId = 303
    const session = { xrcTaskTabs: { timeline: tabId } }
    const local = {
      xrcTaskSchedule: { enabled: true, strategyVersion: 4, current: 'timeline', workTabId: tabId, items: {} },
      xrcPluginRuntime: { tasks: { timeline: { tabId, phase: 'paused' } } },
    }
    const removed = []
    globalThis.chrome = {
      storage: {
        session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
        local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      },
      tabs: {
        async get(id) { return { id } },
        async sendMessage() { return response },
        async remove(id) { removed.push(id) },
      },
    }
    try {
      assert.equal(await background.suspendScheduledTask('timeline', 'X 受限，切换任务', { keepTab: true, releaseOnFailure: true }), true)
      assert.deepEqual(removed, [])
      assert.deepEqual(session.xrcTaskTabs, {})
      assert.equal(local.xrcTaskSchedule.workTabId, 0)
      assert.deepEqual(local.xrcTaskSchedule.detachedReplyTabIds, [tabId])
      assert.equal(local.xrcPluginRuntime.tasks.timeline, undefined)
    } finally { delete globalThis.chrome }
  }
})

test('an unreachable reply tab cannot hold the schedule slot', async () => {
  const tabId = 404
  const session = { xrcTaskTabs: { notifications: tabId } }
  const local = {
    xrcTaskSchedule: { enabled: true, strategyVersion: 4, current: 'notifications', workTabId: tabId, items: {} },
    xrcPluginRuntime: { tasks: { notifications: { tabId, phase: 'paused' } } },
  }
  const removed = []
  globalThis.chrome = {
    storage: {
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
    },
    tabs: {
      async get(id) { return { id } },
      async sendMessage() { throw new Error('tab blocked by dialog') },
      async remove(id) { removed.push(id) },
    },
  }
  try {
    assert.equal(await background.suspendScheduledTask('notifications', '切换任务', { releaseOnFailure: true }), true)
    assert.deepEqual(removed, [])
    assert.equal(local.xrcTaskSchedule.workTabId, 0)
    assert.deepEqual(local.xrcTaskSchedule.detachedReplyTabIds, [tabId])
  } finally { delete globalThis.chrome }
})

test('a failed reply cleanup lets the scheduler start the next due task', async () => {
  const firstId = 505
  const now = Date.now()
  const session = { xrcTaskTabs: { timeline: firstId } }
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, accountHandle: 'tuaran', current: 'timeline',
      workTabId: firstId, startedAt: now, items: {},
      rules: { 'poster-premium': { enabled: false } },
    },
    xrcPluginRuntime: { flow: { phase: 'running', updatedAt: now }, tasks: {
      timeline: { tabId: firstId, phase: 'paused', waitUntil: now + 3600000, detail: 'X 限制冷却', updatedAt: now },
    } },
  }
  const tabs = new Map([[firstId, { id: firstId, windowId: firstId, url: 'https://x.com/home' }]])
  let nextId = firstId
  globalThis.chrome = {
    storage: {
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
    },
    tabs: {
      async query() { return tabs.has(firstId) ? [tabs.get(firstId)] : [] },
      async get(id) { if (!tabs.has(id)) throw new Error('closed'); return tabs.get(id) },
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-suspend') return { ok: false, errorCode: 'composer-cleanup-failed' }
        return { ok: true, mode: id === firstId ? 'timeline' : 'notifications', phase: id === firstId ? 'paused' : 'running', waitUntil: id === firstId ? now + 3600000 : 0 }
      },
      async remove(id) { tabs.delete(id) },
      async update(id, options) { tabs.set(id, { ...tabs.get(id), ...options }) },
      async create({ url }) { const id = ++nextId; const tab = { id, windowId: id, url }; tabs.set(id, tab); return tab },
    },
    windows: { async create({ url }) { const id = ++nextId; const tab = { id, windowId: id, url }; tabs.set(id, tab); return { id, tabs: [tab] } } },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(tabs.has(firstId), true)
    assert.equal(local.xrcTaskSchedule.current, 'notifications')
    assert.ok(local.xrcTaskSchedule.items.timeline.resumeAt > now)
    assert.notEqual(local.xrcTaskSchedule.workTabId, firstId)
    assert.deepEqual(local.xrcTaskSchedule.detachedReplyTabIds, [firstId])
  } finally { delete globalThis.chrome }
})

test('offscreen timer message wakes a wait without relying on the page timer', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const listeners = []
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        id: "test-extension",
        lastError: null,
        onMessage: { addListener(listener) { listeners.push(listener) } },
        sendMessage(message, callback) {
          callback({ ok: true })
          setTimeout(() => {
            for (const listener of listeners) {
              listener({ type: 'xrc-timer-fired', requestId: message.requestId })
            }
          }, 5)
        },
      },
    },
  })
  vm.runInContext(source, context)

  const startedAt = Date.now()
  await context.XInteractionTimer.wait(1000)
  assert.ok(Date.now() - startedAt < 250)
})

test('background timer keeps its originating tab and routes the wake-up back to that content script', async () => {
  const runtimeMessages = []
  const tabMessages = []
  globalThis.chrome = {
    offscreen: { async createDocument() {} },
    runtime: {
      getURL(pathname) { return `chrome-extension://test/${pathname}` },
      async getContexts() { return [{ contextType: 'OFFSCREEN_DOCUMENT' }] },
      async sendMessage(message) { runtimeMessages.push(message) },
    },
    tabs: {
      async sendMessage(tabId, message, options) { tabMessages.push({ tabId, message, options }) },
    },
  }

  try {
    await background.scheduleBackgroundTimer(
      { requestId: 'timer-1', delayMs: 2000 },
      { tab: { id: 42 }, frameId: 0 },
    )
    assert.deepEqual(runtimeMessages, [{
      type: 'xrc-offscreen-schedule',
      requestId: 'timer-1',
      delayMs: 2000,
      tabId: 42,
      frameId: 0,
    }])

    await background.deliverBackgroundTimer({ requestId: 'timer-1', tabId: 42, frameId: 0 })
    assert.deepEqual(tabMessages, [{
      tabId: 42,
      message: { type: 'xrc-timer-fired', requestId: 'timer-1' },
      options: { frameId: 0 },
    }])
  } finally {
    delete globalThis.chrome
  }
})

test('plugin stable runtime spans multiple task tabs and stops only after the final task stops', async () => {
  let savedRuntime = null
  const existingTabs = new Set([11, 22])
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) { return { [key]: savedRuntime } },
        async set(value) { savedRuntime = value.xrcPluginRuntime },
      },
    },
    tabs: {
      async get(tabId) {
        if (!existingTabs.has(tabId)) throw new Error('tab closed')
        return { id: tabId }
      },
    },
  }

  try {
    const first = await background.updatePluginRuntime(
      { mode: 'timeline', active: true },
      { tab: { id: 11 } },
    )
    const stableStartedAt = first.runtime.startedAt
    assert.ok(stableStartedAt > 0)

    const second = await background.updatePluginRuntime(
      { mode: 'notifications', active: true },
      { tab: { id: 22 } },
    )
    assert.equal(second.runtime.startedAt, stableStartedAt)
    assert.deepEqual(Object.keys(second.runtime.tasks).sort(), ['notifications', 'timeline'])

    await background.updatePluginRuntime({ mode: 'timeline', active: false }, { tab: { id: 22 } })
    assert.ok(savedRuntime.tasks.timeline, 'an idle tab must not clear another tab\'s running task')

    await background.updatePluginRuntime({ mode: 'timeline', active: false }, { tab: { id: 11 } })
    assert.equal(savedRuntime.startedAt, stableStartedAt)
    assert.deepEqual(Object.keys(savedRuntime.tasks), ['notifications'])

    await background.updatePluginRuntime({ mode: 'notifications', active: false }, { tab: { id: 22 } })
    assert.equal(savedRuntime.startedAt, null)
    assert.deepEqual(savedRuntime.tasks, {})
  } finally {
    delete globalThis.chrome
  }
})

test('task detail probes show the owning tab state instead of a live but idle tab record', async () => {
  globalThis.chrome = {
    tabs: {
      async sendMessage(tabId, message) {
        assert.equal(message.type, 'xrc-task-state-probe')
        if (tabId === 11) return { ok: true, mode: 'timeline', phase: '' }
        if (tabId === 22) return { ok: true, mode: 'notifications', phase: 'paused', detail: '下一轮 5 分钟后', waitUntil: 5000 }
        if (tabId === 44) return { ok: true, mode: 'timeline', phase: 'running' }
        throw new Error('task tab has no content script')
      },
    },
  }
  try {
    const runtime = await background.verifyTaskRuntime({
      startedAt: 100,
      flow: { phase: 'running' },
      tasks: {
        timeline: { tabId: 11, phase: 'running', updatedAt: 100 },
        notifications: { tabId: 22, phase: 'running', updatedAt: 100 },
        poster: { tabId: 33, phase: 'running', updatedAt: 100 },
        'likes-posts': { tabId: 44, phase: 'running', updatedAt: 100 },
      },
    }, 20000)
    assert.equal(runtime.tasks.timeline, undefined)
    assert.equal(runtime.tasks.notifications.phase, 'paused')
    assert.equal(runtime.tasks.notifications.detail, '下一轮 5 分钟后')
    assert.equal(runtime.tasks.poster.phase, 'unknown')
    assert.equal(runtime.tasks['likes-posts'], undefined)
  } finally {
    delete globalThis.chrome
  }
})

test('an invalidated extension timer falls back to the page timer', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        id: "test-extension",
        lastError: null,
        onMessage: { addListener() {} },
        sendMessage(_message, callback) {
          const error = new Error("Extension context invalidated.")
          this.lastError = error
          callback()
          this.lastError = null
          return Promise.reject(error)
        },
      },
    },
  })
  vm.runInContext(source, context)
  const startedAt = Date.now()
  await context.XInteractionTimer.wait(1000)
  assert.ok(Date.now() - startedAt >= 900)
  assert.ok(Date.now() - startedAt < 1800)
})

test('short DOM polling stays local instead of flooding the offscreen timer channel', async () => {
  const source = await readFile(new URL('timer.js', extensionDir), 'utf8')
  let sent = 0
  const context = vm.createContext({
    window: { setTimeout, clearTimeout },
    chrome: {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage() { sent += 1 },
      },
    },
  })
  vm.runInContext(source, context)
  await context.XInteractionTimer.wait(5)
  assert.equal(context.XInteractionTimer.BACKGROUND_TIMER_MIN_MS, 1000)
  assert.equal(sent, 0)
})

test('post pace editor uses real POST_SCHEDULE_PROFILES fields, not undefined minutes', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const paceNumber = source.match(/  function paceNumberValue\(value, fallback\) \{[\s\S]*?\n  \}/)?.[0]
  const postHtml = source.match(/  function postPaceEditorHtml\(\) \{[\s\S]*?\n  \}/)?.[0]
  const limits = source.match(/  const POST_PACE_LIMITS = \{[\s\S]*?\n  \};/)?.[0]
  const pairs = source.match(/  const POST_PACE_PAIRS = \[[\s\S]*?\];/)?.[0]
  assert.ok(paceNumber && postHtml && limits && pairs)
  const sandbox = vm.createContext({ postApi: poster })
  vm.runInContext(`${limits}\n${pairs}\n${paceNumber}\n${postHtml}\nglobalThis.html = postPaceEditorHtml()`, sandbox)
  assert.doesNotMatch(sandbox.html, /value="undefined"/)
  assert.match(sandbox.html, /data-field="minCycleMinutes"/)
  assert.match(sandbox.html, /data-field="minBatch"/)
  assert.match(sandbox.html, /value="45"/)
})

test('AI poster uses short within-batch gaps and larger peak session batches', async () => {
  assert.equal(poster.randomPostGapMs(() => 0, 'medium'), 10 * 1000)
  assert.ok(poster.randomPostGapMs(() => 0.999999, 'medium') <= 18 * 1000)
  assert.equal(poster.randomIntervalMs(() => 0, 'slow'), 12 * 1000)
  assert.equal(poster.randomIntervalMs(() => 1, 'turbo'), 12 * 1000)
  assert.equal(poster.randomIntervalMs(() => 0, 'fast'), 8 * 1000)
  assert.equal(poster.DEFAULT_POST_PACE, 'slow')
  assert.equal(poster.postScheduleProfile('missing').id, 'slow')
  assert.equal(poster.formatPostSchedule('fast').interval, '条间 8～15 秒 · 每次 16～24 条')
  assert.equal(poster.formatPostSchedule('medium').wave, '高峰一次多抓 · 低峰一次少抓')
  assert.equal(poster.minutesToPostWavePeak(8 * 60), 0)
  assert.equal(poster.minutesToPostWavePeak(12 * 60 + 45), 0)
  assert.equal(poster.minutesToPostWavePeak(19 * 60), 0)
  assert.equal(poster.postWaveFactor(Date.parse('2026-10-28T08:30:00+08:00')), 0.55)
  assert.ok(poster.postWaveFactor(Date.parse('2026-10-28T03:00:00+08:00')) > 2)
  const withinBatch = poster.scheduleNextNormalPostAt(Date.parse('2026-10-28T08:00:00+08:00'), () => 0, 'medium', { queueRemaining: 3 })
    - Date.parse('2026-10-28T08:00:00+08:00')
  assert.ok(withinBatch >= 10 * 1000 && withinBatch <= 18 * 1000)
  const peakBatch = poster.sessionBatchSize(() => 0.999999, 'turbo', Date.parse('2026-10-28T08:30:00+08:00'))
  const offPeakSlow = poster.sessionBatchSize(() => 0, 'slow', Date.parse('2026-10-28T03:00:00+08:00'))
  assert.ok(peakBatch >= 20 && peakBatch <= 30)
  assert.ok(offPeakSlow >= 5 && offPeakSlow <= 10)
  const peakCycle = poster.scheduleNextNormalPostAt(Date.parse('2026-10-28T08:00:00+08:00'), () => 0, 'medium', { queueRemaining: 0 })
    - Date.parse('2026-10-28T08:00:00+08:00')
  const offPeakCycle = poster.scheduleNextNormalPostAt(Date.parse('2026-10-28T03:00:00+08:00'), () => 0, 'medium', { queueRemaining: 0 })
    - Date.parse('2026-10-28T03:00:00+08:00')
  assert.ok(peakCycle < offPeakCycle)
  const posterSource = await readFile(new URL('poster.js', extensionDir), 'utf8')
  assert.match(posterSource, /scheduleNextNormalPostAt\(Date\.now\(\), Math\.random, state\.schedulePace, \{\s*queueRemaining: state\.publishQueue\.length/)
  assert.equal(poster.snapshot().nextPostAt, 0)
  poster.setSchedulePace('turbo')
  assert.equal(poster.snapshot().schedulePace, 'turbo')
  assert.equal(poster.snapshot().nextPostAt, 0)
  poster.setSchedulePace('medium')
  assert.equal(poster.formatPost('推文：第一行\n第二行\n\n第三行'), '第一行\n\n第二行\n\n第三行')
  assert.equal(poster.editorText({ innerText: '第一行\n\n\n第二行' }), '第一行\n\n第二行')
  assert.equal(poster.editorText({ innerText: '有什么新鲜事？' }), '')
  assert.ok(Array.from(poster.formatPost('内容'.repeat(300))).length <= 180)
})

test('scheduled post separates long drafts into paragraphs with blank lines', () => {
  assert.equal(poster.formatShortPost('说句难听点的\n会不会搜东西，本质是能否把模糊需求拆成关键词。'), '说句难听点的\n\n会不会搜东西，本质是能否把模糊需求拆成关键词。')
  const singleParagraph = '贵州小伙零彩礼娶了俄罗斯姑娘。零彩礼这条，比身高差更值得琢磨。是真不在乎，还是本来就没这套规矩？'
  assert.equal(poster.formatShortPost(singleParagraph), '贵州小伙零彩礼娶了俄罗斯姑娘。\n\n零彩礼这条，比身高差更值得琢磨。\n\n是真不在乎，还是本来就没这套规矩？')
  assert.equal(poster.formatShortPost('我真的很好奇\n\n为什么要限制炒美股？'), '我真的很好奇\n\n为什么要限制炒美股？')
  assert.equal(poster.formatModelPost('这项新规今天公布了。执行细节还没说清，我觉得先别急着夸。'), '这项新规今天公布了。\n\n执行细节还没说清，我觉得先别急着夸。')
  assert.equal(poster.formatModelPost('这项新规今天公布了。\n\n执行细节还没说清，我觉得先别急着夸。'), '这项新规今天公布了。\n\n执行细节还没说清，我觉得先别急着夸。')
  assert.equal(poster.simplifyPostRhetoric('这更像客户在用脚投票，而非简单改版。'), '客户在用脚投票。')
  assert.equal(poster.simplifyPostRhetoric('说个暴论，这更像客户在用脚投票，而非简单改版。\n\n新界面让老用户多走了两步。'), '说个暴论，客户在用脚投票。\n\n新界面让老用户多走了两步。')
  assert.equal(poster.simplifyPostRhetoric('这不是简单改版，而是客户在用脚投票。'), '客户在用脚投票。')
  assert.equal(poster.simplifyPostRhetoric('新界面让老用户多走了两步。\n\n这更像客户在用脚投票，而非简单改版。'), '新界面让老用户多走了两步。\n\n客户在用脚投票。')
  assert.equal(poster.simplifyPostRhetoric('游戏公司缩减了外部咨询预算。\n\n游戏公司砍掉这类外部咨询预算时，先跑的就是最挨骂的那一环。'), '游戏公司缩减了外部咨询预算。')
  assert.equal(poster.simplifyPostRhetoric('游戏公司缩减了外部咨询预算。具体项目的处理方式还要看公开公告。'), '游戏公司缩减了外部咨询预算。具体项目的处理方式还要看公开公告。')
  assert.equal(poster.simplifyPostRhetoric('我真心觉得宋兴宇14岁辍学还能自学机械、飞控，花两个月做出载人飞行滑板飞越长江，最硬的地方是他把电影里的“绿魔”滑板真飞起来了。\n\n负债240万没挡住他继续试，这比飞越本身更能说明自学的分量。'), '我真心觉得宋兴宇14岁辍学还能自学机械、飞控，花两个月做出载人飞行滑板飞越长江，真硬啊。\n\n负债240万没挡住他继续试，太有分量了。')
})

test('used source IDs survive a fresh scheduled-post tab', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const makeTab = () => {
    const context = vm.createContext({
      chrome: { storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } } },
      sessionStorage: { getItem: () => null },
    })
    vm.runInContext(source, context)
    return context.XInteractionPoster
  }
  const first = makeTab()
  await first.loadHistory()
  await first.rememberUsedSourceId('source-123')
  await first.rememberPublishedPost('source-123', '保留钩子\n这条内容已经发出', '表达方式影响讨论', {
    source: 'opinion', sourceLabel: '2aran 舆情分析', sourceText: '某个公开事件引发讨论',
    imageStyle: 'text-card', cardVariant: 'editorial',
    sourceUrl: 'https://example.com/source', sourcePageUrl: 'https://2aran.com/public-opinion',
  })
  const second = makeTab()
  await second.loadHistory()
  assert.equal(second.readUsedSourceIds().has('source-123'), true)
  assert.equal(storage.xrcPosterHistoryV2.published[0].topic, '表达方式影响讨论')
  assert.equal(storage.xrcPosterHistoryV2.published[0].cardVariant, 'editorial')
  assert.equal(storage.xrcPosterHistoryV2.published[0].sourceLabel, '2aran 舆情分析')
  assert.equal(storage.xrcPosterHistoryV2.published[0].sourceUrl, 'https://example.com/source')
  assert.equal(storage.xrcPosterHistoryV2.published[0].sourcePageUrl, 'https://2aran.com/public-opinion')
})

test('news IDs consumed by failed old rewrites become available again while published IDs stay deduplicated', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const stored = { xrcPosterHistoryV2: {
    sourceIds: ['toutiao:failed', 'toutiao:published'],
    published: [{ sourceId: 'toutiao:published', text: '这条已经发出', topic: '公开新闻' }],
  } }
  const context = vm.createContext({
    chrome: { storage: { local: {
      async get(key) { return { [key]: stored[key] } },
      async set(value) { Object.assign(stored, value) },
    } } },
    sessionStorage: { getItem: () => null },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  assert.equal(api.readUsedSourceIds().has('toutiao:failed'), false)
  assert.equal(api.readUsedSourceIds().has('toutiao:published'), true)
})

test('failed rewrites never fall back to the source post in the publish queue', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const sourceText = '一个关于新工具使用方式的公开讨论'
  const context = vm.createContext({
    chrome: {
      runtime: {
        sendMessage(message, respond) {
          if (message.title === sourceText) respond({ ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' })
          else respond({ ok: false, error: '改写失败' })
        },
      },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  api.snapshot().sourceQueue.push(
    { id: 'toutiao:good', sourceType: 'news', source: 'toutiao', text: sourceText },
    { id: 'toutiao:failed', sourceType: 'news', source: 'toutiao', text: '另一个钩子\n这是一段原始内容，不能直接放入待发列表' },
  )
  await api.buildPublishList()
  assert.deepEqual(Array.from(api.snapshot().publishQueue, (item) => item.id), ['toutiao:good'])
  assert.equal(api.readUsedSourceIds().has('toutiao:failed'), false)
  assert.equal(api.snapshot().publishQueue[0].source, 'toutiao')
})

test('scheduled poster fills an empty queue from fresh hot topics and remembers their source IDs', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const seen = []
  const rewrites = []
  const feed = Array.from({ length: 20 }, (_, index) => ({
    id: `toutiao:${index}`,
    sourceType: 'news',
    source: 'toutiao',
    text: `一个关于新工具使用方式的公开讨论${index}`,
    summary: '',
    url: `https://www.toutiao.com/a${index}`,
  }))
  const context = vm.createContext({
    chrome: {
      runtime: {
        lastError: null,
        sendMessage(message, respond) {
          seen.push(`${message.type}:${message.tier || ''}`)
          if (message.type === 'xrc-ai-news-sources') {
            respond({ ok: true, items: message.tier === 'external' ? feed : [] })
            return
          }
          rewrites.push(message)
          respond({ ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' })
        },
      },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  api.setSchedulePace('slow')
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(seen[0], 'xrc-ai-news-sources:external')
  assert.ok(seen.filter((item) => item === 'xrc-ai-news-rewrite:').length >= 5)
  assert.ok(!seen.includes('xrc-ai-news-sources:aihot'))
  assert.ok(api.snapshot().publishQueue.length >= 5)
  assert.equal(api.snapshot().publishQueue[0].sourceType, 'news')
  assert.equal(api.snapshot().publishQueue[0].sourceLabel, '今日头条')
  assert.ok(String(api.snapshot().publishQueue[0].sourceUrl).includes('toutiao.com'))
  assert.equal(api.readUsedSourceIds().has(api.snapshot().publishQueue[0].id), true)
  assert.ok(rewrites.every((item) => item.source === 'toutiao'))
})

test('a rewrite service failure falls back locally without exhausting news sources or marking them used', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const calls = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        calls.push(`${message.type}:${message.tier || ''}`)
        if (message.type === 'xrc-ai-news-sources') respond({ ok: true, items: [
          { id: 'toutiao:123', sourceType: 'news', source: 'toutiao', text: '一个关于新工具使用方式的公开讨论' },
        ], errors: ['知乎：HTTP 401'] })
        else respond({ ok: false, error: 'DeepSeek 请求失败（503）' })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  api.setSchedulePace('slow')
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(calls[0], 'xrc-ai-news-sources:external')
  assert.ok(calls.includes('xrc-ai-news-rewrite:'))
  assert.equal(api.readUsedSourceIds().has('toutiao:123'), false)
  assert.ok(api.snapshot().publishQueue.length >= 5)
  assert.ok(api.snapshot().publishQueue.every((item) => item.source === 'evergreen'))
  assert.ok(api.snapshot().publishQueue[0].text)
})

test('available feeds with rejected rewrites still produce distinct local social observations', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = { xrcPosterHistoryV2: {
    sourceIds: [],
    published: [
      { sourceId: 'evergreen:old-1', topic: '旧的泛化话题一', text: '老话题\n\n很多人讨论到最后，还是要回到自己的时间、现金流和承受范围。' },
      { sourceId: 'evergreen:old-2', topic: '旧的泛化话题二', text: '老话题\n\n先把现实条件摆出来，再决定怎么做，通常比追着一句口号走更稳。' },
    ],
  } }
  const feed = (sourceName, count) => Array.from({ length: count }, (_, index) => ({
    id: `${sourceName}:${index}`, source: sourceName, sourceType: 'news',
    text: `关于普通人生活选择的讨论第${index}条`,
  }))
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        if (message.type === 'xrc-ai-news-sources') respond({ ok: true, items: message.tier === 'external'
          ? [...feed('zhihu', 25), ...feed('toutiao', 25)] : feed('aihot', 30) })
        else respond({ ok: true, skip: true })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  const publishedTexts = new Set()
  for (let index = 0; index < 15; index += 1) {
    await api.collectNewsFallback()
    const [draft] = api.snapshot().publishQueue
    assert.equal(draft.source, 'evergreen')
    assert.ok(draft.text)
    assert.equal(publishedTexts.has(draft.text), false)
    publishedTexts.add(draft.text)
    api.snapshot().publishQueue.shift()
    await api.rememberPublishedPost(draft.id, draft.text, draft.topic, draft)
  }
  assert.equal(publishedTexts.size, 15)
  await assert.rejects(api.collectNewsFallback(), /未通过：.*正文与已发内容完全相同/)
})

test('scheduled poster falls back to common social observations after hot feeds lack usable items', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const calls = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        calls.push(`${message.type}:${message.tier || ''}`)
        if (message.type === 'xrc-ai-news-sources') {
          respond({ ok: true, items: message.tier === 'opinion' ? [{
            id: 'opinion:site-1', sourceType: 'news', source: 'opinion', sourceLabel: '2aran 舆情分析',
            text: '一个关于新工具使用方式的公开讨论', url: 'https://example.com/original',
            sourcePageUrl: 'https://2aran.com/public-opinion',
          }] : [] })
        } else respond({ ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(calls[0], 'xrc-ai-news-sources:external')
  assert.equal(calls[1], 'xrc-ai-news-sources:aihot')
  assert.ok(calls.slice(2).every((call) => call === 'xrc-ai-news-rewrite:'))
  assert.equal(api.snapshot().publishQueue[0].sourceLabel, '常用社会观察')
  assert.equal(api.snapshot().publishQueue[0].source, 'evergreen')
})

test('scheduled poster drafts Zhihu topics before Toutiao topics', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const rewritten = []
  const rewriteRequests = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        if (message.type === 'xrc-ai-news-sources') {
          respond({ ok: true, items: message.tier === 'external' ? [
            { id: 'toutiao:blood', sourceType: 'news', source: 'toutiao', text: '体检抽血为什么要抽多管' },
            { id: 'zhihu:tool', sourceType: 'news', source: 'zhihu', text: '一个关于新工具使用方式的公开讨论' },
          ] : [] })
        } else {
          rewritten.push(message.source)
          rewriteRequests.push(message)
          respond(message.source === 'zhihu'
            ? { ok: true, topic: '新工具上线跟风', post: '新工具刚上线\n\n不少人还没打开看一眼，\n\n名字已经先被吹上天了。' }
            : { ok: true, topic: '抽血管子排一排', post: '体检抽血，一排管子摆出来。\n\n结果还没等到，\n\n人先被这阵仗吓一跳。' })
        }
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  api.setSchedulePace('slow')
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(rewritten[0], 'zhihu')
  assert.ok(rewritten.includes('toutiao'))
  assert.equal(api.snapshot().publishQueue[0].source, 'zhihu')
  assert.ok(api.snapshot().publishQueue.some((item) => item.source === 'toutiao'))
  assert.ok(rewriteRequests.length >= 2)
})

test('scheduled poster keeps trying fetched topics and reports the actual source and position', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const statuses = []
  let rewrites = 0
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        if (message.type === 'xrc-ai-news-sources') {
          respond({ ok: true, items: Array.from({ length: 4 }, (_, index) => ({
            id: `zhihu:${index}`, sourceType: 'news', source: 'zhihu',
            text: `关于普通人生活选择的讨论第${index}条`,
          })) })
        } else {
          rewrites += 1
          respond(rewrites <= 3 ? { ok: true, skip: true } : {
            ok: true, topic: '普通人生活选择',
            post: '普通人做选择，先看自己能承担什么。\n\n把时间和现金流算清楚，再决定要不要跟上。',
          })
        }
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: {
      getItem: () => null,
      setItem(_key, value) { statuses.push(JSON.parse(value).status) },
    },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  await api.collectNewsFallback()
  assert.equal(rewrites, 4)
  assert.equal(api.snapshot().publishQueue[0].source, 'zhihu')
  assert.ok(statuses.some((status) => /已取得知乎素材，正在改写第 4\/4 条/.test(status)))
  assert.ok(statuses.some((status) => /知乎第 3\/4 条未通过/.test(status)))
})

test('hot-topic parsers require current site data and keep stable source IDs', () => {
  const aihot = background.parseAihotFeed('<rss><channel><item><guid>ai-42</guid><title>AI 行业正在发生的新变化</title><link>https://aihot.news/p/42</link><description><![CDATA[一段行业摘要]]></description></item></channel></rss>')
  assert.equal(aihot[0].id, 'aihot:ai-42')
  assert.equal(aihot[0].sourceLabel, 'AI HOT')
  assert.equal(aihot[0].url, 'https://aihot.news/p/42')
  assert.equal(background.parseToutiaoHot({ data: [{ ClusterId: '123', Title: '一个关于新工具使用方式的公开讨论', Url: 'https://www.toutiao.com/a123' }] })[0].id, 'toutiao:123')
  assert.equal(background.parseToutiaoHot({ data: [{ ClusterId: 7698667807361319433, ClusterIdStr: '7698667807361319433', Title: '工信部：禁止车辆行驶时用零重力座椅', Url: 'https://www.toutiao.com/trending/7698667807361319433/' }] })[0].id, 'toutiao:7698667807361319433')
  assert.equal(background.parseZhihuHot({ data: [{ target: { id: 42, title: '为什么很多人会误解新工具的使用方式？', url: 'https://www.zhihu.com/question/42' } }] })[0].id, 'zhihu:42')
  const event = { id: 'po_123', title: '新工具使用方式引发讨论', latestAt: new Date().toISOString() }
  assert.equal(background.parseOpinionHot({ source: 'fallback', meta: { hasData: false }, events: [event] }).length, 0)
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: true }, events: [event] }).length, 0)
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: false }, events: [event] })[0].id, 'opinion:po_123')
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: false }, events: [event] })[0].sourcePageUrl, 'https://2aran.com/public-opinion')
  assert.equal(background.parseOpinionHot({ source: 'd1', meta: { hasData: true, isStale: false }, events: [{ ...event, latestAt: '2020-01-01T00:00:00Z' }] }).length, 0)
  assert.match(background.POST_SYSTEM_PROMPT, /说个暴论/)
  assert.match(background.POST_SYSTEM_PROMPT, /整条只站一边/)
  assert.match(background.POST_SYSTEM_PROMPT, /不是…而是…/)
  assert.match(background.POST_SYSTEM_PROMPT, /不写币、代币、合约/)
  assert.match(background.POST_PREMIUM_PROMPT, /观点精剖/)
  assert.match(background.POST_PREMIUM_PROMPT, /60～120 字/)
  assert.equal(background.CLICKBAIT_POST_PROMPT, background.POST_NORMAL_PROMPT)
  assert.match(background.REPLY_TIMELINE_PROMPT, /短小精悍/)
  assert.match(background.REPLY_COMMENT_PROMPT, /前后文连贯/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /发推提示词同样适用于本次热点改写/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /禁止正反对照与辩证拆解/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /来源材料里的假对比、自我指涉和意义拔高改成直接陈述/)
  assert.match(background.NEWS_REWRITE_SYSTEM_PROMPT, /不能凭行业印象虚构人员反应/)
})

test('scheduled hot-topic rewrite uses the visible post prompt and migrates the old default', async () => {
  const contentSource = await readFile(new URL('content.js', extensionDir), 'utf8')
  const declaration = contentSource.match(/  const DEFAULT_POST_NORMAL_PROMPT = \[[\s\S]*?\n\s*\]\.join\("\\n"\);/)?.[0]
  assert.ok(declaration)
  const promptContext = vm.createContext({})
  vm.runInContext(`${declaration.replace('const DEFAULT_POST_NORMAL_PROMPT', 'var DEFAULT_POST_NORMAL_PROMPT')}\nglobalThis.value = DEFAULT_POST_NORMAL_PROMPT`, promptContext)
  assert.equal(promptContext.value, background.POST_NORMAL_PROMPT)
  assert.equal(background.POST_SYSTEM_PROMPT, background.POST_NORMAL_PROMPT)
  assert.equal(background.CLICKBAIT_POST_PROMPT, background.POST_NORMAL_PROMPT)

  const originalChrome = globalThis.chrome
  const originalFetch = globalThis.fetch
  let storedPostPrompt = '自定义发推提示词：说清楚事实，像平时聊天。'
  let requestBody
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678', postPrompt: storedPostPrompt } } } } } }
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: '{"skip":false,"topic":"新工具上线","post":"新工具刚上线，大家都在讨论名字。"}' } }] } } }
  }
  try {
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /自定义发推提示词：说清楚事实/)
    assert.match(requestBody.messages[0].content, /本接口仅用 JSON 包装结果/)
    storedPostPrompt = '从素材里抓一件具体的事，用口语短句写。3 到 5 行，总共 35 到 75 个字'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /说个暴论/)
    assert.doesNotMatch(requestBody.messages[0].content, /3 到 5 行，总共 35 到 75 个字/)
    storedPostPrompt = '根据给定热点写一条原创 X 短帖。参考王长富那种直接说人话、有一点个人判断的口气；不要模仿他的原句。不要写成三行微型故事。这话像在说 X，又像不止 X。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /标题与摘要是未核实的取材数据/)
    assert.doesNotMatch(requestBody.messages[0].content, /参考王长富那种直接说人话/)
    storedPostPrompt = '结构：总共 18～70 字。短的一行即可，长的 2～4 行；换行时行间留一个空行。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /整条只站一边/)
    assert.doesNotMatch(requestBody.messages[0].content, /短的一行即可/)
    storedPostPrompt = '任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。只选 1 个判断，开头就表态。篇幅：目标 35～90 个中文字符。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /说个暴论/)
    assert.doesNotMatch(requestBody.messages[0].content, /开头就表态/)
    storedPostPrompt = '风格：标题党引子。第一句至少带出对象。素材适合时可写“真正值得注意的是”。写 3～5 个短段。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /整条只站一边/)
    assert.doesNotMatch(requestBody.messages[0].content, /真正值得注意的是/)
    storedPostPrompt = '风格：观点型标题党。依据热点标题和摘要，第一句直接给 1 个有冲突感的判断。篇幅：目标 45～100 个中文字符。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /说个暴论/)
    storedPostPrompt = '任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。先从读者视角用一句话交代具体对象和发生的事。素材真让人佩服时，可以用 0～1 句短口语直接夸。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /不能凭行业印象虚构人员反应/)
    assert.doesNotMatch(requestBody.messages[0].content, /素材真让人佩服时/)
    storedPostPrompt = '任务：依据给定热点的标题和摘要，写一条有明确立场的 X 中文短帖。先从读者视角用一句话交代具体对象和发生的事。姿态够直接。字数是写作目标。最厉害的地方是……'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /整条只站一边/)
    assert.doesNotMatch(requestBody.messages[0].content, /姿态够直接/)
    storedPostPrompt = '任务：依据热点标题和摘要写一条 X 中文短帖。开头用最短一句说清谁做了什么；别把立场磨成两边都对的分析报告。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /只站一边/)
    assert.doesNotMatch(requestBody.messages[0].content, /两边都对的分析报告/)
    storedPostPrompt = '风格：更抓人的观点短帖。第一句用具体事件带出冲突，马上说出鲜明立场；可以犀利、惊讶、吐槽。'
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论' })
    assert.match(requestBody.messages[0].content, /说个暴论/)
    assert.doesNotMatch(requestBody.messages[0].content, /马上说出鲜明立场/)
    await background.rewriteNewsPost({ title: '一个关于新工具使用方式的公开讨论', postKind: 'premium' })
    assert.match(requestBody.messages[0].content, /观点精剖/)
  } finally {
    globalThis.chrome = originalChrome
    globalThis.fetch = originalFetch
  }
})

test('post opening draw uses each fixed phrase ten percent of the time', async () => {
  assert.equal(background.choosePostOpening(0), '说个暴论，')
  assert.equal(background.choosePostOpening(0.099), '说个暴论，')
  assert.equal(background.choosePostOpening(0.1), '我真心觉得，')
  assert.equal(background.choosePostOpening(0.199), '我真心觉得，')
  assert.equal(background.choosePostOpening(0.2), '卧槽卧槽卧槽')
  assert.equal(background.choosePostOpening(0.299), '卧槽卧槽卧槽')
  assert.equal(background.choosePostOpening(0.3), '')
  assert.equal(background.choosePostOpening(0.999), '')
  assert.equal(background.applyPostOpening('讲个事实，别把配置表当成安全说明。', '说个暴论，'), '说个暴论，\n\n别把配置表当成安全说明。')
  assert.equal(background.applyPostOpening('我真心觉得别把配置表当成安全说明。', ''), '别把配置表当成安全说明。')

  const originalChrome = globalThis.chrome
  const originalFetch = globalThis.fetch
  let requestBody
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' } } } } } }
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: '{"skip":false,"topic":"配置说明","post":"别把配置表当成安全说明。"}' } }] } } }
  }
  try {
    const selected = await background.rewriteNewsPost({ title: '车辆座椅配置说明引发讨论', openingDraw: 0.05 })
    assert.match(requestBody.messages[0].content, /正文第一行写“说个暴论，”/)
    assert.equal(selected.post, '说个暴论，\n\n别把配置表当成安全说明。')
    const ordinary = await background.rewriteNewsPost({ title: '车辆座椅配置说明引发讨论', openingDraw: 0.8 })
    assert.match(requestBody.messages[0].content, /先用一句话交代具体对象和事件，再写一边的看法；整条只站一边/)
    assert.equal(ordinary.post, '别把配置表当成安全说明。')
    await background.rewriteNewsPost({ title: '车辆座椅配置说明引发讨论', lengthMode: 'compact', openingDraw: 0.8 })
    assert.match(requestBody.messages[0].content, /约 35～60 个中文字符，分成 3～4 个短行/)
    assert.match(requestBody.messages[0].content, /不要正反对照/)
  } finally {
    globalThis.chrome = originalChrome
    globalThis.fetch = originalFetch
  }
})

test('a completed hot-topic rewrite is queued without a style retry', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = {}
  const requests = []
  const context = vm.createContext({
    chrome: {
      runtime: { lastError: null, sendMessage(message, respond) {
        requests.push(message)
        respond(requests.length === 1
          ? { ok: true, topic: '抽血检测流程', post: '说个暴论\n\n抽几管血常按检测项目分装。\n\n患者等结果时，先被这阵仗吓了一跳。' }
          : { ok: true, topic: '抽血管子排一排', post: '体检抽血，一排管子摆出来。\n\n结果还没等到，\n\n人先被这阵仗吓一跳。' })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  api.snapshot().sourceQueue.push({ id: 'toutiao:blood', sourceType: 'news', source: 'toutiao', text: '体检抽血为什么要抽多管' })
  await api.buildPublishList()
  assert.equal(requests.length, 1)
  assert.equal(api.snapshot().publishQueue.length, 1)
  assert.match(api.snapshot().publishQueue[0].text, /说个暴论/)
})

test('a longer successful hot-topic rewrite stays in the queue for publishing', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const storage = { xrcPosterHistoryV2: {
    sourceIds: [],
    published: [{ sourceId: 'toutiao:older-seat', topic: '零重力座椅使用边界', text: '零重力座椅使用条件要讲清楚。', at: Date.now() }],
  } }
  const headline = '工信部提醒车辆行驶时不要使用零重力座椅'
  const draft = '工信部提醒行车时别用零重力座椅，这事值得重视。\n\n座椅舒服是一回事，行驶状态下能不能保持足够安全是另一回事。\n\n车企宣传功能时，最好把使用条件同时讲清楚。\n\n消费者看配置表也别只看名字，真正要紧的是功能在什么场景下可以使用。\n\n比起一个好听的卖点，清楚的使用边界更有用。'
  const seededMath = Object.create(Math)
  seededMath.random = () => 0.1
  const context = vm.createContext({
    Math: seededMath,
    chrome: {
      runtime: { lastError: null, sendMessage(_message, respond) {
        respond({ ok: true, topic: '零重力座椅使用边界', post: draft })
      } },
      storage: { local: {
        async get(key) { return { [key]: storage[key] } },
        async set(value) { Object.assign(storage, value) },
      } },
    },
    sessionStorage: { getItem: () => null, setItem() {} },
  })
  vm.runInContext(source, context)
  const api = context.XInteractionPoster
  await api.loadHistory()
  api.snapshot().sourceQueue.push({ id: 'toutiao:seat', sourceType: 'news', source: 'toutiao', text: headline })
  await api.buildPublishList(1)
  const [queued] = api.snapshot().publishQueue
  assert.equal(queued.source, 'toutiao')
  assert.equal(queued.text, draft)
  assert.equal(queued.topic, '零重力座椅使用边界')
  assert.doesNotMatch(source, /qualityReason\(|duplicateReason\(/)
})

test('DeepSeek post rewrite accepts a nonempty draft without extra formatting gates', () => {
  assert.deepEqual(background.parseSourceRewrite('{"skip":false,"topic":"表达方式影响讨论","post":"首句\\n正文"}'), {
    skip: false, topic: '表达方式影响讨论', post: '首句\n正文',
  })
  assert.deepEqual(background.parseSourceRewrite('{"skip":true,"topic":"","post":""}'), {
    skip: true, topic: '', post: '',
  })
  assert.deepEqual(background.parseSourceRewrite('模型写好的一段正文。', '某个具体新闻标题'), {
    skip: false, topic: '某个具体新闻标题', post: '模型写好的一段正文。',
  })
  assert.deepEqual(background.parseSourceRewrite('{"skip":false,"post":"另一段正文。"}', '某个具体新闻标题'), {
    skip: false, topic: '某个具体新闻标题', post: '另一段正文。',
  })
  assert.throws(() => background.parseSourceRewrite('直接照抄原文'), /可用草稿/)
  assert.throws(() => background.parseSourceRewrite('{broken', '某个具体新闻标题'), /可解析的草稿/)
})

test('scheduled poster recognizes X duplicate warning without treating unrelated alerts as duplicates', () => {
  const previousDocument = global.document
  const duplicate = { innerText: 'Whoops! You already said that.' }
  const unrelated = { innerText: 'Something went wrong.' }
  global.document = { querySelectorAll: () => [duplicate, unrelated] }
  try {
    assert.deepEqual(poster.duplicatePostNoticeNodes(), [duplicate])
    global.document = { querySelectorAll: () => [{ innerText: '你已经说过了' }] }
    assert.equal(poster.duplicatePostNoticeNodes().length, 1)
  } finally {
    global.document = previousDocument
  }
})

test('post draft clear removes a rejected duplicate from the inline composer', async () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  const previousDocument = global.document
  const previousWindow = global.window
  const editor = {
    innerText: '已经发过的内容',
    parentElement: null,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 200, height: 60 }),
    focus() {},
  }
  global.document = {
    querySelectorAll: () => [editor],
    execCommand(command) {
      if (command === 'delete') editor.innerText = ''
      return true
    },
  }
  global.window = {}
  try {
    assert.equal((await draft.clearReplyComposer('post')).ok, true)
    assert.equal(editor.innerText, '')
  } finally {
    global.document = previousDocument
    global.window = previousWindow
  }
})

test('a saved duplicate post is removed from the queue before the next send', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const listeners = new Set()
  const editor = {
    innerText: '重复的第一条',
    isConnected: true,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 200, height: 60 }),
  }
  const submit = {
    disabled: false,
    getAttribute: () => null,
    closest: () => null,
    getBoundingClientRect: () => ({ width: 40, height: 20 }),
  }
  const body = {}
  editor.parentElement = { parentElement: body, querySelector: () => submit }
  const alert = { innerText: 'Whoops! You already said that.' }
  const window = {
    location: { pathname: '/home' },
    setTimeout,
    addEventListener: (_name, fn) => listeners.add(fn),
    removeEventListener: (_name, fn) => listeners.delete(fn),
    postMessage(message) {
      if (message.direction !== 'request') return
      if (message.clear) editor.innerText = ''
      for (const listener of listeners) listener({ source: window, data: {
        channel: message.channel, direction: 'response', requestId: message.requestId, result: { ok: true },
      } })
    },
  }
  const saved = {
    running: true,
    count: 0,
    currentPost: '重复的第一条',
    currentSourceId: 'opinion:first',
    lastError: '没有确认推文发送成功',
    nextPostAt: Date.now() + 60000,
    publishQueue: [{ id: 'opinion:first', sourceType: 'news', draftPolicyVersion: poster.DRAFT_POLICY_VERSION, text: '重复的第一条' }, { id: 'opinion:second', sourceType: 'news', draftPolicyVersion: poster.DRAFT_POLICY_VERSION, text: '另一条' }],
  }
  const sessionStorage = {
    getItem: () => JSON.stringify(saved),
    setItem() {},
    removeItem() {},
  }
  const document = {
    body,
    querySelectorAll(selector) {
      if (selector.includes('tweetTextarea_0')) return [editor]
      if (selector.includes('tweetButtonInline')) return [submit]
      if (selector.includes('[role="alert"]')) return [alert]
      return []
    },
  }
  const chrome = { storage: { local: { async get() { return {} }, async set() {} } } }
  const context = vm.createContext({ window, document, sessionStorage, chrome, setTimeout, clearTimeout, URL, console })
  vm.runInContext(source, context)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('duplicate post was not skipped')), 3000)
    context.XInteractionPoster.restore((snapshot) => {
      if (!snapshot.status.startsWith('X 提示这条内容已说过')) return
      clearTimeout(timeout)
      assert.deepEqual(Array.from(snapshot.publishQueue, (item) => item.id), ['opinion:second'])
      assert.equal(editor.innerText, '')
      assert.equal(snapshot.count, 0)
      context.XInteractionPoster.stop()
      resolve()
    })
  })
})

test('legacy queued drafts are cleared instead of being sent after the quality update', async () => {
  const source = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const listeners = new Set()
  const editor = {
    innerText: '旧钩子\n\n旧正文，这一版没有经过新规则筛选',
    closest: () => null,
    getBoundingClientRect: () => ({ width: 200, height: 60 }),
  }
  const submit = { disabled: false, closest: () => null, getAttribute: () => null, getBoundingClientRect: () => ({ width: 40, height: 20 }) }
  const body = {}
  editor.parentElement = { parentElement: body, querySelector: () => submit }
  const window = {
    location: { pathname: '/home' }, setTimeout,
    addEventListener: (_name, fn) => listeners.add(fn),
    removeEventListener: (_name, fn) => listeners.delete(fn),
    postMessage(message) {
      if (message.direction !== 'request') return
      if (message.clear) editor.innerText = ''
      for (const listener of listeners) listener({ source: window, data: {
        channel: message.channel, direction: 'response', requestId: message.requestId, result: { ok: true },
      } })
    },
  }
  const text = '旧钩子\n旧正文，这一版没有经过新规则筛选'
  const saved = { running: true, currentPost: text, currentSourceId: 'legacy', publishQueue: [{ id: 'legacy', text }] }
  const sessionStorage = { getItem: () => JSON.stringify(saved), setItem() {}, removeItem() {} }
  const document = { body, querySelectorAll(selector) {
    if (selector.includes('tweetTextarea_0')) return [editor]
    if (selector.includes('tweetButtonInline')) return [submit]
    return []
  } }
  const chrome = { storage: { local: { async get() { return {} }, async set() {} } } }
  const context = vm.createContext({ window, document, sessionStorage, chrome, setTimeout, clearTimeout, URL, console })
  vm.runInContext(source, context)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('legacy draft was not skipped')), 3000)
    context.XInteractionPoster.restore((snapshot) => {
      if (!snapshot.status.startsWith('已清理旧版素材草稿')) return
      clearTimeout(timeout)
      assert.equal(editor.innerText, '')
      assert.equal(snapshot.publishQueue.length, 0)
      assert.equal(snapshot.count, 0)
      context.XInteractionPoster.stop()
      resolve()
    })
  })
})

test('picks the topmost unseen post that still has a reply button', () => {
  const processed = new Set(['2'])
  const next = loop.nextTweet(
    [
      { id: '2', top: 10, replyButton: {} },
      { id: '3', top: 400, replyButton: {} },
      { id: '1', top: 0, replyButton: null },
      { id: '4', top: 80, replyButton: {} },
    ],
    processed,
  )

  assert.equal(next.id, '4')
})

test('recognizes the X reply-permission modal without mistaking other dialogs for it', () => {
  assert.equal(loop.isReplyRestrictedText('Who can reply?\nOnly some accounts can reply.\nSee conversation\nGot It'), true)
  assert.equal(loop.isReplyRestrictedText('谁可以回复？\n只有部分账号可以回复\n知道了'), true)
  assert.equal(loop.isReplyRestrictedText('Who can reply?\nEveryone can reply.'), false)
  assert.equal(loop.isReplyRestrictedText('Something went wrong. Please try again.'), false)
})

test('reloads after 35 successful replies and after the timeline stalls', () => {
  assert.deepEqual(loop.shouldReload({ pageCount: 35, succeeded: 35, stalled: false }), {
    reload: true,
    reason: 'batch',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 8, succeeded: 8, stalled: true }), {
    reload: true,
    reason: 'stalled',
  })
  assert.deepEqual(loop.shouldReload({ pageCount: 0, succeeded: 0, stalled: true }), {
    reload: false,
    reason: '',
  })
  assert.equal(loop.BATCH_SIZE, 35)
  assert.equal(loop.ROUNDS_PER_RUN, 5)
  assert.equal(loop.RUN_SIZE, 175)
  assert.deepEqual(loop.batchTransition({ pageCount: 34, completedRounds: 0 }), {
    action: 'continue',
    completedRounds: 0,
    pageCount: 34,
  })
  assert.deepEqual(loop.batchTransition({ pageCount: 35, completedRounds: 0 }), {
    action: 'reload',
    completedRounds: 1,
    pageCount: 0,
  })
  assert.deepEqual(loop.batchTransition({ pageCount: 35, completedRounds: 4 }), {
    action: 'complete',
    completedRounds: 5,
    pageCount: 0,
  })
})

test('creates one persisted-size random execution plan within the configured ranges', () => {
  const minimumPlan = loop.createRunPlan(() => 0)
  assert.deepEqual(minimumPlan, { pace: 'boundary', rounds: 2, roundTargets: [20, 20], total: 40 })

  const maximumPlan = loop.createRunPlan(() => 1)
  assert.deepEqual(maximumPlan, { pace: 'boundary', rounds: 3, roundTargets: [30, 30, 30], total: 90 })
  assert.equal(loop.randomReplyDelaySeconds(() => 0), 6)
  assert.equal(loop.randomReplyDelaySeconds(() => 1), 10)
  assert.equal(loop.randomCycleDelayMs(() => 0), 90 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 1), 120 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 0, 'boundary', 0), 150 * 60 * 1000)
  assert.equal(loop.randomReplyDelaySeconds(() => 0, 'boundary', 3), 4)
  assert.equal(loop.createRunPlan(() => 0, 'boundary', 3).roundTargets[0], 24)
  assert.equal(loop.createRunPlan(() => 0, 'boundary', 'explore').roundTargets[0], 20)
  assert.equal(loop.boundaryGearName(1), '起步')
  assert.equal(loop.formatSchedule('boundary', 1).cycleDelay, '90～120 分钟')
  assert.equal(loop.formatSchedule('boundary', 0).phaseLabel, '降档')
  assert.deepEqual(loop.createRunPlan(() => 0, 'boundary', 'probe'), { pace: 'boundary', rounds: 1, roundTargets: [1], total: 1 })
  assert.equal(loop.randomReplyDelaySeconds(() => 0, 'boundary', 'probe'), 8)
  assert.equal(loop.boundaryProbeCooldownMs(1), 15 * 60 * 1000)
  assert.equal(loop.boundaryProbeCooldownMs(6), 120 * 60 * 1000)

  assert.deepEqual(loop.SCHEDULE_PROFILES.map((item) => item.label), ['慢', '中', '边界测试', '快', '超快'])
  assert.equal(loop.DEFAULT_SCHEDULE_PACE, 'boundary')
  assert.equal(loop.schedulePaceIndex('slow'), 0)
  assert.equal(loop.schedulePaceIndex('turbo'), 4)
  assert.equal(loop.scheduleProfile('missing').id, 'boundary')
  assert.equal(loop.createRunPlan(() => 0, 'slow').rounds, 2)
  assert.equal(loop.createRunPlan(() => 0, 'slow').roundTargets[0], 12)
  assert.equal(loop.createRunPlan(() => 1, 'turbo').rounds, 8)
  assert.equal(loop.createRunPlan(() => 1, 'turbo').roundTargets[0], 55)
  assert.equal(loop.randomReplyDelaySeconds(() => 0, 'turbo'), 2)
  assert.equal(loop.randomReplyDelaySeconds(() => 1, 'fast'), 6)
  assert.equal(loop.randomCycleDelayMs(() => 0, 'turbo'), 20 * 60 * 1000)
  assert.equal(loop.randomCycleDelayMs(() => 1, 'slow'), 6 * 60 * 60 * 1000)
  assert.equal(loop.formatSchedule('medium').cycleDelay, '2～3 小时')
  assert.equal(loop.formatSchedule('fast').cycleDelay, '60～90 分钟')
  assert.equal(loop.formatSchedule('turbo').replyDelay, '2～4 秒')
  assert.deepEqual(loop.scheduleBounds(), { minReplies: 12, maxReplies: 55, minRounds: 2, maxRounds: 8 })
})

test('boundary testing keeps automation running through personal work hours', () => {
  const mondayLunch = new Date(2026, 9, 19, 12, 30).getTime()
  const mondayEvening = new Date(2026, 9, 19, 18, 0).getTime()
  const mondayMorning = new Date(2026, 9, 19, 10, 0).getTime()
  const saturday = new Date(2026, 9, 17, 12, 30).getTime()
  assert.equal(loop.nextAvailableAt(mondayMorning), mondayMorning)
  assert.equal(loop.nextAvailableAt(mondayLunch), mondayLunch)
  assert.equal(loop.nextAvailableAt(mondayEvening), mondayEvening)
  assert.equal(loop.nextAvailableAt(saturday), saturday)
})

test('first pace migration selects boundary testing instead of leaving turbo highlighted', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(source, /const needsBoundaryMigration = Number\(stored\?\.\[SCHEDULE_DEFAULT_VERSION_KEY\] \|\| 0\) < 2/)
  assert.match(source, /const pace = needsBoundaryMigration\s*\n\s*\? loopApi\.DEFAULT_SCHEDULE_PACE/)
  assert.match(source, /\[SCHEDULE_DEFAULT_VERSION_KEY\]: 2/)
})

test('treats a disabled Reply button and empty composer placeholders as not ready', () => {
  assert.equal(loop.isSubmitEnabled(null), false)
  assert.equal(loop.isSubmitEnabled({ disabled: true, getAttribute() { return null } }), false)
  assert.equal(
    loop.isSubmitEnabled({ disabled: false, getAttribute(name) { return name === 'aria-disabled' ? 'true' : null } }),
    false,
  )
  assert.equal(loop.isSubmitEnabled({ disabled: false, getAttribute() { return null } }), true)
  assert.equal(loop.composerText({ innerText: 'Post your reply' }), '')
  assert.equal(loop.composerText({ textContent: '  学习了 \u200b' }), '学习了')
})

test('reads a post id from a status permalink', () => {
  assert.equal(loop.statusIdFromHref('/Ocean_Yu1/status/1840000000000000000'), '1840000000000000000')
  assert.equal(loop.statusIdFromHref('https://x.com/Ocean_Yu1/status/99/photo/1'), '99')
  assert.equal(loop.statusIdFromHref('/home'), '')
})

test('reads and normalizes the post author handle from a status permalink', () => {
  assert.equal(loop.handleFromStatusHref('/Ocean_Yu1/status/1840000000000000000'), 'ocean_yu1')
  assert.equal(loop.handleFromStatusHref('https://x.com/TUARAN/status/99/photo/1'), 'tuaran')
  assert.equal(loop.handleFromStatusHref('/i/web/status/99'), '')
  assert.equal(loop.normalizeHandle('@TUARAN'), 'tuaran')
})

test('recognizes only notification tweets that reply to the signed-in account', () => {
  assert.equal(loop.isNotificationReplyText('Replying to @TUARAN', '@tuaran'), true)
  assert.equal(loop.isNotificationReplyText('正在回复 @tuaran', 'TUARAN'), true)
  assert.equal(loop.isNotificationReplyText('liked your reply', 'tuaran'), false)
  assert.equal(loop.isNotificationReplyText('Replying to @someone_else', 'tuaran'), false)
})

test('notification conversation uses the nearest earlier post by the signed-in account', () => {
  const article = (href, text) => ({
    parentElement: { closest() { return null } },
    querySelector(selector) {
      if (selector === 'a[href*="/status/"] time') return { closest() { return { getAttribute() { return href } } } }
      if (selector === '[data-testid="tweetText"]') return { innerText: text }
      return null
    },
  })
  const articles = [
    article('/me/status/100', '我的原帖'),
    article('/other/status/101', '别人的中间回复'),
    article('/me/status/102', '我补充的上下文'),
    article('/friend/status/103', '对方最新回复'),
  ]
  const result = context.findConversation(articles, '103', 'me', 'friend')
  assert.equal(result.ownPost.text, '我补充的上下文')
  assert.equal(result.reply.text, '对方最新回复')
  assert.equal(context.findConversation(articles, '103', 'me', 'stranger'), null)
  assert.equal(context.findConversation([articles.at(-1)], '103', 'me', 'friend'), null)
})

test('notification context opens a background conversation tab and closes it after reading', async () => {
  let created = null
  let removed = null
  globalThis.chrome = {
    tabs: {
      async create(options) { created = options; return { id: 91 } },
      async sendMessage(id, message) {
        assert.equal(id, 91)
        assert.equal(message.replyId, '103')
        return { context: { ownPost: { text: '我的帖子' }, reply: { text: '对方回复' } } }
      },
      async remove(id) { removed = id },
    },
  }
  try {
    const result = await background.readNotificationContext({
      replyUrl: 'https://x.com/friend/status/103', replyId: '103', ownHandle: 'me', replyAuthor: 'friend',
    }, { tab: { windowId: 7 } })
    assert.equal(result.context.ownPost.text, '我的帖子')
    assert.equal(new URL(created.url).searchParams.get('xrcContext'), '1')
    assert.equal(created.active, false)
    assert.equal(removed, 91)
  } finally {
    delete globalThis.chrome
  }
})

test('DeepSeek receives both sides of a notification conversation', async () => {
  let request = null
  const originalFetch = globalThis.fetch
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' } } } } } }
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: '谢谢补充，我的意思是这个范围。' } }] } } }
  }
  try {
    await background.callDeepSeek({
      postText: '对方回复',
      conversation: { ownPost: { text: '我的帖子' }, reply: { text: '对方回复' } },
    })
    const userPrompt = request.messages[1].content
    assert.match(userPrompt, /我的帖子：\n我的帖子/)
    assert.match(userPrompt, /对方针对这条帖子写的回复：\n对方回复/)
    assert.match(userPrompt, /直接回应对方这条回复/)
    await background.callDeepSeek({
      postText: '生日快乐',
      conversation: { ownPost: null, reply: { text: '生日快乐' } },
    })
    const fallbackPrompt = request.messages[1].content
    assert.match(fallbackPrompt, /对方回复给我的内容：\n生日快乐/)
    assert.match(fallbackPrompt, /以收到回复的人的身份随手接一句/)
    assert.match(request.messages[0].content, /表达感谢，不要反过来祝对方生日快乐/)
    await background.callDeepSeek({
      postText: '说了半天一句重点没有',
      conversation: { ownPost: null, reply: { text: '说了半天一句重点没有' } },
    })
    assert.match(request.messages[1].content, /批评表达散乱时可自然承认写散了/)
    assert.match(request.messages[1].content, /不要装作知道原帖结论，不要反问对方/)
    assert.match(request.messages[0].content, /客服话术|客服腔/)
  } finally {
    delete globalThis.chrome
    globalThis.fetch = originalFetch
  }
})

test('Grok invitations stay off until a reply task enables them', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const choice = source.match(/  function shouldInviteGrok\(mode, replyMode, draw = Math\.random, enabled = false\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(choice)
  const context = vm.createContext({ GROK_REPLY_PROBABILITY: 0.05 })
  vm.runInContext(`${choice}\nglobalThis.choose = shouldInviteGrok`, context)
  assert.equal(context.choose('timeline', 'ai', () => 0), false)
  assert.equal(context.choose('timeline', 'ai', () => 0, true), true)
  assert.equal(context.choose('timeline', 'ai', () => 0.0499, true), true)
  assert.equal(context.choose('timeline', 'ai', () => 0.05, true), false)
  assert.equal(context.choose('notifications', 'ai', () => 0, true), true)
  assert.equal(context.choose('notifications', 'ai', () => 0), false)
  assert.equal(context.choose('timeline', 'template', () => 0, true), false)
  assert.match(source, /grokInviteTimeline: false/)
  assert.match(source, /settings\.grokInviteTimeline === true/)
  assert.match(source, /data-xrc-grok-invite/)
  assert.match(source, /GROK_REPLY_PROBABILITY = 0\.05/)
  assert.match(source, /pendingGrokInvite: state\.pendingGrokInvite/)
  assert.match(source, /pendingGrokInvite: Boolean\(parsed\.pendingGrokInvite\)/)
  assert.match(source, /sendAiMessage\("xrc-ai-generate", postText, phrase, conversation, state\.pendingGrokInvite\)/)
})

test('selected Grok reply prompt asks for a specific second perspective', async () => {
  const originalFetch = globalThis.fetch
  let request = null
  let modelText = '这个处理确实太急了。@grok 还有哪条公开依据能支持另一种判断？'
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' } } } } } }
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body)
    return { ok: true, async json() { return { choices: [{ message: { content: modelText } }] } } }
  }
  try {
    const reply = await background.callDeepSeek({ postText: '项目突然提前上线', inviteGrok: true })
    assert.match(reply, /@grok/)
    assert.match(request.messages[0].content, /可以带 @grok/)
    assert.match(request.messages[0].content, /可直接以 @grok 开头/)
    assert.equal(request.max_tokens, 160)
    modelText = '这个处理确实太急了。还有哪条公开依据能支持另一种判断？'
    assert.match(await background.callDeepSeek({ postText: '项目突然提前上线', inviteGrok: true }), /^@grok /)
    modelText = '@Grok 这个处理太急了。@grok 还有什么公开依据？'
    assert.equal((await background.callDeepSeek({ postText: '项目突然提前上线', inviteGrok: true })).match(/@grok/giu)?.length, 1)
    modelText = '粉丝破万挺快的。@grok 开通后按什么标准结算？\n@grok 开通后按什么标准结算？'
    assert.equal(await background.callDeepSeek({ postText: '项目突然提前上线', inviteGrok: true }), '粉丝破万挺快的。@grok 开通后按什么标准结算？')
    modelText = '这个处理确实太急了。@grok 还有其他依据吗？'
    assert.doesNotMatch(await background.callDeepSeek({ postText: '项目突然提前上线' }), /@grok/)
    assert.match(request.messages[0].content, /不要提及 @grok/)
    await background.callDeepSeek({
      postText: '生日快乐',
      conversation: { ownPost: { text: '今天过生日' }, reply: { text: '生日快乐' } },
    })
    assert.match(request.messages[0].content, /不 @grok/)
    modelText = '收到，这个点我记下了。'
    assert.match(await background.callDeepSeek({
      postText: '生日快乐', inviteGrok: true, mode: 'notifications',
      conversation: { ownPost: { text: '今天过生日' }, reply: { text: '生日快乐' } },
    }), /@grok/)
    assert.match(request.messages[0].content, /可以带 @grok/)
    assert.doesNotMatch(request.messages[0].content, /不 @grok/)
  } finally {
    globalThis.fetch = originalFetch
    delete globalThis.chrome
  }
})

test('Grok mention duplication is managed and the composer rewrite retries automatically', async () => {
  const phrase = '粉丝破万挺快的。@grok 开通后按什么标准结算？'
  assert.equal(loop.isRecoverableGrokDuplicate(`${phrase}\n@grok 开通后按什么标准结算？`, phrase), true)
  assert.equal(loop.isRecoverableGrokDuplicate(`${phrase}\n开通后按什么标准结算？`, phrase), true)
  assert.equal(loop.isRecoverableGrokDuplicate(`${phrase}\n@grok 为什么还没回复？`, phrase), false)
  assert.equal(loop.isRecoverableGrokDuplicate(`${phrase} 这是我手动写的补充`, phrase), false)

  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  async function ensureReplyComposerText\(composer, phrase, attempts = 3\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const textbox = { text: `${phrase}\n@grok 开通后按什么标准结算？` }
  let writes = 0
  const sandbox = vm.createContext({
    state: { stopping: false },
    loopApi: { composerText: (node) => node.text, normalizePhraseText: loop.normalizePhraseText },
    fillComposer: async (node, text) => { writes += 1; if (writes === 2) node.text = text; return node.text === text ? text : '' },
    sleep: async () => {},
    findDialogComposer: () => null,
  })
  vm.runInContext(`${definition}\nglobalThis.ensure = ensureReplyComposerText`, sandbox)
  assert.equal(await sandbox.ensure({ dialog: null, textbox }, phrase), true)
  assert.equal(writes, 2)
  assert.equal(textbox.text, phrase)
})

test('temporary DeepSeek overload falls back to NAS with the same reply context', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const requests = []
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678' }, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    if (url.includes('api.deepseek.com')) return {
      ok: false, status: 503,
      async json() { return { error: { message: 'Service is too busy' } } },
    }
    return { ok: true, async json() { return { content: '谢谢提醒，我再说清楚点。' } } }
  }
  try {
    const reply = await background.callDeepSeek({
      postText: '对方回复',
      conversation: { ownPost: { text: '我的帖子' }, reply: { text: '对方回复' } },
    })
    assert.equal(reply, '谢谢提醒，我再说清楚点。')
    assert.equal(requests.length, 2)
    assert.equal(requests[1].url, 'https://2aran.com/api/community-actions/model-fallback')
    assert.equal(requests[1].options.headers['x-community-action-secret'], 'test-secret')
    assert.match(JSON.parse(requests[1].options.body).messages[1].content, /我的帖子：\n我的帖子/)

    requests.length = 0
    globalThis.fetch = async (url) => {
      requests.push({ url })
      return { ok: false, status: 401, async json() { return { error: { message: 'Invalid API key' } } } }
    }
    await assert.rejects(background.callDeepSeek({ postText: '你好' }), /Invalid API key/)
    assert.equal(requests.length, 1)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('NAS failure falls back to configured B.AI without losing reply context', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const requests = []
  const progress = []
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key' }, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    if (url.includes('api.deepseek.com')) return { ok: false, status: 503, async json() { return { error: { message: 'Service is too busy' } } } }
    if (url.includes('2aran.com')) return { ok: false, status: 502, async json() { return { error: 'OLLAMA_API_TIMEOUT' } } }
    return { ok: true, async json() { return { output: [{ type: 'message', content: [{ type: 'output_text', text: '谢谢提醒，我再核对一下。' }] }] } } }
  }
  try {
    const reply = await background.callDeepSeek({
      postText: '生日快乐',
      conversation: { ownPost: { text: '我今天过生日' }, reply: { text: '生日快乐' } },
      onProgress: (status) => progress.push(status),
    })
    assert.equal(reply, '谢谢提醒，我再核对一下。')
    assert.deepEqual(progress, [
      '正在读取模型设置…',
      '正在请求 DeepSeek 生成回复…',
      'DeepSeek 暂不可用，正在尝试 NAS 模型…',
      'NAS 暂不可用，正在尝试 B.AI 模型…',
    ])
    assert.equal(requests.length, 3)
    assert.equal(requests[2].url, 'https://api.b.ai/v1/responses')
    assert.equal(requests[2].options.headers.authorization, 'Bearer sk-bai-test-key')
    const baiBody = JSON.parse(requests[2].options.body)
    assert.equal(baiBody.model, 'gpt-6-luna')
    assert.equal(baiBody.reasoning.effort, 'none')
    assert.match(baiBody.input[0].content, /我的帖子：\n我今天过生日/)
    assert.match(baiBody.input[0].content, /生日快乐/)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('selected reply providers skip disabled models and do not require a DeepSeek key', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const requests = []
  const settings = { replyProviders: ['nas'], baiApiKey: 'sk-bai-test-key' }
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: settings, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url) => {
    requests.push(url)
    if (url.includes('2aran.com')) return { ok: true, async json() { return { content: 'NAS 回复' } } }
    return { ok: true, async json() { return { output: [{ type: 'message', content: [{ type: 'output_text', text: 'B.AI 回复' }] }] } } }
  }
  try {
    assert.equal(await background.callDeepSeek({ postText: '你好' }), 'NAS 回复')
    assert.deepEqual(requests, ['https://2aran.com/api/community-actions/model-fallback'])
    requests.length = 0
    settings.replyProviders = ['bai']
    assert.equal(await background.callDeepSeek({ postText: '你好' }), 'B.AI 回复')
    assert.deepEqual(requests, ['https://api.b.ai/v1/responses'])
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('cancelling a NAS reply aborts its request without trying the next model', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  let markStarted
  const started = new Promise((resolve) => { markStarted = resolve })
  const requests = []
  globalThis.chrome = { storage: { local: { async get() { return { xrcAiSettings: { replyProviders: ['nas', 'bai'], baiApiKey: 'sk-bai-test-key' }, xrcAccountHandle: 'Tuaran' } } } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = (url, { signal }) => {
    requests.push(url)
    markStarted()
    return new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true })
    })
  }
  try {
    const controller = new AbortController()
    const pending = background.callDeepSeek({ postText: '你好', signal: controller.signal })
    await started
    controller.abort()
    await assert.rejects(pending, /回复任务已取消/)
    assert.deepEqual(requests, ['https://2aran.com/api/community-actions/model-fallback'])
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('B.AI billing restriction pauses repeated third-provider requests', async () => {
  const originalFetch = globalThis.fetch
  const originalReceipt = globalThis.XrcCommunityReceipt
  const storage = { xrcAiSettings: { apiKey: 'sk-12345678', baiApiKey: 'sk-bai-test-key' } }
  const requests = []
  globalThis.chrome = { storage: { local: {
    async get(key) { return typeof key === 'string' ? { [key]: storage[key] } : storage },
    async set(value) { Object.assign(storage, value) },
  } } }
  globalThis.XrcCommunityReceipt = { async readSecret() { return 'test-secret' } }
  globalThis.fetch = async (url) => {
    requests.push(url)
    if (url.includes('api.deepseek.com')) return { ok: false, status: 503, async json() { return { error: { message: 'Service is too busy' } } } }
    if (url.includes('2aran.com')) return { ok: false, status: 404, async json() { return {} } }
    return { ok: false, status: 403, async json() { return { error: { message: 'Deposit required' } } } }
  }
  try {
    await assert.rejects(background.callDeepSeek({ postText: '你好' }), /B.AI 余额或模型权限不足（403）/)
    await assert.rejects(background.callDeepSeek({ postText: '你好' }), /暂缓重复请求/)
    assert.equal(requests.filter((url) => url.includes('api.b.ai')).length, 1)
    assert.equal(requests.filter((url) => url.includes('2aran.com')).length, 2)
    assert.ok(storage.xrcBaiAccessCooldown.until > Date.now())
  } finally {
    globalThis.fetch = originalFetch
    globalThis.XrcCommunityReceipt = originalReceipt
    delete globalThis.chrome
  }
})

test('notification timestamps remain parsable without a time-window restriction', () => {
  assert.equal(loop.timestampFromDatetime('2026-10-09T10:30:00.000Z'), Date.parse('2026-10-09T10:30:00.000Z'))
  assert.equal(loop.timestampFromDatetime('not-a-date'), 0)
  assert.equal(loop.isWithinNotificationWindow, undefined)
})

test('notification replies remain eligible without a like button', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const replyTargetHelpers = source.match(/  function outsideNestedTweet\(article, node\) \{[\s\S]*?\n  function ownTweetText\(article\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function collectTweets\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(replyTargetHelpers && definition)
  const anchor = { getAttribute: () => '/another/status/123456789' }
  const time = { getAttribute: () => new Date().toISOString(), closest: () => anchor }
  const article = {
    closest: () => null,
    querySelector(selector) {
      if (selector === 'a[href*="/status/"] time') return time
      if (selector === '[data-testid="reply"]') return {}
      return null
    },
    getBoundingClientRect: () => ({ top: 10 }),
  }
  const main = { querySelectorAll: () => [article] }
  const context = vm.createContext({
    document: { querySelector: () => main, body: main },
    window: { location: { origin: 'https://x.com' }, scrollY: 0 },
    state: { assistantMode: 'notifications' },
    PANEL_ID: 'x-reply-clipboard-panel',
    currentAccountHandle: () => 'tuaranx',
    isNotificationPath: () => true,
    isNestedTweet: () => false,
    isPromoted: () => false,
    textOf: () => 'Replying to @tuaranx',
    loopApi: loop,
    URL,
  })
  vm.runInContext(`${replyTargetHelpers}\n${definition}\nglobalThis.collect = collectTweets`, context)
  assert.equal(context.collect().length, 1)
  assert.equal(context.collect()[0].id, '123456789')
})

test('notification reply still sends when the dialog has not quoted a status link yet', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const start = source.indexOf('  function dialogStatusIds(dialog) {')
  const end = source.indexOf('  function findDialogComposer() {')
  const helpers = start >= 0 && end > start ? source.slice(start, end) : ''
  assert.ok(helpers.includes('function dialogConflictsWithTweet'))
  const context = vm.createContext({ loopApi: loop })
  vm.runInContext(`${helpers}\nglobalThis.dialogTargetsTweet = dialogTargetsTweet\nglobalThis.dialogConflictsWithTweet = dialogConflictsWithTweet`, context)
  const emptyDialog = { querySelectorAll: () => [] }
  const commentDialog = { querySelectorAll: () => [{ getAttribute: () => '/reader/status/222' }] }
  const parentDialog = { querySelectorAll: () => [{ getAttribute: () => '/author/status/111' }] }
  assert.equal(context.dialogConflictsWithTweet(emptyDialog, { id: '222' }), false)
  assert.equal(context.dialogTargetsTweet(emptyDialog, { id: '222' }), false)
  assert.equal(context.dialogConflictsWithTweet(commentDialog, { id: '222' }), false)
  assert.equal(context.dialogTargetsTweet(commentDialog, { id: '222' }), true)
  assert.equal(context.dialogConflictsWithTweet(parentDialog, { id: '222' }), true)
})

test('notification replies target the comment, not the parent post shown above it', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function collectTweets\(\) \{[\s\S]*?\n  \}/)?.[0]
  const helpers = source.match(/  function outsideNestedTweet\(article, node\) \{[\s\S]*?\n  function ownTweetText\(article\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition && helpers)
  const parentLink = { getAttribute: () => '/author/status/111' }
  const commentLink = { getAttribute: () => '/reader/status/222' }
  const parentTime = { closest: (selector) => selector === 'a' ? parentLink : null, getAttribute: () => '' }
  const commentTime = { closest: (selector) => selector === 'a' ? commentLink : null, getAttribute: () => '' }
  const parentButton = {}
  const commentButton = {}
  const commentBlock = {
    querySelectorAll(selector) {
      if (selector === 'a[href*="/status/"] time') return [commentTime]
      return []
    },
  }
  const article = {
    closest: () => null,
    getBoundingClientRect: () => ({ top: 0 }),
    querySelectorAll(selector) {
      if (selector === 'a[href*="/status/"] time') return [parentTime, commentTime]
      if (selector === '[data-testid="reply"]') return [parentButton, commentButton]
      if (selector === '[data-testid="tweetText"]') return [{}, {}]
      return []
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null
    },
  }
  parentButton.parentElement = article
  commentBlock.parentElement = article
  commentButton.parentElement = commentBlock
  const context = vm.createContext({
    document: { querySelector: () => ({ querySelectorAll: () => [article] }), body: {} },
    window: { location: { origin: 'https://x.com' }, scrollY: 0 },
    state: { assistantMode: 'notifications' },
    PANEL_ID: 'x-reply-clipboard-panel',
    currentAccountHandle: () => 'tuaranx',
    isNotificationPath: () => true,
    isNestedTweet: () => false,
    isPromoted: () => false,
    textOf: () => 'Replying to @tuaranx 这条是评论',
    loopApi: loop,
    URL,
  })
  vm.runInContext(`${helpers}\n${definition}\nglobalThis.collect = collectTweets`, context)
  const tweets = context.collect()
  assert.equal(tweets.length, 1)
  assert.equal(tweets[0].id, '222')
  assert.equal(tweets[0].replyButton, commentButton)
})

test('Grok reply notifications are skipped while ordinary replies mentioning Grok stay eligible', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const replyTargetHelpers = source.match(/  function outsideNestedTweet\(article, node\) \{[\s\S]*?\n  function ownTweetText\(article\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function collectTweets\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(replyTargetHelpers && definition)
  const makeArticle = (handle, id, text) => ({
    textContent: text,
    closest: () => null,
    querySelector(selector) {
      if (selector === 'a[href*="/status/"] time') return {
        getAttribute: () => new Date().toISOString(),
        closest: () => ({ getAttribute: () => `/${handle}/status/${id}` }),
      }
      if (selector === '[data-testid="reply"]') return {}
      return null
    },
    getBoundingClientRect: () => ({ top: 10 }),
  })
  const articles = [
    makeArticle('grok', '123', 'Replying to @tuaranx 我补充一点'),
    makeArticle('Grok', '124', 'Replying to @tuaranx 另一条回复'),
    makeArticle('reader', '125', 'Replying to @tuaranx @grok 这个问题怎么看？'),
  ]
  const main = { querySelectorAll: () => articles }
  const context = vm.createContext({
    document: { querySelector: () => main, body: main },
    window: { location: { origin: 'https://x.com' }, scrollY: 0 },
    state: { assistantMode: 'notifications' }, PANEL_ID: 'x-reply-clipboard-panel',
    currentAccountHandle: () => 'tuaranx', isNotificationPath: () => true,
    isNestedTweet: () => false, isPromoted: () => false,
    textOf: (article) => article?.textContent || '', loopApi: loop, URL,
  })
  vm.runInContext(`${replyTargetHelpers}\n${definition}\nglobalThis.collect = collectTweets`, context)
  assert.deepEqual(Array.from(context.collect(), (tweet) => tweet.id), ['125'])
})

test('notification candidates are not cut off by a two-hour timestamp', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const replyTargetHelpers = source.match(/  function outsideNestedTweet\(article, node\) \{[\s\S]*?\n  function ownTweetText\(article\) \{[\s\S]*?\n  \}/)?.[0]
  const definition = source.match(/  function collectTweets\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(replyTargetHelpers && definition)
  const article = {
    textContent: 'Replying to @tuaranx 已有旧回复',
    closest: () => null,
    querySelector(selector) {
      if (selector === 'a[href*="/status/"] time') return {
        getAttribute: () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        closest: () => ({ getAttribute: () => '/reader/status/123456789' }),
      }
      if (selector === '[data-testid="reply"]') return {}
      return null
    },
    getBoundingClientRect: () => ({ top: 0 }),
  }
  const main = { querySelectorAll: () => [article] }
  const context = vm.createContext({
    state: { assistantMode: 'notifications' },
    document: { querySelector: () => main, body: main }, window: { location: { origin: 'https://x.com' }, scrollY: 0 }, PANEL_ID: 'x-reply-clipboard-panel',
    currentAccountHandle: () => 'tuaranx', isNotificationPath: () => true, isNestedTweet: () => false,
    isPromoted: () => false, textOf: (node) => node?.textContent || '', loopApi: loop, URL,
  })
  vm.runInContext(`${replyTargetHelpers}\n${definition}\nglobalThis.collect = collectTweets`, context)
  assert.deepEqual(Array.from(context.collect(), (tweet) => tweet.id), ['123456789'])
})

test('old notification cooldown is cleared once after the scan fix', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const definition = source.match(/  function readSaved\(mode = currentTaskKey\(\)\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(definition)
  const saved = { phraseStore: 'test', assistantMode: 'notifications', nextCycleAt: Date.now() + 300000 }
  const context = vm.createContext({
    sessionStorage: { getItem: () => JSON.stringify(saved) },
    STORAGE_KEY: 'test-storage',
    taskStateKey: () => 'test-task-storage',
    savedDefaults: () => ({ nextCycleAt: -1 }),
    PHRASE_STORE: 'test',
    NOTIFICATION_CYCLE_POLICY_VERSION: 2,
    loopApi: { scheduleProfile: () => ({ id: 'medium' }), DEFAULT_SCHEDULE_PACE: 'medium' },
    clampInterval: (value) => value || 60,
    DEFAULT_ROUND_INTERVAL_SECONDS: 60,
    MIN_ROUND_INTERVAL_SECONDS: 1,
    MAX_ROUND_INTERVAL_SECONDS: 300,
    normalizeRunPlan: () => null,
    validPanelView: (value) => value || 'normal',
    validAssistantMode: (value) => value || 'timeline',
    validMutualMode: (value) => value || 'unfollow',
    validReplyMode: (value) => value || 'ai',
    RUN_SIZE: 100,
  })
  vm.runInContext(`${definition.replace(/return savedDefaults\(\);\n    \}/gu, 'throw error;\n    }')}\nglobalThis.read = readSaved`, context)
  assert.equal(context.read('notifications').nextCycleAt, 0)
  saved.notificationCyclePolicyVersion = 2
  assert.equal(context.read('notifications').nextCycleAt, saved.nextCycleAt)
})

test('recognizes the list routes used by the integrated mutual helper', () => {
  assert.ok(['/crazypig9y/followers', '/jianlvup/followers', '/jianlvya/followers', '/kyotom08/followers', '/Chill_Alpha/followers'].includes(mutual.targetPath('targetFollow')))
  assert.deepEqual(mutual.constants.TARGET_FOLLOW_HANDLES, ['crazypig9y', 'jianlvup', 'jianlvya', 'kyotom08', 'Chill_Alpha'])
  assert.equal(mutual.isFollowingPath('/tuaran/following'), true)
  assert.equal(mutual.isFollowingPath('/tuaran/followers'), false)
  assert.equal(mutual.isFollowersPath('/tuaran/followers'), true)
  assert.equal(mutual.isFollowersPath('/tuaran/verified_followers'), true)
  assert.equal(mutual.isFollowersPath('/home'), false)
  assert.equal(mutual.constants.FOLLOW_ACTION_DELAY_MS, 2000)
  assert.equal(mutual.constants.FOLLOW_BATCH_SIZE, 15)
  assert.equal(mutual.constants.FOLLOW_BATCH_COOLDOWN_MS, 1800000)
  assert.equal(mutual.constants.FOLLOW_MAX_PER_RUN, 400)
  assert.equal(mutual.constants.FOLLOW_DAILY_LIMIT, 400)
  assert.equal(mutual.constants.RATE_LIMIT_COOLDOWN_MS, 15 * 60 * 1000)
})

test('a followed-back account is kept when any name or bio fragment contains Chinese', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const isNonChineseText = source.match(/  function isNonChineseText\(value\) \{[\s\S]*?\n  \}/)?.[0]
  const profileNonChinese = source.match(/  function profileNonChinese\(row, handle\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(isNonChineseText && profileNonChinese)
  const context = vm.createContext({
    textOf: (node) => node.textContent.trim(),
    FOLLOWS_YOU_RE: /(Follows you|关注了你)/i,
  })
  vm.runInContext(`${isNonChineseText}\n${profileNonChinese}\nglobalThis.check = profileNonChinese`, context)
  const row = (fragments) => ({ querySelectorAll: () => fragments.map((textContent) => ({ textContent })) })
  assert.equal(context.check(row(['wang wei', '@wangweiaigg', 'Follows you', 'gpt官方代充', 'https://example.com/very/long/english/link']), '@wangweiaigg'), false)
  assert.equal(context.check(row(['中文名', '@account', 'Follows you', 'English biography']), '@account'), false)
  assert.equal(context.check(row(['wang wei', '@wangweiaigg', 'Follows you gpt官方代充', 'English biography']), '@wangweiaigg'), false)
  assert.equal(context.check(row(['wang wei', '@wangweiaigg', 'Follows you', 'English biography']), '@wangweiaigg'), true)
})

test('follow-back checks a Chinese name or bio before other visible fans', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const profileHasChinese = source.match(/  function profileHasChinese\(row\) \{[\s\S]*?\n  \}/)?.[0]
  const runWithStorage = source.match(/  async function runWithStorage\(mode, onUpdate\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(profileHasChinese && runWithStorage)
  const profileContext = vm.createContext({ textOf: (node) => node.textContent, FOLLOWS_YOU_RE: /(Follows you|关注了你)/i })
  vm.runInContext(`${profileHasChinese}\nglobalThis.hasChinese = profileHasChinese`, profileContext)
  const row = (...parts) => ({ querySelectorAll: () => parts.map((textContent) => ({ textContent })) })
  assert.equal(profileContext.hasChinese(row('Alice', '中文简介')), true)
  assert.equal(profileContext.hasChinese(row('中文姓名', 'English bio')), true)
  assert.equal(profileContext.hasChinese(row('Alice', 'English bio')), false)

  const picked = []
  const state = { running: false, stopping: false, mode: '', sharedDailyFollowed: 0, seenHandles: new Set(), skippedHandles: new Set(), errors: 0 }
  const candidates = [
    { handle: '@english', candidate: true, hasChineseProfile: false },
    { handle: '@chinese', candidate: true, hasChineseProfile: true },
  ]
  const context = vm.createContext({
    state, isFollowingPage: () => false, isFollowersPage: () => true, targetFollowHandleFromPath: () => '', listReady: () => true,
    loadSharedFollowRate: async () => {}, reset: (mode) => { state.running = true; state.mode = mode },
    emit: () => {}, waitForSharedCooldown: async () => true, rateLimitVisible: () => false, automationWarningVisible: () => false,
    visibleRows: () => candidates, actFollowBack: async (item) => { picked.push(item.handle); state.stopping = true; return true },
    actUnfollow: async () => true, actTargetFollow: async () => true, reportMutualAction: () => {},
    waitForPlatformRateLimit: async () => true, persistSharedFollowRate: async () => {}, sleepActive: async () => {},
    FOLLOW_DAILY_LIMIT: 400, FOLLOW_BATCH_SIZE: 15, FOLLOW_BATCH_COOLDOWN_MS: 1800000,
    FOLLOW_ACTION_DELAY_MS: 2000, MAX_STALLED_SCROLLS: 4,
  })
  vm.runInContext(`${runWithStorage}\nglobalThis.runTest = runWithStorage`, context)
  assert.equal(await context.runTest('followBack', () => {}), true)
  assert.deepEqual(picked, ['@chinese'])
})

test('unfollow waits two seconds and rescans after reaching the bottom without applying the shared follow quota', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const runWithStorage = source.match(/  async function runWithStorage\(mode, onUpdate\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(runWithStorage)
  const waits = []
  let clock = 1000
  let scrollsToTop = 0
  let storageReads = 0
  const candidates = [
    { handle: '@person1', candidate: true, followsYou: false },
    { handle: '@person2', candidate: true, followsYou: false },
  ]
  const state = {
    running: false, stopping: false, mode: '', unfollowed: 0,
    sharedDailyFollowed: 400, sharedBatchProgress: 15,
    skipped: 0, errors: 0, cooldownUntil: 1,
    seenHandles: new Set(), skippedHandles: new Set(),
  }
  const context = vm.createContext({
    state, isFollowingPage: () => true, isFollowersPage: () => false, listReady: () => true,
    targetFollowHandleFromPath: () => '', targetPath: () => '',
    loadSharedFollowRate: async () => { storageReads += 1 },
    reset: (mode) => { state.running = true; state.mode = mode },
    emit: () => {}, waitForSharedCooldown: async () => true,
    rateLimitVisible: () => false, automationWarningVisible: () => false, visibleRows: () => candidates,
    actUnfollow: async () => { state.unfollowed += 1; if (state.unfollowed === 3) state.stopping = true; return true },
    actFollowBack: async () => true, actTargetFollow: async () => true,
    reportMutualAction: () => {}, waitForPlatformRateLimit: async () => true,
    persistSharedFollowRate: async () => {},
    sleepActive: async (ms) => { waits.push(ms); if (ms === 1000) clock += 30 * 60 * 1000 },
    scrollForward: async () => ({ progressed: false, atBottom: true }),
    window: { scrollTo: () => { scrollsToTop += 1 } },
    Date: { now: () => clock },
    formatClock: () => '30:00',
    FOLLOW_DAILY_LIMIT: 400, FOLLOW_MAX_PER_RUN: 400,
    FOLLOW_BATCH_SIZE: 15, FOLLOW_BATCH_COOLDOWN_MS: 1800000,
    FOLLOW_ACTION_DELAY_MS: 2000, MAX_STALLED_SCROLLS: 4, RESCAN_INTERVAL_MS: 30 * 60 * 1000,
    SCROLL_DELAY_MS: 450,
  })
  vm.runInContext(`${runWithStorage}\nglobalThis.runTest = runWithStorage`, context)
  assert.equal(await context.runTest('unfollow', () => {}), true)
  assert.deepEqual(waits, [2000, 2000, 1000, 450])
  assert.equal(storageReads, 1)
  assert.equal(state.unfollowed, 3)
  assert.equal(scrollsToTop, 1)
  assert.equal(state.cooldownUntil, 0)
})

test('mutual platform limit shows a countdown and can be stopped during cooldown', async () => {
  const source = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const waitForPlatformRateLimit = source.match(/  async function waitForPlatformRateLimit\(\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(waitForPlatformRateLimit)
  const state = { stopping: false, cooldownUntil: 0, acknowledgedRateLimits: new Set() }
  const statuses = []
  const context = vm.createContext({
    state, Date: { now: () => 1000 }, RATE_LIMIT_COOLDOWN_MS: 15 * 60 * 1000,
    rateLimitNodes: () => [], reportMutualAction() {}, formatClock: () => '15:00',
    emit: (status) => { if (status) statuses.push(status) },
    sleepActive: async (ms) => { assert.equal(ms, 1000); state.stopping = true },
  })
  vm.runInContext(`${waitForPlatformRateLimit}\nglobalThis.waitTest = waitForPlatformRateLimit`, context)
  assert.equal(await context.waitTest(), false)
  assert.equal(state.cooldownUntil, 1000 + 15 * 60 * 1000)
  assert.match(statuses[0], /15:00 后继续/)
})

test('loads one shared follow quota for unfollow, follow-back, and target-follow modes', async () => {
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  globalThis.chrome = {
    storage: {
      local: {
        get: async () => ({
          xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 8, cooldownUntil: 0 },
        }),
        set: async () => {},
      },
    },
  }
  try {
    const snapshot = await mutual.refreshSharedFollowRate()
    assert.equal(snapshot.sharedDailyFollowed, 23)
    assert.equal(snapshot.sharedBatchProgress, 8)
  } finally {
    delete globalThis.chrome
  }
})

test('invalidated follow storage keeps the last quota and stops the task without an unhandled rejection', async () => {
  const now = new Date()
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  globalThis.window = { location: { pathname: '/tuaran/following' } }
  globalThis.chrome = {
    runtime: { id: 'test-extension' },
    storage: { local: {
      async get() { return { xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 8, cooldownUntil: 0 } } },
      async set() {},
    } },
  }
  try {
    assert.equal((await mutual.refreshSharedFollowRate()).sharedDailyFollowed, 23)
    globalThis.chrome.runtime.id = undefined
    const stale = await mutual.refreshSharedFollowRate()
    assert.equal(stale.sharedDailyFollowed, 23)
    assert.match(stale.status, /刷新此 X 页面/)
    const result = await mutual.run('unfollow', () => {})
    assert.match(result.error, /刷新此 X 页面/)
    assert.equal(mutual.snapshot().running, false)
  } finally {
    delete globalThis.chrome
    delete globalThis.window
  }
})

test('follow task stops if its shared quota cannot be saved', async () => {
  const now = new Date()
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  let writes = 0
  globalThis.window = { location: { pathname: '/tuaran/following' } }
  globalThis.chrome = {
    runtime: { id: 'test-extension' },
    storage: { local: {
      async get() { return { xrcTargetFollowDaily: { date: today, count: 23, batchProgress: 15, cooldownUntil: 0 } } },
      async set() { writes += 1; throw new Error('storage failed') },
    } },
  }
  try {
    const result = await mutual.run('unfollow', () => {})
    assert.equal(writes, 1)
    assert.match(result.error, /关注记录无法保存/)
    assert.equal(mutual.snapshot().running, false)
    assert.equal(mutual.snapshot().sharedDailyFollowed, 23)
  } finally {
    delete globalThis.chrome
    delete globalThis.window
  }
})

test('matches a saved phrase after X collapses spaces or inserts invisible characters', () => {
  const phrases = require('../../tools/x-reply-clipboard-extension/phrases.js')
  assert.equal(loop.normalizePhraseText(' 🧇.  .🧇\u200b '), '🧇..🧇')
  assert.equal(loop.phraseIndexFromText(phrases, '手写内容'), -1)
  assert.equal(loop.repeatedPhraseIndexFromText(phrases, '稳稳'), phrases.indexOf('稳'))
  assert.equal(loop.repeatedPhraseIndexFromText(phrases, '手写内容'), -1)
  assert.equal(loop.placeholderMixedPhraseIndexFromText(phrases, '稳st your reply'), phrases.indexOf('稳'))
  assert.equal(loop.placeholderMixedPhraseIndexFromText(phrases, '手写内容'), -1)
})

test('picks a different phrase index and never repeats the current one', () => {
  assert.equal(loop.nextPhraseIndex(1, 0, () => 0), 0)
  assert.equal(loop.nextPhraseIndex(55, 0, () => 0), 1)
  assert.equal(loop.nextPhraseIndex(55, 10, () => 10), 11)
  assert.equal(loop.nextPhraseIndex(55, 54, () => 53), 53)
  assert.equal(loop.nextPhraseIndex(55, 54, () => 0), 0)
  const phrases = require('../../tools/x-reply-clipboard-extension/phrases.js')
  assert.equal(phrases.length, 100)
  assert.equal(phrases[0], '原来是这样，这下前因后果就说得通了。')
  assert.equal(new Set(phrases).size, 100)
  assert.ok(phrases.every((phrase) => phrase.trim()))
  assert.ok(phrases.every((phrase) => phrase.length >= 10))
  assert.ok(phrases.includes('正解，我感觉这个没毛病。'))
  assert.ok(phrases.includes('不错😌谢谢老铁的分享～'))
  const emojiPhrases = phrases.filter((phrase) => /\p{Extended_Pictographic}/u.test(phrase))
  assert.ok(emojiPhrases.length >= 30 && emojiPhrases.length <= 45)
  assert.ok(emojiPhrases.every((phrase) => /[\p{Script=Han}A-Za-z]/u.test(phrase)))
})

test('content script keeps the randomized reply loop wired to the reply popup', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const mutualSource = await readFile(new URL('mutual.js', extensionDir), 'utf8')
  const posterSource = await readFile(new URL('poster.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const posterFixture = await readFile(new URL('fixtures/poster.html', extensionDir), 'utf8')
  const timerSource = await readFile(new URL('timer.js', extensionDir), 'utf8')
  const offscreenSource = await readFile(new URL('offscreen.js', extensionDir), 'utf8')
  const timerWorkerSource = await readFile(new URL('timer-worker.js', extensionDir), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  const catalog = await readFile(new URL('../../lib/content/resourceCatalog.js', import.meta.url), 'utf8')
  const registry = await readFile(new URL('../../lib/content/contentRegistry.js', import.meta.url), 'utf8')
  const toolItems = await readFile(new URL('../../lib/site/toolItems.js', import.meta.url), 'utf8')
  const nextConfig = await readFile(new URL('../../next.config.js', import.meta.url), 'utf8')
  const resourcePage = await readFile(
    new URL('../../app/(site)/resources/x-reply-clipboard-extension/page.jsx', import.meta.url),
    'utf8',
  )
  const downloadButton = await readFile(
    new URL('../../app/(site)/resources/x-reply-clipboard-extension/ExtensionDownloadButton.jsx', import.meta.url),
    'utf8',
  )

  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.name, 'X Interaction Assistant')
  assert.equal(manifest.version, '4.0.66')
  assert.match(content, /\$\{score\}分/)
  assert.match(content, /优先级 1～10 分/)
  assert.match(backgroundSource, /MAX_TASK_PRIORITY = 10/)
  assert.ok(manifest.host_permissions.includes('https://x.com/*'))
  assert.ok(manifest.host_permissions.includes('https://twitter.com/*'))
  assert.ok(manifest.host_permissions.includes('https://api.deepseek.com/*'))
  assert.ok(manifest.host_permissions.includes('https://api.b.ai/*'))
  assert.equal(manifest.content_scripts[0].world, 'MAIN')
  assert.deepEqual(manifest.content_scripts[0].js, ['draftFill.js'])
  assert.deepEqual(manifest.content_scripts[1].js, ['context.js'])
  assert.deepEqual(manifest.content_scripts[2].js, ['receipt.js', 'phrases.js', 'loop.js', 'timer.js', 'postImage.js', 'poster.js', 'mutual.js', 'tweetPdf.js', 'autoLike.js', 'content.js'])
  assert.deepEqual(manifest.permissions, ['storage', 'offscreen', 'alarms'])
  assert.ok(manifest.host_permissions.includes('https://2aran.com/*'))
  assert.ok(manifest.host_permissions.includes('https://aihot.news/*'))
  assert.ok(manifest.host_permissions.includes('https://www.toutiao.com/*'))
  assert.ok(manifest.host_permissions.includes('https://www.zhihu.com/*'))
  assert.equal(manifest.background.service_worker, 'background.js')
  assert.match(nextConfig, /source: '\/resources\/x-mutual-cleaner-extension',[\s\S]*?destination: '\/resources\/x-reply-clipboard-extension'/)
  assert.doesNotMatch(toolItems, /sourcePath: 'tools\/x-(?:mutual-cleaner|tweet-to-pdf)-extension'/)
  assert.match(catalog, /resourceKey: 'resource:x-tweet-to-pdf-extension',[\s\S]*?legacy: true/)
  assert.match(catalog, /resourceKey: 'resource:x-mutual-cleaner-extension',[\s\S]*?legacy: true/)
  assert.match(backgroundSource, /xrc-tweet-pdf-open/)
  assert.match(backgroundSource, /RUNTIME_REPORT_MODES = Object\.freeze\(\[[\s\S]*?"notifications"[\s\S]*?"mutual-unfollow"\s*\]\)/)
  assert.match(backgroundSource, /phase: "idle"/)
  assert.match(backgroundSource, /phase: "unknown"/)
  const printHtml = await readFile(new URL('pdf/print.html', extensionDir), 'utf8')
  await Promise.all(['pdf/print.js', 'pdf/print.css'].map((path) => readFile(new URL(path, extensionDir), 'utf8')))
  assert.match(printHtml, /print\.js/)
  assert.match(backgroundSource, /xrc-task-open/)
  assert.match(backgroundSource, /xrc-task-register/)
  assert.match(backgroundSource, /chrome\.windows\.create/)
  assert.match(backgroundSource, /chrome\.tabs\.update/)
  assert.match(backgroundSource, /chrome\.storage\.session/)
  assert.match(backgroundSource, /chrome\.tabs\.sendMessage\(tabId, payload/)
  assert.match(backgroundSource, /scheduleBackgroundTimer\(message, sender\)/)
  assert.match(backgroundSource, /xrc-runtime-task-state/)
  assert.match(backgroundSource, /xrcPluginRuntime/)
  assert.match(timerSource, /xrc-timer-schedule/)
  assert.match(timerSource, /xrc-timer-fired/)
  assert.match(offscreenSource, /new Worker\(chrome\.runtime\.getURL\("timer-worker\.js"\)\)/)
  assert.match(offscreenSource, /tabId/)
  assert.match(timerWorkerSource, /setTimeout/)
  assert.match(timerWorkerSource, /tabId/)
  assert.match(posterSource, /tweetButtonInline/)
  assert.match(posterSource, /tweetTextarea_0/)
  assert.doesNotMatch(posterSource, /xrc-ai-post-generate/)
  assert.match(posterSource, /xrc-ai-news-rewrite/)
  assert.doesNotMatch(posterSource, /collectSourcePosts|sourceProfilePath/)
  assert.match(posterSource, /已取得\$\{sourceLabel\(item\.source\)\}素材，正在改写第/)
  assert.match(posterSource, /xrcPosterPublishList/)
  assert.match(posterSource, /列表发完前不会重新抓取/)
  assert.doesNotMatch(posterSource, /if \(!arrived\) state\.stopping = true/)
  assert.match(posterSource, /if \(!saved\?\.running\) return false/)
  assert.equal(poster.shouldCollect(0), true)
  assert.equal(poster.shouldCollect(3), false)
  assert.match(posterSource, /minGapSeconds: 10, maxGapSeconds: 18/)
  assert.match(posterSource, /sessionBatchSize/)
  assert.match(posterSource, /minBatch: 20, maxBatch: 30/)
  assert.match(posterSource, /RETRY_INTERVAL_MS = 60 \* 1000/)
  assert.match(posterSource, /depth < 30/)
  assert.match(posterSource, /visibleSubmits/)
  assert.match(posterSource, /上次异常：\$\{state\.lastError\}/)
  assert.match(posterSource, /正在重试待发列表中的这一条/)
  assert.match(posterSource, /发帖框有未发送内容，请手动处理/)
  assert.ok(posterSource.indexOf('const queued = editorText') < posterSource.indexOf('state.nextPostAt > Date.now()'))
  assert.ok(posterSource.indexOf('首页已打开，等待发帖框和 Post 按钮加载') < posterSource.indexOf('const queued = editorText'))
  assert.match(posterSource, /await waitForHomeComposer\(30000\)/)
  assert.doesNotMatch(posterSource, /为避免覆盖已暂停/)
  assert.match(posterSource, /state\.elapsedMs = state\.startedAt/)
  assert.match(posterFixture, /tweetButtonInline/)
  assert.match(posterFixture, /PASS poster sent=1/)
  assert.match(content, /data-testid="reply"/)
  assert.match(content, /tweetTextarea_/)
  assert.match(content, /contenteditable=\"true\"/)
  assert.match(content, /tweetButton/)
  assert.match(content, /location\.reload/)
  assert.match(content, /x-reply-clipboard-draft-v2/)
  assert.match(content, /nextPhraseIndex/)
  assert.match(content, /XReplyClipboardPhrases/)
  assert.doesNotMatch(content, /剪贴板是空的/)
  assert.doesNotMatch(content, /clipboard\.readText/)
  assert.doesNotMatch(content, /execCommand\("insertText"/)
  assert.match(content, /BATCH_SIZE/)
  assert.match(content, /seen === phrase/)
  assert.match(content, /SUBMIT_TIMEOUT_MS = 5000/)
  assert.match(content, /SEND_CONFIRM_TIMEOUT_MS = 5000/)
  assert.match(content, /REPLY_RECEIPT_GRACE_MS = 2000/)
  assert.match(content, /MIN_REPLY_GAP_SECONDS = 2/)
  assert.match(content, /ROUNDS_PER_RUN/)
  assert.match(content, /completedRounds/)
  assert.match(content, /processedIds: Array\.from\(processedIds\)/)
  assert.match(content, /result === "sent-composer-open" && !await closeReplyComposer\(\{ confirmedSent: true \}\)/)
  assert.match(content, /send-unconfirmed/)
  assert.match(content, /ambiguous-sent/)
  assert.match(content, /rememberRecentReply/)
  assert.match(content, /Never click the same wording again/)
  assert.match(content, /稍后重试同一条/)
  assert.match(content, /Your \(\?:post\|reply\) was sent/)
  assert.match(content, /回复\)已发送/)
  assert.match(content, /a\[href\*=\"\/status\/\"\]/)
  assert.match(content, /localMode && localMode !== mode/)
  assert.match(content, /Math\.max\(\s*MIN_REPLY_GAP_SECONDS/)
  assert.match(content, /currentAccountHandle/)
  assert.match(content, /tweet\.authorHandle !== ownHandle/)
  assert.doesNotMatch(content, /processedIds\.add\(next\.id\);\s*advancePhrase\(\);\s*writeSaved/)
  assert.doesNotMatch(content, /clickMatchingButton/)
  assert.doesNotMatch(content, /saveAndDismissComposer/)
  assert.doesNotMatch(content, /closeConfirmedComposer/)
  assert.match(content, /confirmedSent[\s\S]*?app-bar-close/)
  assert.doesNotMatch(content, /\bDiscard\b/)
  assert.match(content, /sent-composer-open/)
  assert.match(content, /phraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /repeatedPhraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /placeholderMixedPhraseIndexFromText\(phrases, existingText\)/)
  assert.match(content, /if \(!existingText\) return publishReply\(existingComposer, replyText\)/)
  assert.match(content, /getManifest/)
  assert.match(content, /X高频互动助手/)
  assert.match(content, /启动排班/)
  assert.match(content, /xrc-flow-start/)
  assert.match(content, /taskWindowLabel/)
  assert.match(content, /stripManagedTaskTitle/)
  assert.match(content, /@\$\{handle\} · \$\{label\}/)
  assert.match(content, /X高频互动助手 · @\$\{handle\}/)
  assert.match(content, /当前已在\$\{label\}页面，任务已停止；点击下方启动/)
  assert.match(content, /document\.title/)
  assert.match(backgroundSource, /replace\(\/\^@\[A-Za-z0-9_\]\{1,40\} · \/u, ""\)/)
  assert.match(content, /data-xrc-global-bar/)
  assert.match(content, /data-xrc-key-guide/)
  assert.ok(content.indexOf('class="xrc-global-bar"') < content.indexOf('class="xrc-flow-launch"'))
  assert.doesNotMatch(content, /xrc-global-paces/)
  assert.match(content, /xrc-round-pace/)
  assert.match(content, /xrc-speed-section/)
  assert.doesNotMatch(content, /data-xrc-flow-help/)
  assert.match(content, /已停止 · 点击启动/)
  assert.match(content, /dataset\.busy = "true"/)
  assert.match(content, /setTaskActionBusy\(/)
  assert.match(content, /withNavBusy\(/)
  assert.match(content, /data-xrc-assistant="mutual"/)
  assert.match(content, /data-xrc-assistant="reply"/)
  assert.match(content, /data-xrc-assistant="likes"/)
  assert.match(content, /data-xrc-reply-tab="timeline"/)
  assert.match(content, /data-xrc-reply-tab="notifications"/)
  assert.match(content, /data-xrc-like-tab="posts"/)
  assert.match(content, /data-xrc-like-tab="replies"/)
  assert.match(content, /data-xrc-hub-open aria-label="设置中心"/)
  assert.match(content, /data-xrc-hub hidden aria-label="设置中心"/)
  const todaySummary = content.match(/<div class="xrc-today-strip"[^>]*>([\s\S]*?)<\/div>\s*<section class="xrc-hub"/)?.[1] || ''
  for (const metric of ['comments', 'likes', 'follows', 'unfollows', 'posts']) {
    assert.ok(todaySummary.includes(`data-xrc-today-${metric}`), `today summary should show ${metric}`)
  }
  assert.match(todaySummary, /xrc-metric-follows">关注<\/span><span class="xrc-metric-unfollows">取关<\/span>/)
  const todayCss = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(todayCss, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/)
  assert.match(todayCss, /calc\(20% - \.5px\).*calc\(40% - \.5px\).*calc\(60% - \.5px\).*calc\(80% - \.5px\)/s)
  assert.doesNotMatch(todayCss, /xrc-today-strip::after[\s\S]*calc\(25%/)
  assert.ok(content.indexOf('class="xrc-today-strip"') < content.indexOf('class="xrc-hub"'))
  assert.match(content, /if \(panel\) \{\s*renderTodaySummary\(panel\)/)
  const quickActions = content.match(/<div class="xrc-quick-actions"[^>]*>([\s\S]*?)<\/div>/)?.[1] || ''
  const header = content.match(/<div class="xrc-header">([\s\S]*?)<span class="xrc-mini-progress"/)?.[1] || ''
  assert.ok(header.includes('class="xrc-quick-actions"'))
  assert.ok(header.indexOf('class="xrc-quick-actions"') < header.indexOf('data-xrc-hub-open'))
  for (const action of ['data-xrc-docs-open', 'data-xrc-collapse', 'data-xrc-expand', 'class="xrc-close"']) {
    assert.ok(quickActions.includes(action), `${action} should remain visible outside the menu`)
  }
  assert.match(content, /data-xrc-monitor-open aria-expanded="false">异常监控/)
  assert.match(content, /data-xrc-report-page hidden aria-label="每日报告"/)
  assert.match(content, /data-xrc-monitor-current/)
  assert.match(content, /function syncMonitorMenu\(panel\)/)
  assert.match(content, /任务状态、风控倒计时及各项恢复规则，以站点文档中心为准/)
  assert.match(content, /功能导航/)
  assert.doesNotMatch(content, /当前助手/)
  assert.match(content, /通知回复/)
  assert.match(content, /关注管理/)
  assert.match(content, /定时发帖/)
  assert.match(content, /data-xrc-post-pace/)
  assert.match(content, /selectPosterPace/)
  assert.match(posterSource, /scheduleNextNormalPostAt\(Date\.now\(\), Math\.random, state\.schedulePace, \{\s*queueRemaining: state\.publishQueue\.length/)
  assert.match(content, /data-xrc-like-pace-label/)
  assert.match(content, /paintLikeProgress/)
  assert.match(content, /loopApi\.randomCycleDelayMs\(Math\.random, state\.schedulePace(?:, state\.boundaryLevel)?\)/)
  assert.match(content, /边界测试本轮稳定，升到第/)
  assert.match(content, /边界测试在 .* 条后发现限制，降到第/)
  assert.match(content, /data-xrc-boundary-info aria-label="查看边界测试说明和限制监测"/)
  assert.match(content, /querySelector\("\[data-xrc-boundary-info\]"\)\?\.addEventListener\("click"/)
  assert.match(content, /data-xrc-boundary-info[\s\S]*?data-xrc-monitor-open/) 
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  assert.match(css, /xrc-round-pace \.xrc-pace-options button[\s\S]*?border-radius: 50%/)
  assert.match(css, /\.xrc-inline-start\[data-busy="true"\]::before/)
  assert.match(css, /\.xrc-flow-start\[data-busy="true"\] \[data-xrc-flow-label\]::before/)
  assert.match(css, /data-assistant-mode="likes-posts"[\s\S]*--xrc-workspace: #e14276/)
  assert.match(css, /\.xrc-inline-start \{[\s\S]*background: linear-gradient\(135deg, var\(--xrc-workspace\)/)
  assert.match(css, /\.xrc-flow-start\[data-flow="paused"\],[\s\S]*\.xrc-flow-start\[data-flow="stopped"\]/)
  assert.doesNotMatch(content, /NOTIFICATION_CYCLE_DELAY_MS/)
  assert.match(content, /RECONNECT_INITIAL_MS = 2000/)
  assert.match(content, /RECONNECT_MAX_MS = 30000/)
  assert.match(content, /window\.addEventListener\("online"/)
  assert.match(content, /fetch\(`\$\{window\.location\.origin\}\/robots\.txt/)
  assert.match(content, /if \(result === "transient-error"\) \{[\s\S]*?skipTransientReply\(next\)/)
  assert.match(content, /if \(draft && !isManagedDraft\(draft\) && !forceClear && !automationOwnsReplyDraft\(\)\) return false/)
  assert.match(content, /回复框有残留内容，正在强制清空/)
  assert.match(content, /重新载入页面以清除残留回复框/)
  assert.match(content, /finishCycleAndScheduleNext/)
  assert.match(content, /reconnectAndResume/)
  assert.doesNotMatch(content, /data-xrc-stable-runtime/)
  assert.match(content, /xrc-runtime-task-state/)
  assert.match(content, /cycleCount/)
  assert.match(content, /nextCycleAt/)
  assert.match(content, /xrc-task-open/)
  assert.match(content, /xrc-task-register/)
  assert.match(content, /conversation = await conversationOrFallback\(next, postText\)/)
  assert.match(content, /ownPost: null,\s*reply: \{ id: tweet\.id, authorHandle: tweet\.authorHandle, text: replyText \}/)
  assert.match(content, /requestedLaunch/)
  assert.match(content, /十二项任务由后台排班，共用一个执行页签/)
  assert.match(content, /设置中心/)
  assert.match(content, /xrc-hub/)
  assert.match(content, /data-xrc-target-follow-handles/)
  assert.doesNotMatch(content, /class="xrc-phrase-row"/)
  assert.match(content, /class="xrc-status xrc-reply-status"/)
  assert.doesNotMatch(content, /data-xrc-reply-start-now/)
  assert.doesNotMatch(content, /data-xrc-post-start-now/)
  assert.match(content, /function canStartReplyNow\(now = Date\.now\(\)\)/)
  assert.match(content, /if \(state\.running && currentTaskKey\(\) === requestedMode && canStartReplyNow\(\)\) startReplyNow\(\)/)
  assert.doesNotMatch(content.match(/function canStartReplyNow\([\s\S]*?\n  \}/)?.[0] || '', /riskRoundAdvancing/)
  assert.match(content, /wakeScheduledWait\?\.\(\)/)
  assert.doesNotMatch(content, /当前 AI 回复/)
  assert.doesNotMatch(content, /读取原帖后自动生成/)
  assert.ok(content.indexOf('data-xrc-assistant="reply"') < content.indexOf('data-xrc-assistant="likes"'))
  assert.ok(content.indexOf('data-xrc-assistant="likes"') < content.indexOf('data-xrc-assistant="mutual"'))
  assert.match(content, /NOTIFICATION_HISTORY_KEY = "xrcNotificationProcessedIds"/)
  assert.doesNotMatch(content, /最近 2 小时/)
  assert.match(content, /state\.assistantMode !== "notifications"/)
  assert.match(content, /persistNotificationProcessed\(next\.id\)/)
  assert.doesNotMatch(content, /document\.hidden|visibilitychange|waitForForeground/)
  assert.doesNotMatch(mutualSource, /document\.hidden|visibilitychange|waitForForeground/)
  assert.match(content, /isNotificationReplyText/)
  assert.doesNotMatch(content, /likeNotificationReply|notificationLikeOnly|likedOnlyIds|先把剩下的赞点完/)
  assert.match(content, /data-xrc-mutual-action="unfollow"/)
  assert.match(content, /data-xrc-mutual-action="followBack"/)
  assert.match(content, /data-xrc-mutual-action="targetFollow"/)
  assert.match(content, /data-xrc-mutual-tab="unfollow"/)
  assert.match(content, /data-xrc-mutual-tab="followBack"/)
  assert.match(content, /data-xrc-mutual-tab="targetFollow"/)
  assert.doesNotMatch(content, /关注候选暂时停用|该功能暂时停用/)
  assert.match(content, /xrc-task-pending-remember/)
  assert.match(content, /isPosterMode\(\) && await postApi\?\.resumeIfPending/)
  assert.match(content, /function selectMutualMode/)
  assert.match(content, /function selectMutualMode\(mode\)\s*\{\s*return scheduleDashboardActive\(\) \? selectTaskForInspection\(mutualTaskKey\(mode\)\) : openTaskTab\(mutualTaskKey\(mode\)\)/)
  assert.match(content, /button\.title = taskTabHint\(mutualTaskKey\(button\.dataset\.xrcMutualTab\)\)/)
  assert.match(content, /data-xrc-timeline-past/)
  assert.match(content, /预计当前结束后|预计 \$\{formatScheduleTime/)
  assert.match(content, /查看当前任务详情/)
  assert.match(content, /const currentMode = focus\.dataset\.currentTask \|\| taskSchedule\.current;\s*if \(currentMode\) openDeskTask\(currentMode\)/)
  assert.match(content, /action === "inspect"/)
  assert.doesNotMatch(content, /button\.disabled = anyTaskRunning\(\)/)
  assert.match(content, /mutualMode/)
  assert.match(content, /button\.disabled = false;\s*button\.title = taskTabHint/)
  assert.match(content, /mutualApi\.run/)
  assert.match(content, /result !== "sent-composer-open"/)
  assert.match(content, /data-xrc-round-track/)
  assert.match(content, /data-xrc-round-segment/)
  assert.match(content, /data-xrc-page-meta/)
  assert.match(content, /class="xrc-round-pace xrc-pace-row"/)
  assert.doesNotMatch(content, /class="xrc-phrase-pool"/)
  assert.doesNotMatch(content, /data-xrc-mode="template"/)
  assert.match(content, /aria-selected/)
  assert.match(content, /data-xrc-runtime/)
  assert.match(content, /randomReplyDelaySeconds\(Math\.random, state\.schedulePace(?:, state\.boundaryLevel)?\)/)
  assert.match(content, /DEFAULT_ROUND_INTERVAL_SECONDS = 5/)
  assert.match(content, /每条间隔/)
  assert.match(content, /data-xrc-wait/)
  assert.doesNotMatch(content, /data-xrc-post-wait/)
  assert.match(content, /data-xrc-reply-timeline-prompt/)
  assert.match(content, /data-xrc-reply-comment-prompt/)
  assert.match(content, /data-xrc-post-normal-prompt/)
  assert.match(content, /data-xrc-post-premium-prompt/)
  assert.doesNotMatch(content, /data-xrc-reply-prompt[^-]/)
  assert.doesNotMatch(content, /data-xrc-post-prompt[^-]/)
  assert.doesNotMatch(content, /data-xrc-config-save/)
  assert.match(content, /scheduleConfigSave\(panel/)
  assert.doesNotMatch(content, /<strong>当前内容<\/strong>/)
  assert.doesNotMatch(content, /data-xrc-post-preview/)
  assert.doesNotMatch(content, /REPLY_DAILY_LIMIT|xrcReplyDailyQuota|xrc-reply-quota|额度已用完/)
  assert.doesNotMatch(backgroundSource, /REPLY_DAILY_LIMIT|xrcReplyDailyQuota|xrc-reply-quota/)
  assert.match(content, /class="xrc-round-pace xrc-pace-row"/)
  assert.match(content, /data-xrc-collapse/)
  assert.match(content, /data-xrc-expand/)
  assert.match(content, /data-xrc-mini-progress/)
  assert.match(content, /data-xrc-start/)
  assert.match(content, /data-xrc-config-key/)
  assert.match(content, /panelView/)
  assert.match(content, /本轮已回复/)
  assert.match(content, /replyMode: "ai"/)
  assert.match(content, /function validReplyMode\(\) \{\s*return "ai";/)
  assert.doesNotMatch(content, /data-xrc-mode="ai"/)
  assert.doesNotMatch(content, /data-xrc-ai-key/)
  assert.doesNotMatch(content, /type="password"/)
  assert.match(content, /data-xrc-secret-input/)
  assert.match(content, /data-1p-ignore="true"/)
  assert.match(content, /不要填写 X 登录密码/)
  assert.match(content, /xrc-ai-generate/)
  assert.doesNotMatch(content, /connectionVerified|测试连接|xrc-ai-test|data-xrc-ai-test/)
  assert.match(content, /尚未配置 DeepSeek API Key · 点击前往模型设置/)
  assert.match(content, /openModelSettingsForKey\(panel\)/)
  assert.doesNotMatch(content, /state\.replyMode === "ai" && !state\.aiKeySaved/)
  assert.doesNotMatch(content, /AI 模式需要先通过连接测试/)
  assert.match(content, /不会发送 X 登录 Cookie/)
  assert.match(content, /tweetText/)
  assert.match(content, /pendingReply/)
  assert.match(content, /function waitRateLimit/)
  assert.match(content, /nextReplyDelaySeconds/)
  assert.match(content, /roundIntervalSeconds/)
  assert.match(content, /第 \$\{shownRound\} 轮/)
  assert.doesNotMatch(content, /本次执行/)
  assert.match(content, /function formatRuntime/)
  assert.match(content, /startedAt/)
  assert.match(content, /function centerPhraseItem/)
  assert.match(content, /list\.scrollTo\(\{ top: 0, behavior \}\)/)
  assert.doesNotMatch(content, /等待发送确认/)
  assert.match(content, /PHRASE_STORE = 7/)
  assert.match(content, /data-xrc-pace/)
  assert.match(content, /重启任务/)
  assert.match(content, /运行中不能改频率/)
  assert.match(content, /慢、中、快、超快/)
  const publishedVersion = resourcePage.match(/const VERSION = '([^']+)'/)?.[1]
  assert.ok(publishedVersion)
  assert.ok(catalog.includes(`x-reply-clipboard-extension-v${publishedVersion}.zip`))
  assert.match(resourcePage, /X高频互动助手/)
  assert.match(resourcePage, /互关浇友/)
  assert.match(resourcePage, /通知回复/)
  assert.match(resourcePage, /const VERSION_HISTORY = \[/)
  assert.match(resourcePage, /version: '3\.5\.0'/)
  assert.match(resourcePage, /version: '3\.6\.0'/)
  assert.match(resourcePage, /version: '3\.6\.1'/)
  assert.match(resourcePage, /version: '3\.6\.2'/)
  assert.match(resourcePage, /version: '3\.6\.3'/)
  assert.match(resourcePage, /version: '3\.6\.4'/)
  assert.match(resourcePage, /version: '3\.6\.5'/)
  assert.match(resourcePage, /version: '3\.6\.6'/)
  assert.match(resourcePage, /version: '3\.6\.7'/)
  assert.match(resourcePage, /version: '3\.6\.8'/)
  assert.match(resourcePage, /version: '3\.6\.9'/)
  assert.match(resourcePage, /version: '3\.6\.10'/)
  assert.match(resourcePage, /version: '3\.6\.11'/)
  const riskMatcher = content.match(/const AUTOMATION_WARNING_RE = ([^\n]+)/)?.[1] || ''
  const transientMatcher = content.match(/const TRANSIENT_ERROR_RE = ([^\n]+)/)?.[1] || ''
  assert.doesNotMatch(riskMatcher, /Something went wrong/)
  assert.match(transientMatcher, /Something went wrong/)
  assert.match(content, /本轮已结束，下一轮/)
  assert.doesNotMatch(content, /评论过于频繁，时间线和通知回复已停止/)
  assert.doesNotMatch(backgroundSource, /xrc-risk-stop-all/)
  assert.match(content, /停止全部任务/)
  assert.match(content, /data-xrc-flow-stop/)
  assert.match(content, /全流程停止/)
  assert.match(content, /关页签不会关掉后台排班/)
  assert.match(content, /xrc-schedule-stop-all/)
  assert.match(content, /xrc-schedule-stop-all" data-xrc-flow-stop/)
  assert.doesNotMatch(content, /data-xrc-flow-hint hidden><\/p>\s*<button[^>]*data-xrc-flow-stop/)
  assert.match(content, /xrc-desk-settings/)
  assert.match(content, /data-xrc-config-open="schedule"/)
  assert.match(content, /xrc-desk-settings[\s\S]*?<circle fill="currentColor" cx="14" cy="8"/)
  assert.doesNotMatch(content, /xrc-desk-settings[\s\S]*?M19\.14 12\.94/)
  assert.match(content, /data-xrc-hub-open[\s\S]*?M19\.14 12\.94/)
  assert.match(content, /xrc-schedule-settings/)
  assert.match(content, /xrc-schedule-rule-controls/)
  assert.match(content, /data-xrc-config-open/)
  assert.match(content, /data-xrc-embed/)
  assert.match(content, /xrcPanelPlacement/)
  assert.match(content, /panelPlacement: "float"/)
  assert.match(content, /xrc-assistant-tabs/)
  assert.doesNotMatch(content, /xrc-tab-index/)
  assert.match(resourcePage, /右侧搜索框下方/)
  assert.match(content, /data-xrc-docs-open/)
  assert.match(content, /DOCS_BASE_URL = "https:\/\/2aran\.com\/resources\/x-reply-clipboard-extension\/docs"/)
  assert.match(content, /AUTOMATION_WARNING_RE/)
  assert.match(content, /DUPLICATE_REPLY_RE/)
  assert.match(content, /result === "duplicate-reply" \|\| result === "send-unconfirmed"/)
  assert.match(content, /forceDraft: true/)
  assert.match(content, /本轮提前结束/)
  assert.match(content, /applyRiskStop\(\)/)
  assert.match(content, /post-unavailable/)
  assert.match(content, /原帖已删除或当前账号看不到，已跳过/)
  assert.match(content, /trying to reply to has been deleted or is not visible/)
  assert.match(content, /openMutualWindows/)
  assert.match(content, /mutual-unfollow/)
  assert.match(content, /mutual-followBack/)
  assert.match(content, /mutual-targetFollow/)
  assert.match(mutualSource, /you are rate limited/)
  assert.match(mutualSource, /X 提示操作过密/)
  assert.match(content, /reconnectReason/)
  assert.match(content, /空评论框对不上当前帖子/)
  assert.doesNotMatch(content, /检测到其他评论弹窗/)
  assert.match(content, /nextRoundAt/)
  assert.doesNotMatch(backgroundSource, /xrc-risk-stop-all/)
  assert.match(resourcePage, /version: '3\.1\.2'/)
  assert.match(resourcePage, /version: '3\.1\.1'/)
  assert.match(resourcePage, /version: '3\.1\.0'/)
  assert.match(resourcePage, /version: '3\.0\.0'/)
  assert.match(resourcePage, /version: '2\.0\.0'/)
  assert.match(resourcePage, /version: '0\.2\.1'/)
  assert.match(resourcePage, /当前版本 v\{VERSION\}/)
  assert.match(resourcePage, /<ExtensionDownloadButton href=\{DOWNLOAD_URL\} version=\{VERSION\}/)
  assert.match(downloadButton, /获取邀请码并下载 v\$\{version\}/)
  assert.match(downloadButton, /ZIP 会内置回执密钥/)
  assert.match(downloadButton, /INVITE_BOUND/)
  assert.match(downloadButton, /已激活为设备码/)
  assert.match(downloadButton, /INVALID_PASSWORD/)
  assert.match(downloadButton, /method: 'POST'/)
  assert.match(downloadButton, /qrcode-wechat\.jpg/)
  assert.match(downloadButton, /response\.blob\(\)/)
  assert.doesNotMatch(resourcePage, /\/resources\/x-clipboard-phrase/)
  assert.match(registry, /slug: 'x-reply-clipboard-extension', title: 'X高频互动助手'/)
  assert.match(registry, /'评论管理'/)
  assert.match(toolItems, /id: 'x-reply-clipboard',[\s\S]*title: 'X高频互动助手'/)
  assert.doesNotMatch(toolItems, /id: 'x-mutual-cleaner'/)
  assert.doesNotMatch(toolItems, /id: 'x-clipboard-phrase'/)
  assert.doesNotMatch(catalog, /x-clipboard-phrase/)
  assert.match(toolItems, /role: 'Chrome 扩展 · 评论、点赞、关注与定时发帖'/)
})

test('documentation center opens the 2aran.com docs route with section hashes', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const backgroundSource = await readFile(new URL('background.js', extensionDir), 'utf8')
  const docsPage = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', extensionDir), 'utf8')
  const resourcePage = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/page.jsx', extensionDir), 'utf8')
  assert.doesNotMatch(content, /data-xrc-flow-docs[^>]*>打开站点文档 · 全流程说明/)
  assert.match(content, /DOCS_BASE_URL = "https:\/\/2aran\.com\/resources\/x-reply-clipboard-extension\/docs"/)
  assert.match(content, /window\.open\(`\$\{DOCS_BASE_URL\}\$\{hash\}`, "_blank", "noopener,noreferrer"\)/)
  assert.match(content, /"xrc-docs-flow": "flow"/)
  assert.match(content, /"xrc-docs-risk": "risk"/)
  assert.match(content, /"xrc-docs-mutual-rules": "mutual-rules"/)
  assert.match(content, /data-xrc-docs-target="xrc-docs-risk"/)
  assert.match(content, /"mutual-unfollow": \["xrc-docs-mutual-unfollow"/)
  assert.doesNotMatch(content, /data-xrc-docs hidden/)
  assert.doesNotMatch(content, /data-xrc-docs-close/)
  assert.match(resourcePage, /href=\{`\/resources\/\$\{RESOURCE_SLUG\}\/docs`\}/)
  assert.match(docsPage, /id="flow"/)
  assert.match(docsPage, /id="states"/)
  assert.match(docsPage, /id="risk"/)
  assert.match(docsPage, /id="tasks"/)
  assert.match(docsPage, /id="comments"/)
  assert.match(docsPage, /id="likes"/)
  assert.match(docsPage, /id="mutual-rules"/)
  assert.match(docsPage, /id="poster"/)
  assert.match(docsPage, /id="frequency"/)
  assert.match(docsPage, /id="rules"/)
  assert.match(docsPage, /id="maintenance"/)
  assert.match(docsPage, /id="releases"/)
  assert.match(docsPage, /x-extension-docs-toc/)
  assert.match(docsPage, /id="version-path"/)
  assert.match(docsPage, /来时路 · v0 → v4/)
  assert.match(docsPage, /VERSION_ERAS/)
  assert.match(docsPage, /原型闭环/)
  assert.match(docsPage, /正式面板/)
  assert.match(docsPage, /AI 回复/)
  assert.match(docsPage, /从 v3 升级到 v4/)
  assert.match(docsPage, /多页签并行/)
  assert.match(docsPage, /单页签串行/)
  assert.match(docsPage, /不再为无关等待干耗时间/)
  assert.match(docsPage, /id="v3-to-v4"/)
  assert.match(docsPage, /TaskWindowPlan/)
  assert.doesNotMatch(docsPage, /TaskSchedulePrototype/)
  const windowPlan = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/TaskWindowPlan.jsx', extensionDir), 'utf8')
  assert.match(windowPlan, /panel-v4-schedule-desk\.webp/)
  assert.match(windowPlan, /panel-v4-task-rounds\.webp/)
  assert.match(windowPlan, /panel-v4-panel-overview\.webp/)
  assert.match(windowPlan, /真实面板/)
  assert.match(windowPlan, /面板长什么样/)
  assert.doesNotMatch(windowPlan, /账号 A/)
  assert.match(docsPage, /评论、点赞、关注和发帖共十二项任务/)
  assert.match(docsPage, /id: 'reply-kol', label: '评论大V', depth: 2/)
  assert.match(docsPage, /id="reply-kol"[\s\S]*评论大V/)
  assert.match(docsPage, /优先评论他们当天的帖子/)
  assert.match(docsPage, /PromptVoteLedger/)
  assert.match(docsPage, /点击任务只切换面板里的详情，不改变排班队列/)
  assert.match(docsPage, /当前任务卡上的「查看」/)
  assert.match(docsPage, /上一任务 \/ 当前任务 \/ 下一任务/)
  assert.match(docsPage, /完成本次全部轮次后才让出共享执行页签|完成本次全部轮次后让出共享页签/)
  assert.match(docsPage, /运行中[\s\S]*等待中[\s\S]*需处理[\s\S]*已停止/)
  assert.match(docsPage, /运行中绿边跑马灯，等待中黄边跑马灯，已停止 \/ 需处理红边呼吸/)
  assert.match(docsPage, /SINGLE_BUTTON_ROWS[\s\S]*正在停止', '等待中 · 请稍候'/)
  assert.match(docsPage, /FLOW_BUTTON_ROWS[\s\S]*启动排班/)
  assert.match(docsPage, /有任务在跑', '状态点', '右上角「暂停」'/)
  assert.match(docsPage, /在排队等下一项', '状态点', '右上角「暂停」'/)
  assert.match(docsPage, /停止全部/)
  assert.match(docsPage, /右上角「暂停」/)
  assert.match(content, /data-xrc-schedule-toggle data-mode="pause">暂停/)
  assert.match(docsPage, /只关执行页签不会关掉后台排班/)
  assert.match(docsPage, /右上角在「暂停」和「开始」之间切换/)
  assert.match(docsPage, /排班启动与状态[\s\S]*四类状态/)
  assert.match(docsPage, /一次按速度抓一批/)
  assert.match(docsPage, /从已安装的 v3 下载包切到本地 v4/)
  assert.match(docsPage, /第一次等待 10 分钟，再次受限等待 20 分钟，第三次 30 分钟/)
  assert.match(docsPage, /关注名单提示普通限速：先等 15 分钟/)
  assert.match(docsPage, /扫到列表底部后等 30 分钟再扫描/)
  assert.match(docsPage, /回关粉丝优先处理姓名或简介含汉字的账号/)
  assert.match(docsPage, /评论首页、评论大V默认用下面的边界测试/)
  assert.match(docsPage, /id="daily-volume"/)
  assert.match(docsPage, /500～800 条/)
  assert.match(docsPage, /插件不设每日回复总量/)
  assert.match(docsPage, /每日报告随心跳自动同步当日统计/)
  assert.doesNotMatch(docsPage, /同步历史/)
  assert.match(docsPage, /频率与设置/)
  assert.match(docsPage, /PostWaveTimeline/)
  assert.match(docsPage, /id: 'poster-wave'/)
  assert.match(docsPage, /发帖波浪时间线/)
  assert.match(docsPage, /id: 'comments', label: '评论管理', depth: 1/)
  assert.match(docsPage, /id: 'reply-timeline', label: '评论首页', depth: 2/)
  assert.match(docsPage, /id="reply-timeline"[\s\S]*一次任务会按所选速度档位生成多轮计划/)
  assert.match(docsPage, /每轮各有回复条数目标/)
  assert.match(docsPage, /正常情况下完成本次全部轮次后才让出共享执行页签/)
  assert.match(docsPage, /id: 'poster', label: '定时发帖', depth: 1/)
  assert.match(docsPage, /id: 'poster-wave', label: '发帖波浪时间线', depth: 2/)
  assert.match(docsPage, /border-l border-\[var\(--site-line\)\]/)
  assert.match(docsPage, /平台边界与官方来源/)
  assert.match(docsPage, /不代表 X 认可的安全阈值/)
  assert.match(docsPage, /https:\/\/help\.x\.com\/en\/rules-and-policies\/x-automation/)
  assert.match(docsPage, /loadXExtensionReleaseWeeks/)
  assert.match(docsPage, /周总结/)
  assert.match(docsPage, /第 1 周从 README 里第一条带日期的版本所在周开始/)
  assert.match(docsPage, /id="poster-wave"/)
  const waveTimeline = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/PostWaveTimeline.jsx', extensionDir), 'utf8')
  assert.match(waveTimeline, /普通发帖 · 一天波浪时间线/)
  assert.match(waveTimeline, /07:00–10:00/)
  assert.match(waveTimeline, /12:30–13:30/)
  assert.match(waveTimeline, /18:00–22:00/)
  assert.match(waveTimeline, /精品发帖固定档位/)
  assert.match(content, /currentTaskDetail|currentTaskWaitUntil/)
  assert.match(backgroundSource, /setCommandHandler|executeRemoteCommand|flow-start/)
  assert.match(backgroundSource, /ext-update/)
  assert.match(backgroundSource, /applyLocalDevUpdate/)
})

test('each subtask info link targets its own revealed documentation section', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  const docsPage = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/page.jsx', import.meta.url), 'utf8')
  const hashNavigation = await readFile(new URL('../../app/(site)/resources/x-reply-clipboard-extension/docs/DocsHashNavigation.jsx', import.meta.url), 'utf8')
  const targets = ['reply-timeline', 'reply-notifications', 'likes-posts', 'likes-replies', 'mutual-unfollow', 'mutual-followback', 'poster', 'poster-normal', 'poster-wave', 'poster-premium', 'poster-x']
  for (const target of targets) {
    assert.match(content, new RegExp(`xrc-docs-${target}`))
    assert.match(docsPage, new RegExp(`id="${target}"`))
  }
  assert.match(content, /"likes-replies": \["xrc-docs-likes-replies", "查看点赞评论说明"\]/)
  assert.match(content, /notifications: \["xrc-docs-reply-notifications", "查看评论回复说明"\]/)
  assert.match(content, /const docs = TASK_DOCS_TARGETS\[viewKey\]/)
  assert.match(content, /button\.addEventListener\("click", \(\) => openDocs\(button\.dataset\.xrcDocsTarget\)\)/)
  assert.match(hashNavigation, /parent instanceof HTMLDetailsElement\) parent\.open = true/)
  assert.match(hashNavigation, /target\.scrollIntoView/)
})

test('today totals expose a compact calendar entry and poster stats identify the current run', async () => {
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(content, /class="xrc-today-report"[^>]*data-xrc-report-open[^>]*aria-label="打开日历统计"/)
  assert.match(content, /class="xrc-today-head"[\s\S]*class="xrc-today-labels"[\s\S]*class="xrc-today-values"/)
  assert.match(content, /data-xrc-post-card-label>普通发帖 · 本次运行[\s\S]*本次已发送 0 条/)
  assert.match(content, /querySelectorAll\("\[data-xrc-report-open\]"\)/)
})

test('DeepSeek background worker keeps AI replies short and non-thinking', async () => {
  const backgroundText = await readFile(new URL('background.js', extensionDir), 'utf8')
  const background = require('../../tools/x-reply-clipboard-extension/background.js')

  assert.equal(background.DEEPSEEK_MODEL, 'deepseek-flash')
  assert.equal(background.REQUEST_TIMEOUT_MS, 10000)
  assert.equal(background.validTaskMode('poster'), 'poster')
  assert.equal(background.validTaskMode('likes'), 'likes-posts')
  assert.equal(background.validTaskMode('likes-replies'), 'likes-replies')
  assert.equal(background.validTaskMode('mutual'), 'mutual-unfollow')
  assert.equal(background.validTaskMode('mutual-followBack'), 'mutual-followBack')
  assert.equal(background.validTaskMode('unknown'), 'timeline')
  assert.equal(background.taskTabUrl('notifications', 'https://x.com/home'), 'https://x.com/notifications?xrcAssistant=notifications')
  assert.equal(background.taskTabUrl('likes-posts', 'https://x.com/notifications'), 'https://x.com/home?xrcAssistant=likes-posts')
  assert.equal(background.taskTabUrl('likes-replies', 'https://x.com/notifications'), 'https://x.com/home?xrcAssistant=likes-replies')
  assert.match(backgroundText, /const FLOW_TASKS = \[[^\]]+\];/)
  assert.match(backgroundText.match(/const FLOW_TASKS = \[[^\]]+\];/)?.[0] || '', /"likes-posts", "likes-replies"/)
  assert.equal(background.taskTabUrl('mutual-unfollow', 'https://x.com/home'), 'https://x.com/home?xrcAssistant=mutual-unfollow')
  assert.equal(background.taskTabUrl('poster', 'https://twitter.com/home'), 'https://twitter.com/home?xrcAssistant=poster')
  assert.equal(background.taskTabUrl('poster', 'https://x.com/home', { start: true }), 'https://x.com/home?xrcAssistant=poster&xrcStart=1')
  assert.equal(background.taskPageUrl('poster', 'https://x.com/wangchangfu88', { start: true }), 'https://x.com/home')
  assert.equal(background.taskPageUrl('notifications', 'https://x.com/home'), 'https://x.com/notifications')
  assert.equal(background.taskPageUrl('mutual-unfollow', 'https://x.com/home', { start: true, accountHandle: 'Tuaran' }), 'https://x.com/Tuaran/following')
  assert.match(background.taskTabUrl('mutual-targetFollow', 'https://twitter.com/home'), /^https:\/\/twitter.com\/(?:crazypig9y|jianlvup|jianlvya|kyotom08|Chill_Alpha)\/followers\?xrcAssistant=mutual-targetFollow$/)
  assert.equal(background.taskTabUrl('timeline', 'https://x.com/home', { start: true }), 'https://x.com/home?xrcAssistant=timeline&xrcStart=1')
  assert.equal(background.taskTabUrl('mutual-unfollow', 'https://x.com/home', { start: true, accountHandle: '@Tuaran' }), 'https://x.com/Tuaran/following?xrcAssistant=mutual-unfollow&xrcStart=1')
  assert.equal(background.taskTabUrl('mutual-followBack', 'https://x.com/home', { start: true, accountHandle: 'Tuaran' }), 'https://x.com/Tuaran/followers?xrcAssistant=mutual-followBack&xrcStart=1')
  assert.equal(background.taskTabUrl('mutual-unfollow', 'https://x.com/home', { accountHandle: 'Tuaran' }), 'https://x.com/Tuaran/following?xrcAssistant=mutual-unfollow')
  assert.doesNotMatch(background.taskTabUrl('poster', 'https://x.com/home'), /xrcStart=1/)
  assert.match(background.taskTabUrl('mutual-targetFollow', 'https://x.com/home', { start: true }), /^https:\/\/x\.com\/(?:crazypig9y|jianlvup|jianlvya|kyotom08|Chill_Alpha)\/followers\?xrcAssistant=mutual-targetFollow&xrcStart=1$/)
  assert.match(backgroundText, /xrc-flow-start/)
  assert.match(backgroundText, /xrc-flow-pause/)
  assert.match(backgroundText, /phase: "starting"/)
  assert.match(backgroundText, /phase: "stopped"/)
  assert.match(background.REPLY_SYSTEM_PROMPT, /短到几个字也可以/)
  assert.equal(background.cleanReply('回复：“这个角度很有意思\n值得继续观察👀”'), '这个角度很有意思 值得继续观察👀')
  assert.match(background.POST_SYSTEM_PROMPT, /说个暴论/)
  assert.match(background.POST_SYSTEM_PROMPT, /不写币、代币、合约/)
  assert.doesNotMatch(background.POST_SYSTEM_PROMPT, /\$代币/)
  assert.equal(background.cleanPost('推文：第一行\n第二行\n\n第三行'), '第一行\n\n第二行\n\n第三行')
  assert.equal(background.cleanPost('听说东北以前一家子睡一个炕。\n$KAITO'), '听说东北以前一家子睡一个炕。')
  assert.match(background.POST_PREMIUM_PROMPT, /2～4 短段/)
  assert.match(backgroundText, /https:\/\/api\.deepseek\.com\/chat\/completions/)
  assert.match(backgroundText, /thinking: \{ type: "disabled" \}/)
  assert.match(backgroundText, /max_tokens: grokReply \? 160 : 96/)
  assert.match(backgroundText, /已被 X 判定为重复/)
  assert.match(backgroundText, /xrc-ai-post-generate/)
  assert.match(backgroundText, /xrc-ai-news-rewrite/)
  assert.doesNotMatch(backgroundText, /xrc-ai-source-rewrite/)
  assert.match(backgroundText, /max_tokens: 160/)
  assert.match(backgroundText, /这次用一两句白话带到 AI 或 Web3/)
  assert.doesNotMatch(backgroundText, /xrc-ai-test|连通测试|test = false/)
  assert.match(backgroundText, /chrome\.storage\.local/)
  assert.match(backgroundText, /settings\.replyPrompt/)
  assert.match(backgroundText, /settings\.postPrompt/)
  assert.match(backgroundText, /replyTimelinePrompt/)
  assert.match(backgroundText, /postPremiumPrompt/)
  assert.match(backgroundText, /resolvePromptBundle/)
})

test('task windows are created once and reused without backgrounding another task', async () => {
  const background = require('../../tools/x-reply-clipboard-extension/background.js')
  let savedTabs = {}
  const sessionData = {}
  let created = 0
  const createdUrls = []
  const focusedTabs = []
  const tabUpdates = []
  const focusedWindows = []
  const movedTabs = []
  let notificationsUrl = 'https://x.com/notifications'
  let runtimeTasks = {}
  global.chrome = {
    storage: {
      session: {
        async get(key) {
          if (key === 'xrcTaskTabs') return { [key]: savedTabs }
          return { [key]: sessionData[key] }
        },
        async set(value) {
          if (Object.prototype.hasOwnProperty.call(value, 'xrcTaskTabs')) savedTabs = value.xrcTaskTabs
          Object.assign(sessionData, value)
        },
      },
      local: {
        async get(key) { return key === 'xrcPluginRuntime' ? { [key]: { tasks: runtimeTasks } } : {} },
        async set() {},
      },
    },
    tabs: {
      async get(tabId) {
        if (tabId === 77) return { id: 77, windowId: 9, url: notificationsUrl }
        if (tabId === 11) return { id: 11, windowId: 5, url: 'https://x.com/home' }
        if (tabId === 22) return { id: 22, windowId: 5, url: 'https://x.com/notifications' }
        throw new Error('missing tab')
      },
      async query() { return [{ id: 11, windowId: 5, url: 'https://x.com/home', title: '评论首页 · Home / X' }] },
      async update(tabId, options) { focusedTabs.push(tabId); tabUpdates.push(options) },
    },
    windows: {
      async create(options) {
        created += 1
        if (options.tabId) {
          movedTabs.push(options.tabId)
          return { id: 30, tabs: [{ id: options.tabId }] }
        }
        createdUrls.push(options.url)
        return { id: 10, tabs: [{ id: 77, windowId: 10, url: options.url }] }
      },
      async update(windowId) { focusedWindows.push(windowId) },
    },
  }
  try {
    const first = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    const second = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.equal(first.reused, false)
    assert.equal(first.tabId, 77)
    assert.equal(second.reused, true)
    assert.equal(created, 1)
    assert.deepEqual(createdUrls, ['https://x.com/notifications?xrcAssistant=notifications'])
    assert.deepEqual(focusedTabs, [77])
    assert.deepEqual(focusedWindows, [9])
    assert.equal(savedTabs.notifications, 77)
    assert.deepEqual(tabUpdates[0], { active: true })

    const restarted = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } }, { start: true })
    assert.equal(restarted.reused, true)
    assert.equal(tabUpdates.at(-1).url, 'https://x.com/notifications?xrcAssistant=notifications&xrcStart=1')
    assert.equal(sessionData['xrcPendingTab:77'].start, true)

    runtimeTasks = { notifications: { tabId: 77, phase: 'running', startedAt: Date.now() } }
    notificationsUrl = 'https://x.com/someone/status/123'
    await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.deepEqual(tabUpdates.at(-1), { active: true })
    runtimeTasks = {}

    savedTabs = {}
    const recovered = await background.focusTaskTab('timeline', { tab: { url: 'https://x.com/home' } }, { start: true })
    assert.equal(recovered.reused, true)
    assert.equal(recovered.tabId, 11)
    assert.equal(savedTabs.timeline, 11)
    assert.equal(created, 1)

    savedTabs = { timeline: 11, notifications: 22 }
    const moved = await background.focusTaskTab('notifications', { tab: { url: 'https://x.com/home' } })
    assert.equal(moved.reused, true)
    assert.deepEqual(movedTabs, [22])
    assert.equal(focusedWindows.at(-1), 30)

    await background.registerTaskTab('timeline', 22)
    assert.equal(savedTabs.timeline, 22)
    assert.equal(savedTabs.notifications, undefined)
  } finally {
    delete global.chrome
  }
})

test('single tab scheduler honors time windows, cooldowns and the premium posting slot', () => {
  const morning = Date.parse('2026-10-28T09:30:00+08:00')
  const afternoon = Date.parse('2026-10-28T13:00:00+08:00')
  const night = Date.parse('2026-10-28T21:00:00+08:00')
  const plan = { enabledAt: morning - 60000, rules: {
    'likes-posts': { enabled: false },
    'mutual-unfollow': { window: 'peak' },
  }, items: { notifications: { resumeAt: morning + 3600000 } } }
  const morningDue = background.dueTaskModes(plan, morning)
  assert.equal(morningDue[0], 'timeline')
  assert.ok(morningDue.indexOf('timeline') < morningDue.indexOf('poster-premium'))
  assert.ok(!morningDue.includes('notifications'))
  assert.ok(!morningDue.includes('likes-posts'))
  assert.ok(morningDue.includes('mutual-unfollow'))
  assert.ok(!background.dueTaskModes(plan, afternoon).includes('poster-premium'))
  assert.ok(!background.dueTaskModes(plan, afternoon).includes('mutual-unfollow'))
  assert.ok(!background.dueTaskModes(plan, night).includes('poster-premium'))
  const fairPlan = { enabledAt: afternoon - 60 * 60000, rules: { timeline: { priority: 8 }, 'likes-replies': { priority: 5, minGapMs: 0 } }, items: {
    timeline: { lastRunAt: afternoon - 60000 },
    'likes-replies': { lastRunAt: afternoon - 60 * 60000 },
  } }
  assert.ok(background.dueTaskModes(fairPlan, afternoon).indexOf('timeline') < background.dueTaskModes(fairPlan, afternoon).indexOf('likes-replies'))
})

test('mutual unfollow defaults to about once a week and keeps a longer occupancy pass', () => {
  const now = Date.parse('2026-10-28T10:00:00+08:00')
  const rules = background.normalizedTaskRules({})
  assert.equal(rules['mutual-unfollow'].minGapMs, background.UNFOLLOW_MIN_GAP_MS)
  assert.equal(background.sliceMsForMode('mutual-unfollow', { sliceSeconds: 30 }), background.UNFOLLOW_SLICE_MS)
  assert.equal(background.sliceMsForMode('timeline', { sliceSeconds: 30 }), 8 * 60 * 60 * 1000)
  assert.equal(background.sliceMsForMode('likes-posts', { sliceSeconds: 30 }), background.LIKE_SLICE_MS)
  assert.equal(rules['likes-posts'].minGapMs, background.LIKE_MIN_GAP_MS)
  assert.equal(rules['likes-posts'].pace, 'slow')
  assert.equal(rules['likes-replies'].priority, rules['likes-posts'].priority)
  assert.ok(rules.notifications.priority > rules.timeline.priority)
  assert.ok(rules.timeline.priority > rules['poster-premium'].priority)
  assert.ok(rules['poster-premium'].priority > rules.poster.priority)
  assert.equal(rules['poster-x'].priority, rules.poster.priority)
  assert.equal(rules['poster-x'].pace, 'slow')
  assert.equal(rules['poster-x'].enabled, true)
  assert.ok(rules.poster.priority > rules['likes-posts'].priority)
  assert.ok(rules['likes-posts'].priority > rules['mutual-followBack'].priority)

  const recent = {
    enabledAt: now - 60000,
    rules: {},
    items: { 'mutual-unfollow': { lastRunAt: now - 2 * 24 * 60 * 60 * 1000 } },
  }
  assert.ok(!background.dueTaskModes(recent, now).includes('mutual-unfollow'))

  const ready = {
    enabledAt: now - 60000,
    rules: {},
    items: { 'mutual-unfollow': { lastRunAt: now - 8 * 24 * 60 * 60 * 1000 } },
  }
  assert.ok(background.dueTaskModes(ready, now).includes('mutual-unfollow'))

  const timeline = background.scheduleTimeline({
    enabled: true,
    current: 'timeline',
    items: { 'mutual-unfollow': { lastRunAt: now - 2 * 24 * 60 * 60 * 1000, reason: '清理未回关约每周一次，等待下次排班' } },
    rules: {},
  }, now)
  const unfollow = timeline.future.find((entry) => entry.mode === 'mutual-unfollow')
  assert.equal(unfollow.status, 'scheduled')
  assert.ok(unfollow.readyAt >= now + 4 * 24 * 60 * 60 * 1000)
})

test('default schedule ranks frequent actions first and reserves follow-back for night', () => {
  const now = Date.parse('2026-10-28T23:00:00+08:00')
  const rules = background.normalizedTaskRules({})
  assert.equal(rules.timeline.pace, 'boundary')
  assert.equal(rules.notifications.pace, 'medium')
  assert.equal(background.normalizedTaskRules({ 'likes-posts': { pace: 'slow' } })['likes-posts'].pace, 'slow')
  assert.equal(rules['mutual-followBack'].minGapMs, background.FOLLOW_BACK_MIN_GAP_MS)
  assert.equal(rules['mutual-followBack'].window, 'overnight')
  assert.equal(rules['mutual-targetFollow'].minGapMs, background.TARGET_FOLLOW_MIN_GAP_MS)
  assert.equal(background.sliceMsForMode('mutual-followBack', { sliceSeconds: 30 }), background.FOLLOW_BACK_SLICE_MS)
  assert.equal(background.sliceMsForMode('mutual-targetFollow', { sliceSeconds: 30 }), background.TARGET_FOLLOW_SLICE_MS)
  assert.deepEqual(background.normalizeTargetFollowHandles('@Foo\n@bar ,foo'), ['Foo', 'bar'])
  assert.deepEqual(background.dueTaskModes({ enabledAt: now - 60000, rules: {}, items: {} }, now), [
    'notifications', 'timeline', 'poster', 'poster-x', 'likes-posts', 'likes-replies',
    'mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow',
  ])
  const recent = { enabledAt: now - 60000, rules: {}, items: { 'mutual-followBack': { lastRunAt: now - 23 * 60 * 60 * 1000 } } }
  assert.equal(background.dueTaskModes(recent, now).includes('mutual-followBack'), false)
  recent.items['mutual-followBack'].lastRunAt = now - 25 * 60 * 60 * 1000
  assert.equal(background.dueTaskModes(recent, now).includes('mutual-followBack'), true)
  assert.equal(background.dueTaskModes(recent, Date.parse('2026-10-29T13:00:00+08:00')).includes('mutual-followBack'), false)
  assert.equal(background.dueTaskModes(recent, Date.parse('2026-10-29T05:00:00+08:00')).includes('mutual-followBack'), true)
  const nightSession = { enabledAt: now - 60000, rules: {}, items: { 'mutual-followBack': {
    lastRunAt: now, followBackSessionUntil: background.followBackNightEndsAt(now), resumeAt: now + 30 * 60000,
  } } }
  assert.equal(background.dueTaskModes(nightSession, now + 20 * 60000).includes('mutual-followBack'), false)
  assert.equal(background.dueTaskModes(nightSession, now + 31 * 60000).includes('mutual-followBack'), true)
  assert.equal(background.followBackNightEndsAt(now), Date.parse('2026-10-29T06:00:00+08:00'))
  assert.equal(background.followBackNightEndsAt(Date.parse('2026-10-29T05:00:00+08:00')), Date.parse('2026-10-29T06:00:00+08:00'))
  const dawnStart = Date.parse('2026-10-29T05:00:00+08:00')
  const nextDawn = Date.parse('2026-10-30T05:00:00+08:00')
  const afterDawnSession = { enabledAt: dawnStart, rules: {}, items: { 'mutual-followBack': {
    lastRunAt: dawnStart, followBackSessionUntil: background.followBackNightEndsAt(dawnStart), resumeAt: nextDawn,
  } } }
  assert.equal(background.dueTaskModes(afterDawnSession, Date.parse('2026-10-29T23:00:00+08:00')).includes('mutual-followBack'), false)
  assert.equal(background.dueTaskModes(afterDawnSession, nextDawn).includes('mutual-followBack'), true)
})

test('an explicit start request takes the next free schedule slot even before its retry deadline', () => {
  const now = Date.parse('2026-10-28T13:00:00+08:00')
  const plan = { enabledAt: now - 60000, rules: {}, items: {
    timeline: { resumeAt: now + 60000, manualRequestedAt: now },
    'mutual-followBack': { resumeAt: now + 30 * 60000, lastRunAt: now, manualRequestedAt: now },
  } }
  const due = background.dueTaskModes(plan, now)
  assert.equal(due[0], 'timeline')
  assert.ok(due.includes('mutual-followBack'))
  assert.ok(due.indexOf('mutual-followBack') < due.indexOf('notifications'))
})

test('existing schedule receives the daily follow-back cadence and new default weights once', async () => {
  const previousChrome = globalThis.chrome
  const stored = { xrcTaskSchedule: {
    enabled: false, current: '', items: {}, likeDetectionVersion: 2, replyRiskVersion: 1,
    rules: {
      timeline: { priority: 2 }, notifications: { priority: 2 },
      'likes-posts': { priority: 2 }, 'likes-replies': { priority: 1 },
      poster: { priority: 1 }, 'poster-premium': { priority: 1 },
      'mutual-followBack': { priority: 1, minGapMs: 0 },
    },
  } }
  let writes = 0
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value); writes += 1 },
  } } }
  try {
    const plan = await background.readTaskSchedule()
    assert.equal(plan.rules.notifications.priority, 10)
    assert.equal(plan.rules.timeline.priority, 9)
    assert.equal(plan.rules['poster-premium'].priority, 8)
    assert.equal(plan.rules.poster.priority, 7)
    assert.equal(plan.rules['likes-posts'].priority, 6)
    assert.equal(plan.rules['likes-replies'].priority, 6)
    assert.equal(plan.rules['likes-posts'].pace, 'slow')
    assert.equal(plan.rules['likes-posts'].minGapMs, background.LIKE_MIN_GAP_MS)
    assert.equal(plan.rules['mutual-followBack'].priority, 5)
    assert.equal(plan.rules['mutual-followBack'].minGapMs, background.FOLLOW_BACK_MIN_GAP_MS)
    assert.equal(plan.rules['mutual-followBack'].window, 'overnight')
    assert.equal(plan.priorityOrderVersion, background.PRIORITY_ORDER_VERSION)
    assert.equal(plan.priorityScoreVersion, background.PRIORITY_SCORE_VERSION)
    assert.equal(plan.followBackNightVersion, 1)
    await background.readTaskSchedule()
    assert.equal(writes, 1)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('untouched default scores move up one point and a hand-edited score stays', async () => {
  const previousChrome = globalThis.chrome
  const legacyGap = 45 * 60 * 1000
  const legacyRules = {
    notifications: { priority: 9, pace: 'medium' },
    timeline: { priority: 8, pace: 'boundary' },
    'poster-premium': { priority: 7 },
    poster: { priority: 6 },
    'likes-posts': { priority: 5, pace: 'slow', minGapMs: legacyGap },
    'likes-replies': { priority: 5, pace: 'slow', minGapMs: legacyGap },
    'mutual-followBack': { priority: 4, window: 'overnight' },
    'mutual-targetFollow': { priority: 3 },
    'mutual-unfollow': { priority: 2 },
  }
  const base = {
    enabled: false, current: '', items: {},
    priorityOrderVersion: 3, followBackNightVersion: 1, likeDetectionVersion: 2, replyRiskVersion: 1,
  }
  const stored = { xrcTaskSchedule: { ...base, rules: legacyRules } }
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value) },
  } } }
  try {
    const plan = await background.readTaskSchedule()
    assert.equal(plan.rules.notifications.priority, 10)
    assert.equal(plan.rules.timeline.priority, 9)
    assert.equal(plan.rules['mutual-unfollow'].priority, 3)
    assert.equal(plan.rules['likes-posts'].minGapMs, background.LIKE_MIN_GAP_MS)
    assert.equal(plan.priorityScoreVersion, background.PRIORITY_SCORE_VERSION)
  } finally {
    globalThis.chrome = previousChrome
  }

  const customStored = { xrcTaskSchedule: {
    ...base,
    rules: {
      ...legacyRules,
      notifications: { priority: 7, pace: 'medium' },
    },
  } }
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: customStored[key] } },
    async set(value) { Object.assign(customStored, value) },
  } } }
  try {
    const plan = await background.readTaskSchedule()
    assert.equal(plan.rules.notifications.priority, 7)
    assert.equal(plan.rules.timeline.priority, 8)
    assert.equal(plan.rules['likes-posts'].minGapMs, background.LIKE_MIN_GAP_MS)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('confirmed follow-back action stays in its daily pass until the pass ends', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const stored = { xrcTaskSchedule: {
    enabled: true, strategyVersion: 4, current: 'mutual-followBack', startedAt: now,
    priorityOrderVersion: 1, likeDetectionVersion: 2, replyRiskVersion: 1,
    items: { 'mutual-followBack': { sliceActions: 0 } },
  } }
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: stored[key] } },
    async set(value) { Object.assign(stored, value) },
  } }, alarms: { async create() {}, async clear() {} } }
  try {
    await background.noteScheduledAction({ task: 'mutual-follow-back', result: 'success' })
    assert.equal(stored.xrcTaskSchedule.current, 'mutual-followBack')
    assert.equal(stored.xrcTaskSchedule.items['mutual-followBack'].sliceActions, 1)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('follow-back yields a 30-minute batch cooldown and can resume within its night session', async () => {
  const previousChrome = globalThis.chrome
  const previousDateNow = Date.now
  const now = Date.parse('2026-10-28T23:00:00+08:00')
  Date.now = () => now
  const otherModes = ['timeline', 'notifications', 'likes-posts', 'likes-replies', 'poster', 'poster-premium', 'mutual-unfollow']
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'mutual-followBack', workTabId: 11,
      startedAt: now - 10 * 60 * 1000 - 1000, priorityOrderVersion: 1,
      likeDetectionVersion: 2, replyRiskVersion: 1,
      items: { 'mutual-followBack': { sliceActions: 2, manualRequestedAt: now }, ...Object.fromEntries(otherModes.map((mode) => [mode, { manualStopped: true }])) },
    },
    xrcPluginRuntime: { tasks: { 'mutual-followBack': { tabId: 11, phase: 'paused', waitUntil: now + 30 * 60000, detail: '每 15 个暂停 30 分钟', updatedAt: now } }, flow: { phase: 'running' } },
  }
  const session = { xrcTaskTabs: { 'mutual-followBack': 11 } }
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id === 11) return { id, url: 'https://x.com/account/followers' }; throw new Error('missing') },
      async sendMessage(_id, message) { return message.type === 'xrc-task-state-probe'
        ? { ok: true, mode: 'mutual-followBack', phase: 'paused', waitUntil: now + 30 * 60000, detail: '每 15 个暂停 30 分钟' } : { ok: true } },
      async remove() {},
    },
    alarms: { async create() {}, async clear() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(local.xrcTaskSchedule.current, '')
    assert.equal(local.xrcTaskSchedule.items['mutual-followBack'].lastRunAt, now - 10 * 60 * 1000 - 1000)
    assert.equal(local.xrcTaskSchedule.items['mutual-followBack'].resumeAt, now + 30 * 60000)
    assert.equal(local.xrcTaskSchedule.items['mutual-followBack'].manualRequestedAt, 0)
    assert.equal(local.xrcTaskSchedule.items['mutual-followBack'].followBackSessionUntil, Date.parse('2026-10-29T06:00:00+08:00'))
    assert.equal(background.dueTaskModes(local.xrcTaskSchedule, now + 31 * 60000).includes('mutual-followBack'), true)
  } finally {
    globalThis.chrome = previousChrome
    Date.now = previousDateNow
  }
})

test('schedule desk records finished shifts and estimates the next ready task', () => {
  const now = Date.parse('2026-10-28T10:00:00+08:00')
  const plan = {
    enabled: true,
    current: '',
    startedAt: now - 10 * 60000,
    history: [],
    items: {
      timeline: { sliceActions: 4, resumeAt: 0 },
      notifications: { resumeAt: now + 30 * 60000, reason: '冷却中' },
      poster: { manualStopped: true },
    },
    rules: {},
  }
  background.recordScheduleSegment(plan, 'timeline', '本轮占用结束', now)
  assert.equal(plan.history.length, 1)
  assert.equal(plan.history[0].mode, 'timeline')
  assert.equal(plan.history[0].actions, 4)
  assert.equal(plan.history[0].reason, '本轮占用结束')
  assert.equal(plan.items.timeline.sliceActions, 0)

  const timeline = background.scheduleTimeline(plan, now)
  assert.equal(timeline.history[0].mode, 'timeline')
  assert.ok(timeline.future.some((entry) => entry.status === 'ready'))
  const waiting = timeline.future.find((entry) => entry.mode === 'notifications')
  assert.equal(waiting.status, 'scheduled')
  assert.ok(waiting.readyAt >= now + 30 * 60000)
  const stopped = timeline.future.find((entry) => entry.mode === 'poster')
  assert.equal(stopped.status, 'stopped')
})

test('a waiting schedule keeps its shared tab and reuses it when the next task is due', async () => {
  const previousChrome = globalThis.chrome
  const previousDateNow = Date.now
  const now = Date.parse('2026-10-28T13:00:00+08:00')
  let clock = now
  Date.now = () => clock
  const otherModes = ['timeline', 'notifications', 'likes-posts', 'likes-replies', 'poster-premium', 'poster-x', 'mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow']
  const local = { xrcTaskSchedule: {
    enabled: true, strategyVersion: 4, current: '', workTabId: 11, startedAt: 0,
    priorityOrderVersion: 1, followBackNightVersion: 1, likeDetectionVersion: 2, replyRiskVersion: 1,
    items: { poster: { resumeAt: now + 60000 }, ...Object.fromEntries(otherModes.map((mode) => [mode, { manualStopped: true }])) },
  }, xrcPluginRuntime: { tasks: {}, flow: { phase: 'running' } } }
  const session = { xrcTaskTabs: {} }
  const opened = []
  const started = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id !== 11) throw new Error('closed'); return { id, windowId: 1, url: 'https://x.com/home' } },
      async sendMessage(id, message) { started.push({ id, message }); return { ok: true, phase: 'running' } },
      async update() {},
      async create(options) { opened.push(options); throw new Error('unexpected new tab') },
      async remove(id) { opened.push({ removed: id }) },
    },
    alarms: { async create() {}, async clear() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(local.xrcTaskSchedule.current, '')
    assert.equal(local.xrcTaskSchedule.workTabId, 11)
    assert.deepEqual(opened, [])
    clock += 60000
    await background.runTaskSchedule()
    assert.equal(local.xrcTaskSchedule.current, 'poster')
    assert.equal(local.xrcTaskSchedule.workTabId, 11)
    assert.ok(started.some(({ id, message }) => id === 11 && message.type === 'xrc-task-start' && message.mode === 'poster'))
    assert.deepEqual(opened, [])
  } finally {
    globalThis.chrome = previousChrome
    Date.now = previousDateNow
  }
})

test('a schedule with a lost tab reference adopts the active X tab for the same account', async () => {
  const previousChrome = globalThis.chrome
  const otherModes = ['timeline', 'notifications', 'likes-posts', 'likes-replies', 'poster-premium', 'mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow']
  const local = { xrcTaskSchedule: {
    enabled: true, strategyVersion: 4, accountHandle: 'tuaran', current: '', workTabId: 0,
    priorityOrderVersion: 1, followBackNightVersion: 1, likeDetectionVersion: 2, replyRiskVersion: 1,
    items: { poster: {}, ...Object.fromEntries(otherModes.map((mode) => [mode, { manualStopped: true }])) },
  }, xrcPluginRuntime: { tasks: {}, flow: { phase: 'running' } } }
  const session = { xrcTaskTabs: {} }
  const opened = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async query() { return [{ id: 11, windowId: 1, active: true, url: 'https://x.com/home' }] },
      async get(id) { if (id !== 11) throw new Error('closed'); return { id, windowId: 1, url: 'https://x.com/home' } },
      async sendMessage(id, message) {
        assert.equal(id, 11)
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: 'timeline', phase: '', accountHandle: 'tuaran', scheduleEnabled: true }
        if (message.type === 'xrc-task-start') return { ok: true, phase: 'running' }
        throw new Error(`unexpected ${message.type}`)
      },
      async create(options) { opened.push(options); throw new Error('unexpected new tab') },
    },
    alarms: { async create() {}, async clear() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(local.xrcTaskSchedule.current, 'poster')
    assert.equal(local.xrcTaskSchedule.workTabId, 11)
    assert.deepEqual(opened, [])
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('clicking a posting cooldown never marks the scheduled task as manually stopped', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const toggle = source.match(/  async function onPosterToggle\(\{ scheduledStart = false, requestedMode = "" \} = \{\}\) \{[\s\S]*?\n  \}/)?.[0]
  assert.ok(toggle)
  const state = { poster: { running: true, riskCooldownUntil: Date.now() + 60000, status: '' } }
  const actions = []
  const context = vm.createContext({
    state,
    posterTaskKey: () => 'poster', posterKindFromMode: () => 'normal', currentTaskKey: () => 'poster', validTaskKey: () => '',
    stopScheduledWaitingTask: async () => false,
    postApi: { stop() { actions.push('stopped') } },
    sendExtensionMessage() { actions.push('manual-stop') },
    renderPanel() {},
    Date,
  })
  vm.runInContext(`${toggle}\nglobalThis.toggle = onPosterToggle`, context)
  await context.toggle()
  assert.deepEqual(actions, [])
  assert.match(state.poster.status, /冷却中，到期后自动重试/)
  assert.match(source, /formatUserStateAction\(USER_STATE_LABELS\.waiting, "冷却后自动重试"\)/)
})

test('full flow starts one shared execution tab and keeps all eight tasks in one schedule', async () => {
  const session = {}
  const local = {}
  const opened = []
  const focused = []
  const stopped = []
  const liveTabs = new Map([[5, { id: 5, windowId: 1, url: 'https://x.com/home' }]])
  let nextTabId = 100
  globalThis.chrome = {
    storage: {
      session: {
        async get(key) { return { [key]: session[key] } },
        async set(value) { Object.assign(session, value) },
      },
      local: {
        async get(key) { return { [key]: local[key] } },
        async set(value) { Object.assign(local, value) },
      },
    },
    tabs: {
      async query() { return [] },
      async get(id) {
        if (!liveTabs.has(id)) throw new Error('tab closed')
        return liveTabs.get(id)
      },
      async sendMessage(id, message) {
        stopped.push({ id, message })
        if (message.type === 'xrc-task-start') return { ok: true, phase: 'running' }
        if (message.type === 'xrc-task-suspend') return { ok: true }
        return { ok: true }
      },
      async create({ url }) {
        const id = ++nextTabId
        const tab = { id, windowId: 1, url }
        liveTabs.set(id, tab)
        opened.push(url)
        return tab
      },
      async update(id, options) {
        focused.push({ id, options })
        const tab = liveTabs.get(id)
        if (tab && options?.url) tab.url = options.url
      },
      async remove(id) { liveTabs.delete(id) },
    },
    windows: {
      async create({ url }) {
        const id = ++nextTabId
        const tab = { id, windowId: id, url }
        liveTabs.set(id, tab)
        opened.push(url)
        return { id, tabs: [tab] }
      },
      async update(id) { focused.push({ windowId: id }) },
    },
  }
  try {
    await background.openAllTasks({ tab: { id: 5, windowId: 1, url: 'https://x.com/home' } }, 'Tuaran')
    assert.equal(opened.length, 0, 'start-all must reuse the panel tab instead of opening new windows')
    assert.equal(local.xrcTaskSchedule.strategyVersion, 4)
    assert.equal(local.xrcTaskSchedule.workTabId, 5)
    assert.equal(Object.values(session.xrcTaskTabs)[0], 5)
    assert.ok(!focused.some((entry) => entry.options?.active || entry.windowId), 'scheduler start must not steal focus')
    const tabs = session.xrcTaskTabs
    const activeMode = local.xrcTaskSchedule.current
    assert.ok(activeMode)
    // Highest default rank is notifications; from /home that may navigate first, then start in-page.
    assert.equal(activeMode, 'notifications')
    assert.ok(
      stopped.some(({ message }) => message.type === 'xrc-task-start' && message.mode === activeMode)
      || focused.some((entry) => /notifications/i.test(String(entry.options?.url || ''))),
    )
    local.xrcPluginRuntime = {
      tasks: Object.fromEntries(Object.entries(tabs).map(([mode, tabId]) => [mode, { tabId, phase: 'running' }])),
      flow: { phase: 'running' },
    }
    await background.pauseAllTasks()
    assert.ok(stopped.some(({ message }) => message.type === 'xrc-flow-stop'))
    assert.equal(local.xrcTaskSchedule.enabled, false)
    assert.equal(local.xrcPluginRuntime.flow.phase, 'paused')
    assert.deepEqual(local.xrcPluginRuntime.tasks, {})
    await background.updatePluginRuntime({ mode: activeMode, active: true, phase: 'running' }, { tab: { id: tabs[activeMode] } })
    assert.equal(local.xrcPluginRuntime.flow.phase, 'paused')
    assert.deepEqual(local.xrcPluginRuntime.tasks, {})
    local.xrcPluginRuntime.flow = { phase: 'paused', updatedAt: Date.now() - 30000 }
    await background.updatePluginRuntime({ mode: activeMode, active: true, phase: 'running' }, { tab: { id: tabs[activeMode] } })
    assert.equal(local.xrcPluginRuntime.flow.phase, 'running')
    assert.equal(local.xrcPluginRuntime.tasks[activeMode].phase, 'running')
    assert.ok(stopped.some(({ id, message }) => id === tabs[activeMode] && message.type === 'xrc-flow-stop'))
  } finally {
    delete globalThis.chrome
  }
})

test('legacy task windows are consolidated only after the other task confirms suspension', async () => {
  // Freeze outside 精品发帖档位 windows so tick keeps the running comment task.
  const now = Date.parse('2026-10-28T03:00:00.000Z')
  const RealDate = Date
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [now])) }
    static now() { return now }
  }
  const session = { xrcTaskTabs: { timeline: 11, notifications: 22 } }
  const local = { xrcPluginRuntime: { tasks: {
    timeline: { tabId: 11, phase: 'running', updatedAt: now },
    notifications: { tabId: 22, phase: 'running', updatedAt: now },
  }, flow: { phase: 'running' } } }
  const live = new Map([[11, { id: 11, windowId: 1, url: 'https://x.com/home' }], [22, { id: 22, windowId: 2, url: 'https://x.com/notifications' }]])
  const order = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value); if (value.xrcTaskSchedule) order.push('saved') } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (!live.has(id)) throw new Error('closed'); return live.get(id) },
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: id === 11 ? 'timeline' : 'notifications', phase: 'running' }
        if (message.type === 'xrc-task-suspend') { order.push('suspended'); return { ok: true } }
        throw new Error('unexpected message')
      },
      async remove(id) { assert.equal(order.at(-1), 'suspended'); live.delete(id); order.push('closed') },
    },
  }
  try {
    await background.openAllTasks(null, 'tuaran')
    assert.deepEqual([...live.keys()], [22])
    assert.equal(local.xrcTaskSchedule.current, 'notifications')
    assert.equal(local.xrcTaskSchedule.workTabId, 22)
    assert.deepEqual(session.xrcTaskTabs, { notifications: 22 })
    assert.ok(local.xrcTaskSchedule.items.timeline.resumeAt >= now)
  } finally {
    globalThis.Date = RealDate
    delete globalThis.chrome
  }
})

test('a legacy task that cannot confirm suspension keeps its window and stops migration', async () => {
  const now = Date.now()
  const session = { xrcTaskTabs: { timeline: 11, notifications: 22 } }
  const local = { xrcPluginRuntime: { tasks: {
    timeline: { tabId: 11, phase: 'running', updatedAt: now },
    notifications: { tabId: 22, phase: 'running', updatedAt: now },
  }, flow: { phase: 'running' } } }
  const removed = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { return { id, windowId: id, url: 'https://x.com/home' } },
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: id === 11 ? 'timeline' : 'notifications', phase: 'running' }
        return { ok: false, error: 'busy' }
      },
      async remove(id) { removed.push(id) },
    },
  }
  try {
    await assert.rejects(background.openAllTasks(null, 'tuaran'), /尚未安全停止/)
    assert.deepEqual(removed, [])
    assert.equal(local.xrcTaskSchedule.enabled, false)
  } finally { delete globalThis.chrome }
})

test('a waiting comment saves its deadline before the shared tab switches tasks', async () => {
  const firstId = 101
  const session = { xrcTaskTabs: { timeline: firstId } }
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, accountHandle: 'tuaran', current: 'timeline',
      workTabId: firstId, startedAt: Date.now(), items: {},
      rules: { 'poster-premium': { enabled: false } },
    },
    xrcPluginRuntime: { flow: { phase: 'running', updatedAt: Date.now() }, tasks: {
      timeline: { tabId: firstId, phase: 'paused', waitUntil: Date.now() + 3600000, detail: 'X 次数限制', updatedAt: Date.now() },
    } },
  }
  const tabs = new Map([[firstId, { id: firstId, windowId: firstId, url: 'https://x.com/home' }]])
  const order = []
  let nextId = 100
  globalThis.chrome = {
    storage: {
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value); if (value.xrcTaskSchedule) order.push('saved') } },
    },
    tabs: {
      async query() { return [] },
      async get(id) { if (!tabs.has(id)) throw new Error('closed'); return tabs.get(id) },
      async sendMessage(id, message) { return message.type === 'xrc-task-suspend' ? { ok: true } : { ok: true, mode: 'timeline', phase: 'paused', waitUntil: Date.now() + 3600000 } },
      async update(id, options) {
        if (options.url) {
          assert.ok(local.xrcTaskSchedule.items.timeline?.resumeAt > Date.now())
          order.push('navigated')
          tabs.set(id, { ...tabs.get(id), url: options.url })
        }
      },
      async remove(id) { order.push('closed'); tabs.delete(id) },
    },
    windows: { async create({ url }) { const id = ++nextId; const tab = { id, windowId: id, url }; tabs.set(id, tab); return { id, tabs: [tab] } } },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(local.xrcTaskSchedule.current, 'notifications')
    assert.ok(local.xrcTaskSchedule.items.timeline.resumeAt > Date.now())
    assert.ok(order.includes('navigated'))
    assert.equal(tabs.has(firstId), true)
    assert.equal(session.xrcTaskTabs.notifications, firstId)
  } finally {
    delete globalThis.chrome
  }
})

test('one confirmed comment keeps the tab until the full run enters its next-cycle wait', async () => {
  const now = Date.parse('2026-10-28T03:00:00.000Z')
  const RealDate = Date
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [now])) }
    static now() { return now }
  }
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'timeline', workTabId: 11, startedAt: now - 5000, sliceSeconds: 30,
      items: {
        timeline: { sliceActions: 0 },
        notifications: { resumeAt: 0 },
        'likes-posts': { manualStopped: true }, 'likes-replies': { manualStopped: true },
        'mutual-unfollow': { manualStopped: true }, 'mutual-followBack': { manualStopped: true },
        poster: { manualStopped: true }, 'poster-premium': { manualStopped: true },
      },
    },
    xrcPluginRuntime: { tasks: { timeline: { tabId: 11, phase: 'running', updatedAt: now } }, flow: { phase: 'running' } },
  }
  const session = { xrcTaskTabs: { timeline: 11 } }
  const suspended = []
  let probePhase = 'running'
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id !== 11) throw new Error('closed'); return { id, windowId: 1, url: 'https://x.com/home' } },
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: 'timeline', phase: probePhase, waitUntil: probePhase === 'paused' ? now + 60000 : 0 }
        if (message.type === 'xrc-task-suspend') { suspended.push(message.reason); return { ok: true } }
        if (message.type === 'xrc-task-start') return { ok: true }
        return { ok: true }
      },
      async update() {},
      async create() { return { id: 12, windowId: 1 } },
    },
    windows: { async update() {}, async create({ url }) { return { id: 2, tabs: [{ id: 12, url }] } } },
    alarms: { async create() {}, async clear() {} },
  }
  try {
    await background.noteScheduledAction({ task: 'timeline-reply', result: 'success' })
    assert.equal(local.xrcTaskSchedule.current, 'timeline')
    assert.deepEqual(suspended, [])
    probePhase = 'paused'
    await background.runTaskSchedule()
    assert.ok(suspended.some((reason) => /本次计划已完成|等待冷却/.test(reason)))
    assert.equal(local.xrcTaskSchedule.current, 'notifications')
    assert.ok(local.xrcTaskSchedule.items.timeline.resumeAt >= now + 60000)
  } finally {
    globalThis.Date = RealDate
    delete globalThis.chrome
  }
})

test('confirming an immediate post start safely preempts a running comment task', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const otherModes = ['notifications', 'likes-posts', 'likes-replies', 'poster-premium', 'mutual-followBack', 'mutual-targetFollow', 'mutual-unfollow']
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'timeline', workTabId: 11, startedAt: now - 1000,
      items: { timeline: {}, poster: { resumeAt: now + 30 * 60000 }, ...Object.fromEntries(otherModes.map((mode) => [mode, { manualStopped: true }])) },
    },
    xrcPluginRuntime: { tasks: { timeline: { tabId: 11, phase: 'running', updatedAt: now } }, flow: { phase: 'running' } },
  }
  const session = { xrcTaskTabs: { timeline: 11 } }
  const tab = { id: 11, windowId: 1, url: 'https://x.com/home' }
  const actions = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { assert.equal(id, 11); return tab },
      async sendMessage(id, message) {
        assert.equal(id, 11)
        actions.push(message.type)
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: 'timeline', phase: 'running' }
        if (message.type === 'xrc-task-suspend') return { ok: true }
        if (message.type === 'xrc-task-start') return { ok: true, phase: 'running' }
        throw new Error(`unexpected ${message.type}`)
      },
      async update(id, options) { assert.equal(id, 11); if (options.url) tab.url = options.url; actions.push('navigate') },
      async create() { throw new Error('must reuse the shared tab') },
    },
    alarms: { async create() {}, async clear() {} },
  }
  try {
    const result = await background.markManualTaskStart('poster')
    assert.equal(result.ok, true)
    assert.equal(result.assigned, true)
    assert.equal(local.xrcTaskSchedule.current, 'poster')
    assert.ok(actions.indexOf('xrc-task-suspend') >= 0)
    assert.ok(actions.includes('navigate') || actions.includes('xrc-task-start'))
    assert.ok(actions.indexOf('xrc-task-suspend') < Math.max(actions.indexOf('navigate'), actions.indexOf('xrc-task-start')))
    assert.equal(local.xrcTaskSchedule.items.poster.manualRequestedAt, 0)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('shared exec tab stores pending launch before navigating to X', async () => {
  const previousChrome = globalThis.chrome
  const session = {}
  const local = { xrcTaskSchedule: { enabled: true, strategyVersion: 4, current: '', workTabId: 0, items: {} } }
  const liveTabs = new Map()
  let nextTabId = 40
  const created = []
  const updates = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: {
        async get(key) { return key in session ? { [key]: session[key] } : {} },
        async set(value) { Object.assign(session, value) },
      },
    },
    tabs: {
      async get(id) { if (!liveTabs.has(id)) throw new Error('missing'); return liveTabs.get(id) },
      async create({ url, active }) {
        const id = ++nextTabId
        const tab = { id, windowId: 1, url, active: Boolean(active) }
        liveTabs.set(id, tab)
        created.push({ id, url })
        return tab
      },
      async update(id, options) {
        updates.push({ id, ...options })
        const tab = liveTabs.get(id)
        if (tab && options.url) tab.url = options.url
      },
      async sendMessage() { return { ok: true, phase: 'running' } },
    },
    windows: { async update() {} },
  }
  try {
    const result = await background.focusTaskTab('timeline', null, { start: true, activate: false })
    assert.equal(created[0]?.url, 'about:blank')
    assert.ok(session[`xrcPendingTab:${result.tabId}`]?.start)
    assert.equal(session[`xrcPendingTab:${result.tabId}`].mode, 'timeline')
    assert.ok(updates.some((entry) => entry.id === result.tabId && /xrcStart=1/.test(entry.url || '')))
    assert.equal(local.xrcTaskSchedule.workTabId, result.tabId)

    local.xrcTaskSchedule.workTabId = 0
    local.xrcTaskSchedule.current = 'notifications'
    const opened = await background.focusTaskTab('notifications', null, { start: false })
    assert.equal(created.at(-1)?.url, 'about:blank')
    assert.equal(local.xrcTaskSchedule.workTabId, opened.tabId)
    assert.ok(updates.some((entry) => entry.id === opened.tabId && entry.active === true))
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('a failed page launch releases the current slot and records a retry', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const modes = ['timeline', 'notifications', 'likes-posts', 'likes-replies', 'mutual-unfollow', 'mutual-followBack', 'poster', 'poster-premium']
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'likes-posts', workTabId: 41, startedAt: now - 3000,
      likeDetectionVersion: 2, replyRiskVersion: 1,
      rules: Object.fromEntries(modes.map((mode) => [mode, { enabled: mode === 'likes-posts' }])),
      items: { 'likes-posts': {} },
    },
    xrcPluginRuntime: { tasks: { 'likes-posts': { tabId: 41, phase: 'starting', updatedAt: now } }, flow: { phase: 'running' } },
  }
  globalThis.chrome = {
    storage: { local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } } },
    tabs: { async get(id) { if (id === 41) return { id, url: 'https://x.com/home' }; throw new Error('missing') }, async remove() {} },
    alarms: { async create() {}, async clear() {} },
  }
  try {
    const result = await background.failScheduledStart('likes-posts', 41, '缺少模型配置')
    assert.equal(result.ok, true)
    assert.equal(local.xrcTaskSchedule.current, '')
    assert.ok(local.xrcTaskSchedule.items['likes-posts'].resumeAt > now)
    assert.match(local.xrcTaskSchedule.items['likes-posts'].reason, /缺少模型配置/)
    assert.equal(local.xrcPluginRuntime.tasks['likes-posts'], undefined)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('background accepts an in-page start only after a running phase is confirmed', async () => {
  const previousChrome = globalThis.chrome
  let phase = 'starting'
  globalThis.chrome = { tabs: { async sendMessage(_id, message) {
    assert.equal(message.type, 'xrc-task-start')
    return { ok: true, phase }
  } } }
  try {
    await assert.rejects(background.tryInPageTaskStart(41, 'likes-posts'), /未获确认/)
    phase = 'running'
    assert.equal((await background.tryInPageTaskStart(41, 'likes-posts')).phase, 'running')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('a brief probe timeout does not close the single shared tab', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const local = {
    xrcTaskSchedule: { enabled: true, strategyVersion: 4, current: 'timeline', workTabId: 11, startedAt: now - 60000, items: {
      notifications: { manualStopped: true },
      'likes-posts': { blocked: true }, 'likes-replies': { blocked: true },
      'mutual-unfollow': { blocked: true }, 'mutual-followBack': { blocked: true }, poster: { blocked: true },
    } },
    xrcPluginRuntime: { tasks: { timeline: { tabId: 11, phase: 'running', updatedAt: now } }, flow: { phase: 'running' } },
  }
  const session = { xrcTaskTabs: { timeline: 11 } }
  const removed = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id !== 11) throw new Error('closed'); return { id, windowId: 1, url: 'https://x.com/home' } },
      async sendMessage() { throw new Error('content unresponsive') },
      async remove(id) { removed.push(id) },
      async update() {},
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(local.xrcTaskSchedule.workTabId, 11)
    assert.equal(removed.length, 0)
    assert.equal(local.xrcTaskSchedule.current, 'timeline')
    assert.equal(local.xrcPluginRuntime.tasks.timeline.phase, 'unknown')
    assert.ok(Number(local.xrcPluginRuntime.tasks.timeline.unknownSince) > 0)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('probe unknownSince is persisted so grace can accumulate across schedule ticks', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'timeline', workTabId: 11, startedAt: now - 40_000,
      items: {
        notifications: { manualStopped: true },
        'likes-posts': { blocked: true }, 'likes-replies': { blocked: true },
        'mutual-unfollow': { blocked: true }, 'mutual-followBack': { blocked: true }, poster: { blocked: true },
      },
    },
    xrcPluginRuntime: { tasks: { timeline: { tabId: 11, phase: 'running', updatedAt: now } }, flow: { phase: 'running' } },
  }
  const session = { xrcTaskTabs: { timeline: 11 } }
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id !== 11) throw new Error('closed'); return { id, windowId: 1, url: 'https://x.com/home' } },
      async sendMessage() { throw new Error('content unresponsive') },
      async update() {},
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    const firstUnknownSince = Number(local.xrcPluginRuntime.tasks.timeline.unknownSince)
    assert.ok(firstUnknownSince > 0)
    assert.equal(local.xrcPluginRuntime.tasks.timeline.phase, 'unknown')
    assert.equal(local.xrcTaskSchedule.current, 'timeline')
    await background.runTaskSchedule()
    assert.equal(Number(local.xrcPluginRuntime.tasks.timeline.unknownSince), firstUnknownSince)
    assert.equal(local.xrcTaskSchedule.current, 'timeline')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('sustained unknown recovers on the same shared tab without closing it', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'notifications', workTabId: 77, startedAt: now - 180000,
      items: {
        notifications: { resumeAt: now - 1, reason: '执行未确认，已保留当前页签并等待安全重试' },
        timeline: { manualStopped: true },
        'likes-posts': { blocked: true }, 'likes-replies': { blocked: true },
        'mutual-unfollow': { blocked: true }, 'mutual-followBack': { blocked: true }, poster: { blocked: true },
      },
    },
    xrcPluginRuntime: {
      tasks: { notifications: { tabId: 77, phase: 'unknown', unknownSince: now - 100000, updatedAt: now - 100000 } },
      flow: { phase: 'running' },
    },
  }
  const session = { xrcTaskTabs: { notifications: 77 } }
  const removed = []
  const starts = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: {
        async get(key) { return key in session ? { [key]: session[key] } : {} },
        async set(value) { Object.assign(session, value) },
      },
    },
    tabs: {
      async get(id) {
        if (id === 77) return { id, windowId: 1, url: 'https://x.com/notifications' }
        throw new Error('missing')
      },
      async remove(id) { removed.push(id) },
      async update() {},
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-start') {
          starts.push(id)
          return { ok: true, phase: 'running' }
        }
        if (message.type === 'xrc-task-state-probe') return null
        return null
      },
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.deepEqual(removed, [])
    assert.equal(local.xrcTaskSchedule.workTabId, 77)
    assert.deepEqual(starts, [77])
    assert.equal(local.xrcTaskSchedule.current, 'notifications')
    assert.equal(local.xrcPluginRuntime.tasks.notifications.phase, 'running')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('a never-started shared tab is reloaded in place after the boot grace', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'timeline', workTabId: 11, startedAt: now - 95_000,
      items: {
        notifications: { manualStopped: true },
        'likes-posts': { blocked: true }, 'likes-replies': { blocked: true },
        'mutual-unfollow': { blocked: true }, 'mutual-followBack': { blocked: true }, poster: { blocked: true },
      },
    },
    xrcPluginRuntime: {
      tasks: { timeline: { tabId: 11, phase: 'starting', updatedAt: now - 95_000 } },
      flow: { phase: 'running' },
    },
  }
  const session = { xrcTaskTabs: { timeline: 11 } }
  const updates = []
  const removed = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id !== 11) throw new Error('closed'); return { id, windowId: 1, url: 'https://x.com/home' } },
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-start') return null
        if (message.type === 'xrc-task-state-probe') return { ok: true, mode: 'timeline', phase: 'starting' }
        return null
      },
      async update(id, update) { updates.push(update) },
      async remove(id) { removed.push(id) },
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.deepEqual(removed, [])
    assert.equal(local.xrcTaskSchedule.workTabId, 11)
    assert.equal(local.xrcTaskSchedule.current, 'timeline')
    assert.ok(session['xrcPendingTab:11']?.start)
    assert.ok(updates.some((entry) => /xrcStart=1/.test(entry.url || '') && entry.active === true))
    assert.match(local.xrcTaskSchedule.items.timeline.reason, /同一页签重新装载/)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('a briefly unresponsive likes task holds the shared tab without reloading', async () => {
  const previousChrome = globalThis.chrome
  const local = {
    xrcTaskSchedule: { enabled: true, strategyVersion: 4, current: 'likes-posts', workTabId: 22, startedAt: Date.now() - 60000, cursor: 1,
      items: { timeline: { manualStopped: true }, notifications: { manualStopped: true } } },
    xrcPluginRuntime: { tasks: { 'likes-posts': { tabId: 22, phase: 'running', updatedAt: Date.now() } }, flow: { phase: 'running' } },
  }
  const session = { xrcTaskTabs: { 'likes-posts': 22 } }
  const updates = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) { if (id !== 22) throw new Error('closed'); return { id, windowId: 2, url: 'https://x.com/home' } },
      async sendMessage() { throw new Error('content unresponsive') },
      async update(id, update) { updates.push(update) },
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.equal(updates.length, 0)
    assert.equal(local.xrcTaskSchedule.current, 'likes-posts')
    assert.equal(local.xrcTaskSchedule.workTabId, 22)
    assert.equal(local.xrcPluginRuntime.tasks['likes-posts'].phase, 'unknown')
    assert.ok(Number(local.xrcPluginRuntime.tasks['likes-posts'].unknownSince) > 0)
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('both comment tasks keep a growing cooldown instead of requiring manual restart', async () => {
  const local = { xrcTaskSchedule: { enabled: true, current: '', cursor: 0, items: {} } }
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get() { return {} } },
    },
    tabs: { async sendMessage() {} },
  }
  try {
    for (const task of ['timeline-reply', 'notification-reply']) {
      const mode = task === 'timeline-reply' ? 'timeline' : 'notifications'
      for (let index = 1; index <= 4; index += 1) {
        const before = Date.now()
        await background.noteScheduledAction({ task, result: 'limited', errorCode: 'risk-blocked' })
        const item = local.xrcTaskSchedule.items[mode]
        assert.equal(item.blocked, false)
        assert.equal(item.limitedStreak, index)
        assert.ok(item.resumeAt >= before + index * 10 * 60000)
        assert.match(item.reason, /自动重试/)
      }
      await background.noteScheduledAction({ task, result: 'success' })
      assert.equal(local.xrcTaskSchedule.items[mode].limitedStreak, 0)
      assert.equal(local.xrcTaskSchedule.items[mode].resumeAt, 0)
    }
  } finally {
    delete globalThis.chrome
  }
})

test('old blocked comment tasks migrate once to saved automatic cooldowns', async () => {
  const local = { xrcTaskSchedule: { enabled: true, current: '', cursor: 0, items: {
    timeline: { blocked: true, limitedStreak: 3, reason: 'risk-blocked' },
    notifications: { blocked: true, limitedStreak: 2, reason: 'risk-blocked' },
  } } }
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: local[key] } },
    async set(value) { Object.assign(local, value) },
  } } }
  try {
    const before = Date.now()
    const plan = await background.readTaskSchedule()
    assert.equal(plan.replyRiskVersion, 1)
    for (const [mode, minutes] of [['timeline', 30], ['notifications', 20]]) {
      assert.equal(plan.items[mode].blocked, false)
      assert.ok(plan.items[mode].resumeAt >= before + minutes * 60000)
    }
    const deadline = plan.items.timeline.resumeAt
    assert.equal((await background.readTaskSchedule()).items.timeline.resumeAt, deadline)
  } finally {
    delete globalThis.chrome
  }
})

test('stopping one task leaves other task tabs and the flow running', async () => {
  const previousChrome = globalThis.chrome
  const session = { xrcTaskTabs: { timeline: 11, poster: 22 } }
  const local = { xrcPluginRuntime: {
    tasks: { timeline: { tabId: 11, phase: 'running' }, poster: { tabId: 22, phase: 'running' } },
    flow: { phase: 'running' },
  } }
  const messages = []
  globalThis.chrome = {
    storage: {
      session: { async get(key) { return { [key]: session[key] } } },
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
    },
    tabs: {
      async get(id) { return { id } },
      async sendMessage(id, message) { messages.push({ id, message }) },
    },
  }
  try {
    const result = await background.stopAllTaskTabs('当前任务受限', { modes: ['timeline'], phase: 'stopped' })
    assert.deepEqual(messages.map(({ id }) => id), [11])
    assert.equal(result.runtime.flow.phase, 'running')
    assert.equal(result.runtime.tasks.timeline, undefined)
    assert.equal(result.runtime.tasks.poster.phase, 'running')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('pending task launch is consumed only by its assigned tab and destination', async () => {
  const sessionData = {}
  globalThis.chrome = {
    storage: {
      session: {
        async get(key) { return { [key]: sessionData[key] } },
        async set(value) { Object.assign(sessionData, value) },
        async remove(key) { delete sessionData[key] },
      },
    },
  }
  try {
    await background.rememberPendingLaunch('notifications', 'https://x.com/notifications', true, 22)
    await background.rememberPendingLaunch('timeline', 'https://x.com/home', true, 11)
    await background.rememberPendingLaunch('mutual-followBack', '/account/followers', true, 33)
    assert.equal(sessionData['xrcPendingTab:33'].path, '/account/followers')
    assert.equal((await background.consumePendingLaunch({ tab: { id: 11, url: 'https://x.com/notifications' } })).launch, null)
    assert.equal(sessionData['xrcPendingTab:11'].mode, 'timeline')
    assert.equal((await background.consumePendingLaunch({ tab: { id: 22, url: 'https://x.com/notifications' } })).launch.mode, 'notifications')
    assert.equal(sessionData['xrcPendingTab:22'], undefined)
    assert.equal((await background.consumePendingLaunch({ tab: { id: 11, url: 'https://x.com/home' } })).launch.mode, 'timeline')
  } finally {
    delete globalThis.chrome
  }
})

test('notifications pending launch survives X redirect to /notifications/mentions', async () => {
  const sessionData = {}
  globalThis.chrome = {
    storage: {
      session: {
        async get(key) { return { [key]: sessionData[key] } },
        async set(value) { Object.assign(sessionData, value) },
        async remove(key) { delete sessionData[key] },
      },
    },
  }
  try {
    assert.equal(background.onTaskPath('notifications', 'https://x.com/notifications/mentions'), true)
    assert.equal(background.onTaskPath('notifications', 'https://x.com/notifications/all'), true)
    assert.equal(background.onTaskPath('notifications', 'https://x.com/home'), false)
    await background.rememberPendingLaunch('notifications', 'https://x.com/notifications?xrcAssistant=notifications&xrcStart=1', true, 44)
    const consumed = await background.consumePendingLaunch({
      tab: { id: 44, url: 'https://x.com/notifications/mentions' },
      url: 'https://x.com/notifications/mentions',
    })
    assert.equal(consumed.launch?.mode, 'notifications')
    assert.equal(consumed.launch?.start, true)
    assert.equal(sessionData['xrcPendingTab:44'], undefined)
  } finally {
    delete globalThis.chrome
  }
})

test('unresponsive notifications on a redirected path restarts in-page instead of waiting forever', async () => {
  const previousChrome = globalThis.chrome
  const now = Date.now()
  const local = {
    xrcTaskSchedule: {
      enabled: true, strategyVersion: 4, current: 'notifications', workTabId: 55, startedAt: now - 95_000,
      items: {
        notifications: { resumeAt: now - 1, reason: '执行未确认，已保留当前页签并等待安全重试' },
        timeline: { manualStopped: true },
        'likes-posts': { blocked: true }, 'likes-replies': { blocked: true },
        'mutual-unfollow': { blocked: true }, 'mutual-followBack': { blocked: true }, poster: { blocked: true },
      },
    },
    xrcPluginRuntime: {
      tasks: { notifications: { tabId: 55, phase: 'starting', updatedAt: now - 95_000 } },
      flow: { phase: 'running' },
    },
  }
  const session = { xrcTaskTabs: { notifications: 55 } }
  const starts = []
  const updates = []
  globalThis.chrome = {
    storage: {
      local: { async get(key) { return { [key]: local[key] } }, async set(value) { Object.assign(local, value) } },
      session: { async get(key) { return { [key]: session[key] } }, async set(value) { Object.assign(session, value) } },
    },
    tabs: {
      async get(id) {
        if (id !== 55) throw new Error('closed')
        return { id, windowId: 1, url: 'https://x.com/notifications/mentions' }
      },
      async sendMessage(id, message) {
        if (message.type === 'xrc-task-start') {
          starts.push({ id, mode: message.mode })
          return { ok: true, phase: 'running' }
        }
        return null
      },
      async update(id, update) { updates.push({ id, update }) },
    },
    windows: { async update() {} },
  }
  try {
    await background.runTaskSchedule()
    assert.deepEqual(starts, [{ id: 55, mode: 'notifications' }])
    assert.equal(updates.some((entry) => /xrcStart=1|\/notifications\?/.test(entry.update?.url || '')), false)
    assert.equal(local.xrcTaskSchedule.current, 'notifications')
    assert.equal(local.xrcTaskSchedule.items.notifications.resumeAt, 0)
    assert.equal(local.xrcTaskSchedule.items.notifications.reason, '')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('remote start resumes an idle comment task in its existing window and reports a blocked start', async () => {
  const previousChrome = globalThis.chrome
  let runtime = { tasks: {}, flow: { phase: 'running' } }
  let reply = { ok: true, phase: 'running' }
  const updates = []
  globalThis.chrome = {
    storage: {
      session: { async get() { return { xrcTaskTabs: { timeline: 11 } } }, async set() {} },
      local: { async get() { return { xrcPluginRuntime: runtime } }, async set(value) { runtime = value.xrcPluginRuntime } },
    },
    tabs: {
      async get() { return { id: 11, windowId: 5, url: 'https://x.com/home' } },
      async sendMessage(id, message) { assert.equal(id, 11); assert.equal(message.type, 'xrc-task-start'); return reply },
      async update(id, options) { updates.push(options) },
    },
    windows: { async update() {} },
  }
  try {
    const started = await background.focusTaskTab('timeline', null, { start: true })
    assert.equal(started.started, true)
    assert.deepEqual(updates, [{ active: true }])
    reply = { ok: false, error: '缺少回复模型密钥' }
    await assert.rejects(background.focusTaskTab('timeline', null, { start: true }), /缺少回复模型密钥/)
    assert.deepEqual(updates, [{ active: true }], 'blocked starts must not navigate or open another window')
  } finally {
    globalThis.chrome = previousChrome
  }
})

test('writes the phrase into Draft state and keeps Reply disabled until that write', () => {
  const draft = require('../../tools/x-reply-clipboard-extension/draftFill.js')
  assert.equal(draft.visibleDraftText({ textContent: '  学习了\u200b  ' }), '学习了')
  assert.equal(draft.visibleDraftText({ textContent: 'Post your reply' }), '')
  assert.equal(draft.comparableDraftText({ innerText: '第一行\n\n\n第二行' }, 'post'), '第一行\n\n第二行')
  assert.equal(draft.isRecoverableDuplicateOrPlaceholderMix('稳稳', '稳'), true)
  assert.equal(draft.isRecoverableDuplicateOrPlaceholderMix('稳st your reply', '稳'), true)

  function Style() {}
  Style.prototype.clear = function clear() { return new Style() }

  function Character(style, entity) {
    this.style = style || new Style()
    this.entity = entity === undefined ? null : entity
  }
  Character.prototype.getStyle = function getStyle() { return this.style }
  Character.prototype.set = function set(key, value) {
    const next = new Character(this.style, this.entity)
    if (key === 'style') next.style = value
    if (key === 'entity') next.entity = value
    return next
  }

  function CharacterList(items) {
    if (!(this instanceof CharacterList)) return new CharacterList(items)
    this.items = items || []
    this.size = this.items.length
  }
  CharacterList.prototype.get = function get(index) { return this.items[index] }
  CharacterList.prototype.first = function first() { return this.items[0] }
  CharacterList.prototype.push = function push(item) { return new CharacterList([...this.items, item]) }

  function Block(props) {
    Object.assign(this, props)
  }
  Block.prototype.getText = function getText() { return this.text || '' }
  Block.prototype.getCharacterList = function getCharacterList() { return this.characterList }
  Block.prototype.merge = function merge(props) { return Object.assign(new Block(this), props) }

  function BlockMap(entries) {
    if (!(this instanceof BlockMap)) return new BlockMap(entries)
    this.entries = entries || []
  }
  BlockMap.prototype.set = function set(key, value) {
    return new BlockMap([...this.entries.filter((entry) => entry[0] !== key), [key, value]])
  }
  BlockMap.prototype.forEach = function forEach(fn) {
    this.entries.forEach((entry) => fn(entry[1], entry[0]))
  }

  function Content(blockMap) {
    this.blockMap = blockMap
  }
  Content.prototype.getBlockMap = function getBlockMap() { return this.blockMap }
  Content.prototype.set = function set(key, value) {
    const next = new Content(key === 'blockMap' ? value : this.blockMap)
    next[key] = value
    return next
  }

  function SelectionState() {}
  SelectionState.createEmpty = function createEmpty() { return new SelectionState() }

  function EditorState(content) {
    this.content = content
  }
  EditorState.prototype.getCurrentContent = function getCurrentContent() { return this.content }
  EditorState.prototype.getSelection = function getSelection() { return { constructor: SelectionState } }
  EditorState.push = function push(_editorState, content) { return new EditorState(content) }
  EditorState.moveSelectionToEnd = function moveSelectionToEnd(state) { return state }

  const phrase = '学习了'
  let editorState = new EditorState(new Content(new BlockMap([
    ['empty', new Block({ text: '', characterList: new CharacterList([new Character()]) })],
  ])))
  let replyEnabled = false
  const node = {
    props: {
      get editorState() { return editorState },
      onChange(next) {
        editorState = next
        replyEnabled = draft.readDraftText(node) === phrase
      },
    },
  }

  assert.equal(replyEnabled, false)
  draft.writeReplyDraft(node, phrase)
  assert.equal(draft.readDraftText(node), phrase)
  assert.equal(replyEnabled, true)

  const multiline = '第一行\n\n第二行'
  draft.writeReplyDraft(node, multiline)
  assert.equal(draft.readDraftText(node), multiline)
  assert.deepEqual(editorState.content.blockMap.entries.map((entry) => entry[1].text), ['第一行', '', '第二行'])

  const mentionReply = '粉丝破万挺快的。@grok 开通后按什么标准结算？'
  draft.writeReplyDraft(node, mentionReply)
  assert.equal(draft.readDraftText(node), mentionReply)
  assert.equal((draft.readDraftText(node).match(/@grok/gu) || []).length, 1)

  const seen = []
  let index = 0
  for (let step = 0; step < 8; step += 1) {
    seen.push(require('../../tools/x-reply-clipboard-extension/phrases.js')[index])
    index = loop.nextPhraseIndex(55, index, () => 0)
  }
  assert.equal(seen[0], require('../../tools/x-reply-clipboard-extension/phrases.js')[0])
  assert.notEqual(seen[1], seen[0])
  for (let step = 1; step < seen.length; step += 1) assert.notEqual(seen[step], seen[step - 1])
})

function matchSelector(node, selector) {
  return selector.split(',').some((part) => {
    const text = part.trim()
    if (!text) return false
    if (text.startsWith('#')) return node.id === text.slice(1)
    const tagMatch = text.match(/^([a-zA-Z][\w-]*)/)
    let rest = text
    if (tagMatch && !text.startsWith('[')) {
      if (node.tag !== tagMatch[1]) return false
      rest = text.slice(tagMatch[1].length)
    }
    const attrs = [...rest.matchAll(/\[([^\]=]+)(?:=(['"])(.*?)\2)?\]/g)]
    if (rest.trim() && attrs.length === 0) return false
    return attrs.every((match) => (match[3] == null ? node.getAttribute(match[1]) != null : node.getAttribute(match[1]) === match[3]))
  })
}

function mountTree(spec, parent = null) {
  const node = {
    tag: spec.tag,
    attrs: spec.attrs || {},
    parentElement: parent,
    nodeType: 1,
    id: spec.attrs?.id || '',
    children: [],
  }
  node.getAttribute = (name) => node.attrs[name] ?? null
  node.matches = (selector) => matchSelector(node, selector)
  node.querySelector = (selector) => {
    for (const child of node.children) {
      if (child.matches(selector)) return child
      const found = child.querySelector(selector)
      if (found) return found
    }
    return null
  }
  node.querySelectorAll = (selector) => node.children.flatMap((child) => [
    ...(child.matches(selector) ? [child] : []),
    ...child.querySelectorAll(selector),
  ])
  node.closest = (selector) => {
    let current = node
    while (current) {
      if (current.matches?.(selector)) return current
      current = current.parentElement
    }
    return null
  }
  node.children = (spec.children || []).map((child) => mountTree(child, node))
  return node
}

function loadSidebarMountPoint(source) {
  const start = source.indexOf('const SIDEBAR_MODULE_SELECTOR')
  const end = source.indexOf('function dockPanel(')
  return new Function(`${source.slice(start, end)}\nreturn sidebarMountPoint;`)()
}

test('panel mounts under the search box inside the right sidebar', async () => {
  const source = await readFile(new URL('content.js', extensionDir), 'utf8')
  const css = await readFile(new URL('content.css', extensionDir), 'utf8')
  const sidebarMountPoint = loadSidebarMountPoint(source)
  assert.match(source, /function sidebarMountPoint/)
  assert.match(source, /function dockPanel/)
  assert.match(source, /SearchBox_Search_Input/)
  assert.match(source, /xrcDock/)
  assert.match(css, /#x-reply-clipboard-panel\[data-xrc-dock="pending"\]/)
  assert.match(css, /#x-reply-clipboard-panel\[data-xrc-dock="float"\]/)
  assert.match(css, /position:\s*fixed/)
  assert.match(css, /right:\s*18px/)
  assert.match(css, /bottom:\s*18px/)
  assert.match(source, /function floatPanel/)
  assert.match(source, /state\.panelPlacement === "embed"/)

  const sidebar = mountTree({
    tag: 'div',
    attrs: { 'data-testid': 'sidebarColumn' },
    children: [{
      tag: 'div',
      attrs: { id: 'column' },
      children: [
        {
          tag: 'div',
          attrs: { id: 'search-block' },
          children: [{
            tag: 'form',
            attrs: { role: 'search', 'aria-label': 'Search' },
            children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
          }],
        },
        { tag: 'div', attrs: { id: 'hidden' } },
        {
          tag: 'div',
          attrs: { id: 'modules' },
          children: [
            { tag: 'aside', attrs: { role: 'complementary', 'aria-label': 'Upgrade to Premium+' } },
            { tag: 'div', attrs: { 'data-testid': 'trend' } },
            { tag: 'nav', attrs: { role: 'navigation', 'aria-label': 'Footer' } },
          ],
        },
      ],
    }],
  })
  const mounted = sidebarMountPoint(sidebar)
  assert.equal(mounted.type, 'prepend')
  assert.equal(mounted.parent.id, 'modules')

  const flat = mountTree({
    tag: 'div',
    attrs: { 'data-testid': 'sidebarColumn' },
    children: [
      {
        tag: 'div',
        attrs: { id: 'search-block' },
        children: [{
          tag: 'form',
          attrs: { role: 'search' },
          children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
        }],
      },
      { tag: 'aside', attrs: { role: 'complementary', 'aria-label': 'Who to follow' } },
    ],
  })
  const flatMount = sidebarMountPoint(flat)
  assert.equal(flatMount.type, 'after')
  assert.equal(flatMount.anchor.id, 'search-block')

  const page = mountTree({
    tag: 'div',
    children: [
      { tag: 'nav', attrs: { role: 'navigation', 'aria-label': 'Primary' } },
      {
        tag: 'div',
        attrs: { 'data-testid': 'primaryColumn' },
        children: [{
          tag: 'form',
          attrs: { role: 'search' },
          children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
        }],
      },
      sidebar,
    ],
  })
  assert.equal(sidebarMountPoint(page).parent.id, 'modules')
  assert.equal(sidebarMountPoint(mountTree({
    tag: 'div',
    children: [{
      tag: 'form',
      attrs: { role: 'search' },
      children: [{ tag: 'input', attrs: { 'data-testid': 'SearchBox_Search_Input' } }],
    }],
  })), null)
})

test('main-world writer replaces the whole editor and supersedes an earlier listener', async () => {
  const source = await readFile(new URL('draftFill.js', extensionDir), 'utf8')
  assert.match(source, /x-reply-clipboard-draft-v2/)
  assert.match(source, /HANDLER_KEY/)
  assert.match(source, /removeEventListener\("message", previousHandler\)/)
  assert.match(source, /range\.selectNodeContents\(editor\)/)
  assert.match(source, /command-replace/)
  assert.doesNotMatch(source, /execCommand\("selectAll"/)
})
