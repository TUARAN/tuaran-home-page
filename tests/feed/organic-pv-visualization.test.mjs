import assert from 'node:assert/strict'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'

test('organic PV visualization renders directly after the workbook download marker', () => {
  const html = renderMarkdown([
    '[下载工作簿](/api/resources/deliver?file=research-workbook)',
    '',
    '[!organic-pv-visualization]',
    '',
    '> 使用提示',
  ].join('\n'))

  const downloadPosition = html.indexOf('下载工作簿')
  const visualizationPosition = html.indexOf('id="organic-pv-viz-title"')
  const notePosition = html.indexOf('使用提示')

  assert.ok(downloadPosition >= 0)
  assert.ok(visualizationPosition > downloadPosition)
  assert.ok(notePosition > visualizationPosition)
  assert.match(html, /平台与行业的单 PV 价值区间/)
  assert.match(html, /9 个平台/)
  assert.match(html, /10 个行业/)
  assert.doesNotMatch(html, /TUARANORGANICPVVISUALIZATIONTOKEN/)
})
