import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyResearchQueue,
  decodeGitHubFileContent,
  listResearchFilesFromTree,
  parseResearchSourcePath,
} from '../../lib/researchGitHubQueue.js'

test('research source paths only accept dated markdown under the three Git folders', () => {
  assert.deepEqual(parseResearchSourcePath('research/topics/2026-09-11-pi.md'), {
    category: 'topics',
    filename: '2026-09-11-pi.md',
    slug: 'pi',
    sourcePath: 'research/topics/2026-09-11-pi.md',
  })
  assert.equal(parseResearchSourcePath('research/templates/a-share-company-research.md'), null)
  assert.equal(parseResearchSourcePath('../research/topics/2026-09-11-pi.md'), null)
})

test('GitHub tree listing keeps newest research files first and drops non-markdown blobs', () => {
  const files = listResearchFilesFromTree([
    { path: 'README.md', type: 'blob', sha: '1' },
    { path: 'research/topics/2026-09-01-older.md', type: 'blob', sha: '2' },
    { path: 'research/topics/2026-09-11-pi.md', type: 'blob', sha: '3' },
    { path: 'research/topics', type: 'tree', sha: '4' },
  ])
  assert.deepEqual(files.map((item) => item.slug), ['pi', 'older'])
})

test('approval queue treats unpublished and recently touched published files as pending', () => {
  const files = listResearchFilesFromTree([
    { path: 'research/topics/2026-09-11-pi.md', type: 'blob' },
    { path: 'research/topics/2026-09-10-live.md', type: 'blob' },
    { path: 'research/topics/2026-09-09-draft.md', type: 'blob' },
  ])
  const { pending, publishedCount } = classifyResearchQueue(files, [
    { source_path: 'research/topics/2026-09-10-live.md', status: 'published', revision: 3 },
    { source_path: 'research/topics/2026-09-09-draft.md', status: 'draft', revision: 1 },
  ], ['research/topics/2026-09-10-live.md'])
  assert.equal(publishedCount, 1)
  assert.deepEqual(pending.map((item) => [item.slug, item.reason]), [
    ['pi', 'new'],
    ['live', 'updated'],
    ['draft', 'draft'],
  ])
})

test('GitHub file payloads decode UTF-8 markdown', () => {
  const text = '# 圆周率\n'
  const encoded = Buffer.from(text, 'utf8').toString('base64')
  assert.equal(decodeGitHubFileContent({ encoding: 'base64', content: `${encoded.slice(0, 8)}\n${encoded.slice(8)}` }), text)
})
