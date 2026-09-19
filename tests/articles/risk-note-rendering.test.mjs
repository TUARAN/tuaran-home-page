import assert from 'node:assert/strict'
import test from 'node:test'

import { COLLAPSIBLE_NOTE_LABEL_RE, renderMarkdown } from '../../lib/research/markdown.js'

test('risk and compliance tips collapse into a one-line details summary', () => {
  const html = renderMarkdown(
    '> **风险与合规提示：** 资料用于识别账本，不构成投资建议。迷因币价格可以归零。',
  )

  assert.match(html, /<details class="research-risk-note research-risk-note--end" data-research-note-placement="end">/)
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

test('scope notes collapse into the same one-line details summary', () => {
  const html = renderMarkdown(
    '> 适用范围：讨论的是健康成人在公开、被评价、结果不完全可控时的急性应激与表达表现。不构成医疗建议。',
  )

  assert.match(html, /<details class="research-risk-note research-risk-note--end" data-research-note-placement="end">/)
  assert.match(html, /<span class="research-risk-note__label">适用范围<\/span>/)
  assert.match(html, /research-risk-note__more">展开/)
  assert.match(html, /research-risk-note__body"><p>讨论的是健康成人在公开、被评价、结果不完全可控时的急性应激与表达表现。/)
  assert.doesNotMatch(html, /research-risk-note__body">[\s\S]*?适用范围/)
  assert.doesNotMatch(html, /<blockquote>/)
})

test('ordinary quotes stay as blockquotes', () => {
  const html = renderMarkdown('> **写在前面**：这不是医疗建议。')

  assert.match(html, /<blockquote>/)
  assert.doesNotMatch(html, /research-risk-note/)
})

test('collapsible note allowlist stays aligned with the research README contract', () => {
  const labels = ['适用范围', '风险与合规提示', '风险提示', '合规提示', '合规提示（需自行核实最新法规）']
  for (const label of labels) {
    assert.match(`${label}：`, COLLAPSIBLE_NOTE_LABEL_RE)
  }
  assert.doesNotMatch('写在前面：', COLLAPSIBLE_NOTE_LABEL_RE)
  assert.doesNotMatch('免责声明：', COLLAPSIBLE_NOTE_LABEL_RE)
  assert.doesNotMatch('资料口径：', COLLAPSIBLE_NOTE_LABEL_RE)
})

test('risk and compliance notes move to the end of the article', () => {
  const html = renderMarkdown([
    '> **风险与合规提示：** 资料用于识别账本，不构成投资建议。',
    '',
    '> **合规提示：** 境内代币发行融资属于非法金融活动。',
    '',
    '## 结论',
    '',
    '正文从这里开始。',
  ].join('\n'))

  assert.match(html, /<h2[^>]*>结论<\/h2>[\s\S]*正文从这里开始。[\s\S]*research-risk-note__label">风险与合规提示/)
  assert.match(html, /research-risk-note__label">风险与合规提示[\s\S]*research-risk-note__label">合规提示/)
  assert.doesNotMatch(html, /research-risk-note[\s\S]*<h2[^>]*>结论/)
  assert.match(html, /data-research-note-placement="end"/)
  assert.match(html, /research-risk-note--end/)
})

test('scope notes also move to the end of the article', () => {
  const html = renderMarkdown([
    '> 适用范围：讨论的是健康成人在公开场合的急性应激。',
    '',
    '> **风险与合规提示：** 不构成投资建议。',
    '',
    '## 结论',
    '',
    '正文从这里开始。',
  ].join('\n'))

  assert.match(html, /<h2[^>]*>结论<\/h2>[\s\S]*正文从这里开始。[\s\S]*research-risk-note__label">适用范围/)
  assert.match(html, /research-risk-note__label">适用范围[\s\S]*research-risk-note__label">风险与合规提示/)
  assert.doesNotMatch(html, /research-risk-note[\s\S]*<h2[^>]*>结论/)
  assert.doesNotMatch(html.split('<h2')[0], /适用范围/)
  assert.doesNotMatch(html.split('<h2')[0], /风险与合规提示/)
})
