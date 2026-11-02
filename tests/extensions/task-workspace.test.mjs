import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
const source = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')

test('plugin confirmation waits for a choice, rejects concurrent requests, and restores focus', async () => {
  const definition = source.match(/  function pluginConfirm\(message, title = "确认操作"\) \{[\s\S]*?\n  \}/)[0]
  let overlay, restored = 0
  const previous = { focus: () => restored++ }
  const document = {
    activeElement: previous,
    getElementById: () => ({ append: node => { overlay = node } }),
    createElement: () => {
      const nodes = Object.fromEntries(['strong', 'p', '[data-cancel]', '[data-ok]'].map(key => [key, { focus() { document.activeElement = this } }]))
      return { querySelector: key => nodes[key], addEventListener(key, callback) { this[key] = callback }, remove() { this.removed = true } }
    },
  }
  const context = vm.createContext({ document, PANEL_ID: 'panel' })
  vm.runInContext(`let pluginConfirmPending = false; ${definition}; globalThis.confirm = pluginConfirm`, context)
  const pending = context.confirm('Details', 'Title')
  assert.equal(overlay.querySelector('p').textContent, 'Details')
  assert.equal(overlay.querySelector('strong').textContent, 'Title')
  assert.equal(await context.confirm('Duplicate'), false)
  overlay.querySelector('[data-cancel]').onclick()
  assert.equal(await pending, false)
  assert.equal(restored, 1)
  const next = context.confirm('Again')
  overlay.querySelector('[data-ok]').onclick()
  assert.equal(await next, true)
  const escape = context.confirm('Escape')
  overlay.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} })
  assert.equal(await escape, false)
})

test('task participation persists only enabled flag and preserves pace, priority and cooldown', async () => {
  const definition = source.match(/      const setParticipation = async \(mode, enabled\) => \{[\s\S]*?\n      \};/)[0]
  const plan = { rules: { timeline: { enabled: false, pace: 'slow', priority: 7 } }, items: { timeline: { resumeAt: 12345 } }, sliceSeconds: 30 }
  let writes = 0, fail = false, occupant = '', feedback = ''
  const context = vm.createContext({
    taskSchedule: plan, FLOW_TASKS: [['timeline', 'Comment']], TASK_MODE_LABELS: {},
    liveScheduleOccupant: () => occupant,
    ensureScheduleRuleDefaults: (mode, rule) => ({ ...rule }),
    renderPanel() {}, feedback: value => { feedback = value },
    sendExtensionMessage: async message => { writes++; if (fail) throw Error('Failed'); return { rules: message.rules } },
  })
  vm.runInContext(`let participationSaving = false; ${definition}; globalThis.set = setParticipation`, context)
  await context.set('timeline', true)
  assert.equal(context.taskSchedule.rules.timeline.enabled, true)
  assert.equal(context.taskSchedule.rules.timeline.pace, 'slow')
  assert.equal(context.taskSchedule.rules.timeline.priority, 7)
  assert.equal(context.taskSchedule.items.timeline.resumeAt, 12345)
  occupant = 'timeline'
  await context.set('timeline', false)
  assert.equal(writes, 1)
  occupant = ''; fail = true
  await context.set('timeline', false)
  assert.equal(context.taskSchedule.rules.timeline.enabled, true)
  assert.equal(feedback, 'Failed')
  await context.set('unknown', false)
  assert.equal(writes, 2)
})

test('library excludes selected and current tasks', () => {
  const expression = source.match(/card.hidden = (Boolean\([\s\S]*?\));/)[1]
  const context = vm.createContext({
    enabled: false, task: { mode: 'timeline', label: 'Comment' }, nowMode: '',
  })
  const hidden = () => vm.runInContext(expression, context)
  assert.equal(hidden(), false)
  context.enabled = true
  assert.equal(hidden(), true)
  context.enabled = false
  context.nowMode = 'timeline'
  assert.equal(hidden(), true)
  context.nowMode = ''
  assert.equal(hidden(), false)
})

test('draft tools appear only on draft tasks and clear when switching to premium or text posts', () => {
  const definition = source.match(/  function syncDebugDraftTools\(panel, mode\) \{[\s\S]*?\n  \}/)[0]
  const tools = { hidden: true }
  const context = vm.createContext({ panel: { querySelector: () => tools } })
  vm.runInContext(`${definition}; globalThis.sync = syncDebugDraftTools`, context)
  for (const mode of ['poster-x', 'poster-premium', 'poster-xhs', 'poster', 'article']) {
    context.sync(context.panel, mode)
    assert.equal(tools.hidden, !['poster-x', 'poster-xhs'].includes(mode), mode)
  }
})

test('library toggle collapses and locks by default and expands without changing task settings', () => {
  const definition = source.match(/  function syncTaskLibrary\(panel, open\) \{[\s\S]*?\n  \}/)[0]
  const library = {}, feedback = {}, toggle = { setAttribute(key, value) { this[key] = value } }
  const panel = { dataset: {}, querySelector: selector => ({ '.xrc-library-column': library, '[data-xrc-library-toggle]': toggle, '[data-xrc-workspace-feedback]': feedback })[selector] }
  const context = vm.createContext({})
  vm.runInContext(`${definition}; globalThis.sync = syncTaskLibrary`, context)
  assert.match(source, /let taskLibraryOpen = false;/)
  context.sync(panel, false)
  assert.equal(panel.dataset.taskLibrary, 'closed')
  assert.equal(library.hidden, true)
  assert.equal(toggle['aria-expanded'], 'false')
  assert.equal(toggle.textContent, '增减任务')
  context.sync(panel, true)
  assert.equal(panel.dataset.taskLibrary, 'open')
  assert.equal(library.hidden, false)
  assert.equal(toggle['aria-expanded'], 'true')
  assert.equal(feedback.hidden, false)
  context.sync(panel, false)
  assert.equal(library.hidden, true)
  assert.equal(feedback.hidden, true)
})
