import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { renderMarkdown } from '../../lib/research/markdown.js'

test('mermaid fenced blocks become renderable diagram containers', () => {
  const html = renderMarkdown('```mermaid\ngraph TD\n  A --> B\n```')

  assert.match(html, /<pre class="mermaid-diagram" data-mermaid-diagram/)
  assert.match(html, /<code>graph TD\n  A --&gt; B<\/code>/)
  assert.doesNotMatch(html, /language-mermaid/)
})

test('mermaid source is escaped before client rendering', () => {
  const html = renderMarkdown('```mermaid\ngraph TD\n  A[<script>alert(1)</script>]\n```')

  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})

test('other fenced code blocks keep the default marked output', () => {
  const html = renderMarkdown('```js\nconst answer = 42\n```')

  assert.match(html, /<code class="language-js">const answer = 42/)
  assert.doesNotMatch(html, /data-mermaid-diagram/)
})

test('Mermaid runtime stays out of the Cloudflare Worker bundle', async () => {
  const renderer = await readFile(
    new URL('../../app/(site)/components/MermaidRenderer.jsx', import.meta.url),
    'utf8',
  )

  assert.match(renderer, /cdn\.jsdelivr\.net\/npm\/mermaid@11\.16\.0\/dist\/mermaid\.min\.js/)
  assert.doesNotMatch(renderer, /import\(['"]mermaid['"]\)/)
})
