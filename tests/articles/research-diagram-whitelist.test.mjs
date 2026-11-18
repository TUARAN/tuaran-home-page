import assert from 'node:assert/strict'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'

// 与安全白名单对齐的图形骨架。figure 的 class 必须正好是 research-inline-diagram，
// 否则 extractTrustedHtmlBlocks() 不会把它抽成可信块，整块会被转义成文本。
function diagram(inner) {
  return [
    '<figure class="research-inline-diagram">',
    '<svg viewBox="0 0 200 90" role="img" aria-label="白名单测试图">',
    inner,
    '</svg>',
    '<figcaption>图：白名单验证</figcaption>',
    '</figure>',
  ].join('\n')
}

const SAFE_GRADIENT_FIGURE = [
  '<figure class="research-inline-diagram">',
  '<svg viewBox="0 0 220 90" role="img" aria-label="渐变、多边形与多行文字">',
  '<defs>',
  '<linearGradient id="grad" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">',
  '<stop offset="0%" stop-color="#E6F1FB" stop-opacity="1"/>',
  '<stop offset="100%" stop-color="#185FA5"/>',
  '</linearGradient>',
  '</defs>',
  '<polygon points="10,12 96,12 53,68" fill="url(#grad)" stroke="#185FA5" stroke-width="1"/>',
  '<text x="110" y="40" font-size="13" fill="#232320"><tspan x="110" dy="0">第一行</tspan><tspan x="110" dy="18">第二行</tspan></text>',
  '</svg>',
  '<figcaption>图：渐变、多边形与 tspan 均可渲染</figcaption>',
  '</figure>',
].join('\n')

test('彩色契约新增的渐变、多边形、tspan 标签与属性能通过白名单', () => {
  const html = renderMarkdown(SAFE_GRADIENT_FIGURE)

  assert.match(html, /data-research-lightbox="true"/, '可信图形应自动加点击放大')
  assert.match(html, /<linearGradient id="grad"/)
  assert.match(html, /<stop offset="0%" stop-color="#E6F1FB" stop-opacity="1"\/>/)
  assert.match(html, /<polygon points="10,12 96,12 53,68"/, 'points 此前缺失，多边形必须能成形')
  assert.match(html, /<tspan x="110" dy="18">第二行<\/tspan>/)
  assert.doesNotMatch(html, /&lt;polygon/, '可信图形不应被转义成文本')
})

test('radialGradient 与 fill-opacity / stroke-opacity 可用', () => {
  const html = renderMarkdown(diagram([
    '<defs><radialGradient id="rg" cx="0.5" cy="0.5" r="0.5" fx="0.4" fy="0.4">',
    '<stop offset="0%" stop-color="#FAEEDA"/>',
    '<stop offset="100%" stop-color="#854F0B"/>',
    '</radialGradient></defs>',
    '<circle cx="60" cy="45" r="30" fill="url(#rg)" fill-opacity="0.9" stroke-opacity="0.8"/>',
  ].join('\n')))

  assert.match(html, /data-research-lightbox="true"/)
  assert.match(html, /<radialGradient id="rg"/)
  assert.match(html, /fill-opacity="0.9"/)
  assert.doesNotMatch(html, /&lt;radialGradient/)
})

test('危险属性与标签仍被整块拒绝，不进入正文 HTML', () => {
  const rejected = [
    diagram('<rect x="10" y="10" width="40" height="20" style="fill:red"/>'),
    diagram('<rect x="10" y="10" width="40" height="20" onload="alert(1)"/>'),
    diagram('<rect x="10" y="10" width="40" height="20" fill="javascript:alert(1)"/>'),
    diagram('<rect x="10" y="10" width="40" height="20" fill="url(data:image/svg+xml;base64,AAAA)"/>'),
    diagram('<rect x="10" y="10" width="40" height="20" font-family="serif"/>'),
    diagram('<rect x="10" y="10" width="40" height="20" dominant-baseline="middle"/>'),
    diagram('<a href="https://example.com"><rect x="10" y="10" width="40" height="20"/></a>'),
    diagram('<foreignObject width="40" height="20"><div>hi</div></foreignObject>'),
    diagram('<filter id="f"><feGaussianBlur/></filter>'),
    diagram('<script>alert(1)</script>'),
    diagram('<!-- 注释 --><rect x="10" y="10" width="40" height="20"/>'),
  ]

  for (const figure of rejected) {
    const html = renderMarkdown(figure)
    assert.doesNotMatch(html, /data-research-lightbox="true"/, `${figure.slice(0, 80)} 不应被判为可信图形`)
    assert.doesNotMatch(html, /<rect x="10"/, '被拒图形不得露出原始标签')
  }
})

test('缺少 research-inline-diagram class 的 figure 仍按不可信内容转义', () => {
  const html = renderMarkdown('<figure class="other">\n<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>\n</figure>')
  assert.doesNotMatch(html, /data-research-lightbox="true"/)
  assert.doesNotMatch(html, /<svg viewBox="0 0 10 10"/)
})

test('彩色语义标签渲染成受控 span，文字内容被转义', () => {
  const html = renderMarkdown('结论：[!core]核心判断[/!core]、[!good]已核验[/!good]、[!warn]待核[/!warn]、[!risk]有风险[/!risk]、[!mute]次要[/!mute]。')

  assert.match(html, /<span class="sem-tag sem-tag--core">核心判断<\/span>/)
  assert.match(html, /<span class="sem-tag sem-tag--good">已核验<\/span>/)
  assert.match(html, /<span class="sem-tag sem-tag--warn">待核<\/span>/)
  assert.match(html, /<span class="sem-tag sem-tag--risk">有风险<\/span>/)
  assert.match(html, /<span class="sem-tag sem-tag--mute">次要<\/span>/)
})

test('语义标签里的 HTML 被转义，不成为注入面', () => {
  const html = renderMarkdown('[!core]<img src=x onerror=alert(1)>[/!core]')
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
  assert.doesNotMatch(html, /<img src=x/)
})

test('未知语义类别不会被注入 class', () => {
  const html = renderMarkdown('[!evil]文本[/!evil]')
  assert.doesNotMatch(html, /sem-tag--evil/)
  assert.doesNotMatch(html, /class="sem-tag/)
})

test('彩色语义标签可在表格单元格里使用', () => {
  const markdown = [
    '| 项 | 状态 |',
    '|---|---|',
    '| 甲 | [!good]已核验[/!good] |',
    '| 乙 | [!warn]待核[/!warn] |',
  ].join('\n')
  const html = renderMarkdown(markdown)

  assert.match(html, /class="table-scroll"/)
  assert.match(html, /<span class="sem-tag sem-tag--good">已核验<\/span>/)
  assert.match(html, /<span class="sem-tag sem-tag--warn">待核<\/span>/)
})

test('原有 [!red] 高亮不受彩色语义标签影响', () => {
  const html = renderMarkdown('[!red]重点[/!red] 与 [!core]核心[/!core]')
  assert.match(html, /<span style="color:#dc2626;font-weight:650">重点<\/span>/)
  assert.match(html, /<span class="sem-tag sem-tag--core">核心<\/span>/)
})
