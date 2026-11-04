import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('a new install starts with no reply provider selected and uses a general setup prompt', async () => {
  const content = await readFile(new URL('../../tools/x-reply-clipboard-extension/content.js', import.meta.url), 'utf8')
  assert.match(content, /const DEFAULT_REPLY_PROVIDERS = \[\]/)
  assert.match(content, /replyProviders: \[\]/)
  for (const provider of ['mobileoffice', 'deepseek', 'nas', 'bai']) {
    const input = content.match(new RegExp(`<input[^>]*data-xrc-reply-provider="${provider}"[^>]*>`))?.[0]
    assert.ok(input, `missing ${provider} checkbox`)
    assert.doesNotMatch(input, /\bchecked\b/)
  }
  assert.match(content, /尚未启用回复模型 · 点击前往模型设置/)
  assert.doesNotMatch(content, /尚未配置 DeepSeek API Key · 点击前往模型设置/)
})
