import assert from 'node:assert/strict'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'

test('embeds approved video hosts and local research videos', () => {
  const html = renderMarkdown([
    '::video[Google Duplex](https://www.youtube.com/watch?v=-qCanuYrR0g)',
    '',
    '::video[Humane Ai Pin](https://vimeo.com/882968794)',
    '',
    '::video[本地样片](/research-media/agent-calls/demo.mp4)',
    '',
    '::video[Friend 发布片](https://x.com/AviSchiffmann/status/1818284595902922884)',
    '',
    '::video[Grok Bot 发布片](https://media.x.ai/v1/website/260810_2245_bw_dr_cursor_bot_edit_v8-60724aba.mp4)',
  ].join('\n'))

  assert.match(html, /youtube-nocookie\.com\/embed\/-qCanuYrR0g/)
  assert.match(html, /player\.vimeo\.com\/video\/882968794/)
  assert.match(html, /<video controls preload="metadata" playsinline src="\/research-media\/agent-calls\/demo\.mp4"><\/video>/)
  assert.match(html, /platform\.twitter\.com\/embed\/Tweet\.html\?id=1818284595902922884/)
  assert.match(html, /<video controls preload="metadata" playsinline src="https:\/\/media\.x\.ai\/v1\/website\//)
  assert.equal((html.match(/<figure class="research-inline-video/g) || []).length, 5)
})

test('unapproved video URLs stay links and cannot inject HTML', () => {
  const html = renderMarkdown([
    '::video[未知视频](https://example.com/video)',
    '',
    '::video[标题<script>](https://www.youtube.com/watch?v=-qCanuYrR0g)',
  ].join('\n'))

  assert.match(html, /href="https:\/\/example\.com\/video"/)
  assert.doesNotMatch(html, /<iframe[^>]+example\.com/)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /标题&lt;script&gt;/)
})
