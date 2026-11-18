import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

import { buildStandaloneSvgMarkup, SVG_EMBED_STYLE_MARK } from '../../lib/research/svgEmbedStyle.js'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 516"><rect class="sem-core"/></svg>'

test('独立文档 SVG 注入内嵌语义配色', () => {
  const out = buildStandaloneSvgMarkup(SVG)

  assert.notEqual(out, SVG, '应产生变化')
  assert.match(out, /<style data-svg-embed-style="true">/, '应带注入标记（XML 属性必须带值）')
  assert.match(out, /\.sem-core \{ fill: #e6f1fb; stroke: #185fa5; \}/)
  assert.match(out, /@media \(prefers-color-scheme: dark\)/, '应覆盖暗色主题')
  assert.match(out, /\.sem-core \{ fill: #16293b; stroke: #5b8fc4; \}/)
  assert.ok(out.startsWith('<svg'), '样式应插在 svg 开标签之后')
})

test('注入幂等且对非法输入安全', () => {
  const once = buildStandaloneSvgMarkup(SVG)
  assert.equal(buildStandaloneSvgMarkup(once), once, '重复注入应原样返回')
  assert.equal(buildStandaloneSvgMarkup('<div>not svg</div>'), '<div>not svg</div>')
  assert.equal(buildStandaloneSvgMarkup(null), null)
  assert.equal(buildStandaloneSvgMarkup(undefined), undefined)
})

test('内嵌配色与 globals.css 的语义色板保持同步', () => {
  const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8')
  const style = buildStandaloneSvgMarkup(SVG)

  const lightPairs = [
    ['--sem-core-bg: #e6f1fb', 'fill: #e6f1fb'],
    ['--sem-core-line: #185fa5', 'stroke: #185fa5'],
    ['--sem-good-bg: #e1f5ee', 'fill: #e1f5ee'],
    ['--sem-warn-ink: #7a4b12', 'fill: #7a4b12'],
    ['--sem-mute-bg: #eef0ed', 'fill: #eef0ed'],
    ['--sem-risk-line: #b0433a', 'stroke: #b0433a'],
  ]
  const darkPairs = [
    ['--sem-core-bg: #16293b', 'fill: #16293b'],
    ['--sem-core-line: #5b8fc4', 'stroke: #5b8fc4'],
    ['--sem-good-bg: #152b23', 'fill: #152b23'],
    ['--sem-warn-ink: #ecd6a6', 'fill: #ecd6a6'],
    ['--sem-mute-bg: #222420', 'fill: #222420'],
    ['--sem-risk-line: #c47066', 'stroke: #c47066'],
  ]

  for (const [token, embedded] of lightPairs) {
    assert.ok(css.includes(token), `globals.css 应含亮色令牌 ${token}`)
    assert.ok(style.includes(embedded), `内嵌样式应含 ${embedded}`)
  }
  for (const [token, embedded] of darkPairs) {
    assert.ok(css.includes(token), `globals.css 应含暗色令牌 ${token}`)
    const darkBlock = style.split('@media (prefers-color-scheme: dark)')[1]
    assert.ok(darkBlock.includes(embedded), `暗色块应含 ${embedded}`)
  }
})
