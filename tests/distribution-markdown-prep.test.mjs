import assert from 'node:assert/strict'
import test from 'node:test'

import {
  containsInlineSvgOrHtmlFigure,
  listMarkdownImageUrls,
  prepareDistributionMarkdown,
  stripDuplicateTitleHeading,
} from '../lib/distribution/markdownPrep.js'
import { normalizeDistributionJobInput } from '../lib/distribution/jobs.js'
import { buildDistributionTaskPrompt } from '../lib/distribution/taskPrompt.js'
import { SITE_ORIGIN } from '../lib/distribution/harness.js'

test('stripDuplicateTitleHeading removes matching leading H1/H2', () => {
  const title = '中国移动 OAS 是什么'
  const raw = `# ${title}\n\n> 署名\n\n## 正文`
  assert.equal(stripDuplicateTitleHeading(raw, title), `> 署名\n\n## 正文`)
  assert.equal(stripDuplicateTitleHeading(`## ${title}\nbody`, title), 'body')
  assert.equal(stripDuplicateTitleHeading('# 别的标题\nbody', title), `# 别的标题\nbody`)
})

test('prepareDistributionMarkdown is used when normalizing jobs', () => {
  const input = normalizeDistributionJobInput({
    title: '标题 A',
    url: 'https://2aran.com/articles/x',
    markdown: '# 标题 A\n\n正文',
    platformIds: ['juejin'],
  })
  assert.equal(input.markdown, '正文')
})

test('offline task prompt drops duplicate title in markdown fence', () => {
  const prompt = buildDistributionTaskPrompt({
    title: '标题 B',
    url: `${SITE_ORIGIN}/articles/x`,
    markdown: '# 标题 B\n\n段落',
  })
  assert.ok(prompt.includes('```markdown\n段落\n```'))
  assert.ok(!prompt.includes('# 标题 B'))
})

test('listMarkdownImageUrls flags on-site images', () => {
  const urls = listMarkdownImageUrls('![a](/images/x.png) ![b](https://example.com/y.png)')
  assert.equal(urls.length, 2)
  assert.equal(urls[0].onSite, true)
  assert.equal(urls[0].url, `${SITE_ORIGIN}/images/x.png`)
  assert.equal(urls[1].onSite, false)
})

test('containsInlineSvgOrHtmlFigure detects research diagrams', () => {
  assert.equal(containsInlineSvgOrHtmlFigure('<figure><svg></svg></figure>'), true)
  assert.equal(containsInlineSvgOrHtmlFigure('# 纯 Markdown'), false)
})