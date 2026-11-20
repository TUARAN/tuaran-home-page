import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const planner = require('../../tools/x-reply-clipboard-extension/agentPlanner.js')
const extensionDir = new URL('../../tools/x-reply-clipboard-extension/', import.meta.url)

function tools(log = []) {
  return {
    'facts.today': { kind: 'read', describe: '今日数据', run: async () => { log.push('facts.today'); return { comments: { count: 12, cap: 1000 } } } },
    'alerts.recent': { kind: 'read', describe: '报警', run: async () => { throw new Error('读不到报警') } },
    'schedule.pauseAll': { kind: 'write', label: '暂停全部', describe: '暂停', run: async () => { log.push('PAUSED') } },
  }
}

function scripted(replies) {
  const seen = []
  return {
    seen,
    callModel: async (system, user) => {
      seen.push({ system, user })
      const next = replies.shift()
      return typeof next === 'string' ? { ok: true, provider: 'deepseek', text: next } : next
    },
  }
}

test('readStep accepts exactly the three step shapes', () => {
  assert.deepEqual(planner.readStep('好的 {"tool":"facts.today","args":{}}'), { kind: 'tool', tool: 'facts.today', args: {} })
  assert.equal(planner.readStep('{"answer":"今天评论 12 条"}').kind, 'answer')
  assert.deepEqual(planner.readStep('{"propose":"schedule.pauseAll","why":"报警太多"}'), { kind: 'propose', tool: 'schedule.pauseAll', why: '报警太多' })
  assert.equal(planner.readStep('{"tool":"x","args":[1]}').args.constructor, Object)
  assert.equal(planner.readStep('没有 JSON'), null)
  assert.equal(planner.readStep('{"foo":1}'), null)
})

test('plan → read tool → replan → answer, with facts fed back to the model', async () => {
  const log = []
  const model = scripted(['{"tool":"facts.today","args":{}}', '{"answer":"今天评论 12 条，上限 1000。"}'])
  const turn = await planner.runHarnessTurn({ text: '今天做了多少', tools: tools(log), callModel: model.callModel })
  assert.equal(turn.protocol, planner.HARNESS_PROTOCOL)
  assert.equal(turn.ok, true)
  assert.equal(turn.stopReason, 'answer')
  assert.equal(turn.provider, 'deepseek')
  assert.deepEqual(log, ['facts.today'])
  assert.equal(turn.steps.length, 1)
  assert.match(model.seen[1].user, /facts\.today → .*"count":12/)
  assert.match(model.seen[0].system, /不要使用评论风格/)
  assert.match(model.seen[0].system, /schedule\.pauseAll（需确认）/)
})

test('a failed tool is reported back instead of ending the turn', async () => {
  const model = scripted(['{"tool":"alerts.recent"}', '{"tool":"nope"}', '{"answer":"报警没读到。"}'])
  const turn = await planner.runHarnessTurn({ text: '有报警吗', tools: tools(), callModel: model.callModel })
  assert.equal(turn.stopReason, 'answer')
  assert.deepEqual(turn.steps.map((step) => step.result.ok), [false, false])
  assert.match(model.seen[1].user, /失败：读不到报警/)
  assert.match(model.seen[2].user, /nope → 失败：没有这个工具/)
})

test('write tools never run from model output: propose and direct calls both become pending', async () => {
  const log = []
  const proposed = await planner.runHarnessTurn({ text: '停一下', tools: tools(log), callModel: scripted(['{"propose":"schedule.pauseAll","why":"报警连续出现"}']).callModel })
  assert.equal(proposed.stopReason, 'confirm')
  assert.equal(proposed.ok, true)
  assert.deepEqual(proposed.pending, [{ tool: 'schedule.pauseAll', label: '暂停全部', why: '报警连续出现' }])
  const direct = await planner.runHarnessTurn({ text: '停一下', tools: tools(log), callModel: scripted(['{"tool":"schedule.pauseAll"}']).callModel })
  assert.equal(direct.stopReason, 'confirm')
  assert.equal(direct.pending[0].tool, 'schedule.pauseAll')
  assert.deepEqual(log, [])
  const bogus = await planner.runHarnessTurn({ text: '调高上限', tools: tools(log), callModel: scripted(['{"propose":"facts.today"}']).callModel })
  assert.equal(bogus.ok, false)
  assert.equal(bogus.fallback, 'status-buttons')
})

test('planner failure, bad JSON, timeout and step budget all fall back to status buttons', async () => {
  const down = await planner.runHarnessTurn({ text: 'x', tools: tools(), callModel: async () => ({ ok: false, error: '全部失败' }) })
  assert.deepEqual([down.stopReason, down.fallback, down.error], ['planner-failed', 'status-buttons', '全部失败'])
  const thrown = await planner.runHarnessTurn({ text: 'x', tools: tools(), callModel: async () => { throw new Error('网络断了') } })
  assert.equal(thrown.stopReason, 'planner-failed')
  const prose = await planner.runHarnessTurn({ text: 'x', tools: tools(), callModel: scripted(['我觉得挺好']).callModel })
  assert.match(prose.error, /不是约定的 JSON/)

  let t = 0
  const slow = await planner.runHarnessTurn({
    text: 'x', tools: tools(), limits: { turnMs: 1000 }, clock: () => t,
    callModel: async () => { t += 2000; return { ok: true, text: '{"tool":"facts.today"}' } },
  })
  assert.equal(slow.stopReason, 'timeout')
  assert.equal(slow.steps.length, 1)

  const hang = await planner.runHarnessTurn({ text: 'x', tools: tools(), limits: { turnMs: 1000 }, callModel: () => new Promise(() => {}) })
  assert.equal(hang.stopReason, 'planner-failed')
  assert.match(hang.error, /超时/)

  const loop = await planner.runHarnessTurn({ text: 'x', tools: tools(), callModel: async () => ({ ok: true, text: '{"tool":"facts.today"}' }) })
  assert.equal(loop.stopReason, 'max-steps')
  assert.equal(loop.steps.length, planner.HARNESS_LIMITS.maxSteps)
})

test('chat turns a harness proposal into a confirm button and a failure into status plus buttons', async () => {
  globalThis.document = { createElement: () => ({}) }
  const chat = require('../../tools/x-reply-clipboard-extension/agentChat.js')
  const base = {
    accountHandle: () => 'tuaran',
    labels: () => ({ timeline: '评论首页' }),
    snapshot: () => ({ ok: false }),
    async readRuntime() {
      return { ok: true, runtime: { tasks: { timeline: { phase: 'running', detail: '第 1 轮' } } }, schedule: { enabled: true, current: 'timeline', queue: ['timeline'] } }
    },
  }
  const contexts = []
  const ok = await chat.handleTurn('报警这么多要不要停', {
    ...base,
    async harness(context) {
      contexts.push(context)
      return { ok: true, stopReason: 'confirm', answer: '最近报警 6 次，建议先暂停。', steps: [{ call: { tool: 'alerts.recent' }, result: { ok: true } }], pending: [{ tool: 'schedule.pauseAll', label: '暂停全部' }] }
    },
  })
  assert.equal(contexts[0].text, '报警这么多要不要停')
  assert.equal(ok.protocol, 'xrc-agent-turn/v2')
  assert.match(ok.text, /建议先暂停/)
  assert.deepEqual(ok.confirm, ['暂停全部'])
  assert.ok(ok.steps.length >= 1)

  const failed = await chat.handleTurn('帮我换一批人', { ...base, async harness() { return { ok: false, fallback: 'status-buttons', error: '规划模型没有返回' } } })
  assert.equal(failed.showActions, true)
  assert.match(failed.text, /规划没有完成/)
  assert.match(failed.text, /评论首页/)
  assert.deepEqual(failed.confirm, [])
})

test('the service worker exposes harness and run facts only to its own extension', async () => {
  const background = await readFile(new URL('background.js', extensionDir), 'utf8')
  const content = await readFile(new URL('content.js', extensionDir), 'utf8')
  assert.match(background, /message\?\.type === "xrc-agent-harness"[\s\S]{0,80}fromOwnExtension\(sender\)/)
  assert.match(background, /message\?\.type === "xrc-run-facts"[\s\S]{0,80}fromOwnExtension\(sender\)/)
  assert.doesNotMatch(background, /"xrc-agent-plan"/)
  assert.match(background, /"schedule\.pauseAll": \{ kind: "write"/)
  assert.doesNotMatch(background, /"schedule\.pauseAll": \{[^}]*run:/)
  assert.match(content, /type: "xrc-agent-harness"/)
  assert.match(content, /protocol: "xrc-agent-turn\/v2"/)
  const manifest = JSON.parse(await readFile(new URL('manifest.json', extensionDir), 'utf8'))
  assert.equal(manifest.host_permissions.includes('https://*/*'), false)
})

test('run facts group 24-hour alerts and expose today counts without page text', async () => {
  const now = Date.parse('2026-11-20T10:00:00+08:00')
  const data = {
    xrcExecutionAlertsV1: [
      { occurredAt: now - 1000, task: 'timeline', kind: 'start-failed', message: '执行页没有回报', count: 2 },
      { occurredAt: now - 25 * 60 * 60 * 1000, task: 'timeline', kind: 'old', message: '昨天的' },
    ],
  }
  const previous = globalThis.chrome
  globalThis.chrome = { runtime: { id: 'me' }, storage: { local: {
    async get(key) { if (typeof key === 'string') return { [key]: data[key] }; if (Array.isArray(key)) return Object.fromEntries(key.map((k) => [k, data[k]])); return { ...data } },
    async set(values) { Object.assign(data, values) },
  } } }
  try {
    const background = require('../../tools/x-reply-clipboard-extension/background.js')
    const facts = await background.readRunFacts(now)
    assert.equal(facts.alerts.total, 2)
    assert.deepEqual(facts.alerts.kinds, { 'start-failed': 2 })
    assert.equal(facts.alerts.latest[0].task, '评论首页')
    assert.equal(facts.today.follows.target, 300)
    assert.ok(Array.isArray(facts.engine))
    const tools = background.agentHarnessTools()
    assert.deepEqual(Object.entries(tools).filter(([, tool]) => tool.kind === 'write').map(([name]) => name), ['schedule.pauseAll', 'schedule.startAll'])
    assert.equal(Object.values(tools).filter((tool) => tool.kind === 'write').some((tool) => 'run' in tool), false)
  } finally {
    if (previous) globalThis.chrome = previous
    else delete globalThis.chrome
  }
})
