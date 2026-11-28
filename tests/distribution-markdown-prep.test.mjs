import assert from 'node:assert/strict'
import test from 'node:test'

import {
  containsInlineSvgOrHtmlFigure,
  listMarkdownImageUrls,
  expandIntroBlockquoteParagraphs,
  prepareDistributionMarkdown,
  relocateBoundaryNotesToEnd,
  stripDuplicateTitleHeading,
} from '../lib/distribution/markdownPrep.js'
import { AUTHOR_INTRO_MARKDOWN } from '../lib/site/authorIntroMarkdown.js'
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

test('author intro markdown uses blank lines between blockquote paragraphs', () => {
  assert.match(AUTHOR_INTRO_MARKDOWN, /> 涂阿燃 ·[\s\S]*\n\n> 持续出版[\s\S]*\n\n> 更多请关注/)
})

test('expandIntroBlockquoteParagraphs inserts breaks between consecutive quote lines', () => {
  const cramped = `> 涂阿燃 · A\n> 第二行\n> 第三行\n\n## 正文\n\n段落。`
  const out = expandIntroBlockquoteParagraphs(cramped)
  assert.match(out, /> 涂阿燃 · A\n\n> 第二行\n\n> 第三行/)
})

test('prepareDistributionMarkdown prepends author intro when missing', () => {
  const out = prepareDistributionMarkdown('## 正文\n\n段落。', { title: '标题' })
  assert.match(out, /^> 涂阿燃 ·[\s\S]*## 正文/)
})

test('prepareDistributionMarkdown expands cramped author intro from jobs', () => {
  const raw = `> 涂阿燃 · A\n> 第二行\n\n## 正文\n\n段落。`
  const out = prepareDistributionMarkdown(raw, { title: '标题' })
  assert.match(out, /> 涂阿燃 · A\n\n> 第二行/)
})

test('relocateBoundaryNotesToEnd moves scope blockquote after intro, before 信息来源', () => {
  const raw = [
    '> 涂阿燃 · 作者',
    '',
    '> 适用范围：数据截至 2026-11-20。',
    '',
    '## 一、正文',
    '',
    '段落。',
    '',
    '## 信息来源与持续验证',
    '',
    '- 来源 A',
  ].join('\n')
  const out = relocateBoundaryNotesToEnd(raw)
  assert.match(out, /^> 涂阿燃 · 作者[\s\S]*## 一、正文/)
  assert.doesNotMatch(out.split('## 一、正文')[0], /适用范围/)
  assert.match(out, /段落。[\s\S]*> 适用范围：[\s\S]*## 信息来源与持续验证/)
})

test('prepareDistributionMarkdown is used when normalizing jobs', () => {
  const input = normalizeDistributionJobInput({
    title: '标题 A',
    url: 'https://2aran.com/articles/x',
    markdown: '# 标题 A\n\n正文',
    platformIds: ['juejin'],
  })
  assert.match(input.markdown, /^> 涂阿燃 ·[\s\S]*\n正文$/)
})

test('normalizeDistributionJobInput relocates boundary notes like site rendering', () => {
  const input = normalizeDistributionJobInput({
    title: '标题 A',
    url: 'https://2aran.com/articles/x',
    markdown: '> 适用范围：边界。\n\n## 正文\n\n内容。\n\n## 信息来源\n\n- a',
    platformIds: ['juejin'],
  })
  assert.match(input.markdown, /内容。[\s\S]*> 适用范围：[\s\S]*## 信息来源/)
  assert.doesNotMatch(input.markdown.split('## 正文')[0], /适用范围/)
})

test('offline task prompt drops duplicate title in markdown fence', () => {
  const prompt = buildDistributionTaskPrompt({
    title: '标题 B',
    url: `${SITE_ORIGIN}/articles/x`,
    markdown: '# 标题 B\n\n段落',
  })
  assert.match(prompt, /```markdown\n> 涂阿燃 ·[\s\S]*\n段落\n```/)
  assert.doesNotMatch(prompt, /```markdown\n# 标题 B/)
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