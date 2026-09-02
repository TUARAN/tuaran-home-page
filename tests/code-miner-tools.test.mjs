import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  CODE_MINER_TOOLS,
  formatJson,
  getJsonDepth,
  normalizeCodeMinerTool,
} from '../lib/codeMinerTools.mjs'

const toolItemsSource = await readFile(new URL('../lib/toolItems.js', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../app/api/tools/gifs/route.js', import.meta.url), 'utf8')

test('all migrated tools have stable unique ids', () => {
  assert.equal(CODE_MINER_TOOLS.length, 6)
  assert.equal(new Set(CODE_MINER_TOOLS.map((tool) => tool.id)).size, 6)
  assert.equal(normalizeCodeMinerTool('json'), 'json')
  assert.equal(normalizeCodeMinerTool('missing'), 'gif')
})

test('JSON helpers format values and calculate nested depth', () => {
  const source = '{"root":{"items":[{"ok":true}]}}'
  assert.match(formatJson(source), /\n  "root"/)
  assert.equal(formatJson(source, true), source)
  assert.equal(getJsonDepth(JSON.parse(source)), 4)
})

test('tool directory exposes the six migrated tools as internal entries', () => {
  for (const id of ['gif-search', 'image-compressor', 'qr-generator', 'json-formatter', 'base64-converter', 'decision-dice']) {
    assert.match(toolItemsSource, new RegExp(`id: '${id}'[\\s\\S]*href: '/tools/code-miner#`))
  }
  assert.doesNotMatch(toolItemsSource, /id: 'toolkit-hub'[\s\S]*https:\/\/toolkit-hub\.pages\.dev/)
})

test('GIF proxy keeps the Tenor key on the server side', () => {
  assert.match(apiSource, /env\?\.TENOR_API_KEY/)
  assert.doesNotMatch(apiSource, /AIza[0-9A-Za-z_-]+/)
})
