import assert from 'node:assert/strict'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'

test('renders bold labels before adjacent Chinese text in list items', () => {
  const html = renderMarkdown([
    '1. **考上前准备 500—15,000 元。**最低支出是报考费。',
    '2. **录取后：**按专业缴纳学费。',
  ].join('\n'))

  assert.match(html, /<li><strong>考上前准备 500—15,000 元。<\/strong>最低支出是报考费。<\/li>/)
  assert.match(html, /<li><strong>录取后：<\/strong>按专业缴纳学费。<\/li>/)
  assert.doesNotMatch(html, /\*\*/)
})

test('renders bold quoted phrases adjacent to Chinese text', () => {
  const html = renderMarkdown('它的价值是**“长期积累”**，单个功能很难替代。')

  assert.match(html, /它的价值是<strong>“长期积累”<\/strong>，单个功能很难替代。/)
})

test('keeps double asterisks literal inside inline and fenced code', () => {
  const html = renderMarkdown([
    '`**not bold**`',
    '',
    '```md',
    '**not bold either**',
    '```',
  ].join('\n'))

  assert.match(html, /<code>\*\*not bold\*\*<\/code>/)
  assert.match(html, /<code class="language-md">\*\*not bold either\*\*/)
})
