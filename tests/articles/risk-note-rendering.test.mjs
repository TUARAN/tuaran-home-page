import assert from 'node:assert/strict'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'

test('risk and compliance tips collapse into a one-line details summary', () => {
  const html = renderMarkdown(
    '> **风险与合规提示：** 资料用于识别账本，不构成投资建议。迷因币价格可以归零。',
  )

  assert.match(html, /<details class="research-risk-note">/)
  assert.match(html, /<span class="research-risk-note__label">风险与合规提示<\/span>/)
  assert.match(html, /research-risk-note__more">展开/)
  assert.match(html, /research-risk-note__less">收起/)
  assert.match(html, /research-risk-note__body"><p>资料用于识别账本，不构成投资建议。/)
  assert.doesNotMatch(html, /research-risk-note__body">[\s\S]*?风险与合规提示/)
  assert.doesNotMatch(html, /<blockquote>/)
})

test('shorter risk and compliance labels also collapse', () => {
  const risk = renderMarkdown('> **风险提示：** Robinhood Chain 上的加密资产可能造成全部本金损失。')
  const compliance = renderMarkdown('> **合规提示：** 境内代币发行融资属于非法金融活动。')

  assert.match(risk, /research-risk-note__label">风险提示<\/span>/)
  assert.match(risk, /research-risk-note__body"><p>Robinhood Chain 上的加密资产可能造成全部本金损失。/)
  assert.match(compliance, /research-risk-note__label">合规提示<\/span>/)
  assert.match(compliance, /research-risk-note__body"><p>境内代币发行融资属于非法金融活动。/)
})

test('ordinary quotes stay as blockquotes', () => {
  const html = renderMarkdown('> **写在前面**：这不是医疗建议。')

  assert.match(html, /<blockquote>/)
  assert.doesNotMatch(html, /research-risk-note/)
})
