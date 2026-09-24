import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyResearchQueue,
  decodeGitHubFileContent,
  dropUnchangedPublishedUpdates,
  extractResearchTitleFromMarkdown,
  fillMissingResearchTitles,
  githubCompareRange,
  hashResearchSource,
  listGitHubRecentResearchPaths,
  listResearchFilesFromTree,
  loadGitHubResearchIndex,
  parseResearchSourcePath,
  paginatePublishedResearch,
  researchPathsFromChangedFiles,
  resetResearchGitHubCaches,
  storedResearchTitle,
  withStoredResearchTitles,
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

test('approval queue treats unpublished and recently touched published files as pending candidates', () => {
  const files = listResearchFilesFromTree([
    { path: 'research/topics/2026-09-11-pi.md', type: 'blob' },
    { path: 'research/topics/2026-09-10-live.md', type: 'blob' },
    { path: 'research/topics/2026-09-09-draft.md', type: 'blob' },
  ])
  const { pending, publishedCount } = classifyResearchQueue(files, [
    { source_path: 'research/topics/2026-09-10-live.md', status: 'published', revision: 3, title: '线上已发布' },
    { source_path: 'research/topics/2026-09-09-draft.md', status: 'draft', revision: 1, metadata_json: JSON.stringify({ title: '草稿标题' }) },
  ], ['research/topics/2026-09-10-live.md'])
  assert.equal(publishedCount, 1)
  assert.deepEqual(pending.map((item) => [item.slug, item.reason, item.title]), [
    ['pi', 'new', ''],
    ['live', 'updated', '线上已发布'],
    ['draft', 'draft', '草稿标题'],
  ])
})

test('published research is filtered and paginated without returning the whole library', () => {
  const files = Array.from({ length: 95 }, (_, index) => ({
    title: index === 41 ? '特别标题' : `调研 ${index}`,
    slug: `item-${index}`,
    filename: `2026-09-${String((index % 28) + 1).padStart(2, '0')}-item-${index}.md`,
    sourcePath: `research/topics/2026-09-${String((index % 28) + 1).padStart(2, '0')}-item-${index}.md`,
  }))
  const queue = { files, pending: [files[0]] }
  const first = paginatePublishedResearch(queue, { page: 1, pageSize: 40 })
  assert.equal(first.items.length, 40)
  assert.equal(first.total, 94)
  assert.equal(first.hasMore, true)
  assert.equal(first.items.some((item) => item.sourcePath === files[0].sourcePath), false)
  const last = paginatePublishedResearch(queue, { page: 3, pageSize: 40 })
  assert.equal(last.items.length, 14)
  assert.equal(last.hasMore, false)
  const matched = paginatePublishedResearch(queue, { query: '特别标题' })
  assert.deepEqual(matched.items.map((item) => item.slug), ['item-41'])
  assert.equal(matched.total, 1)
})

test('approval queue only keeps recently touched published files when GitHub body differs', async () => {
  const live = '---\ntitle: 线上已发布\n---\n\n当前正文\n'
  const changed = '---\ntitle: 线上已发布\n---\n\n改过的正文\n'
  const liveHash = await hashResearchSource(live)
  const pending = [
    { sourcePath: 'research/topics/2026-09-11-pi.md', slug: 'pi', reason: 'new', title: '圆周率' },
    { sourcePath: 'research/topics/2026-09-10-live.md', slug: 'live', reason: 'updated', title: '线上已发布' },
    { sourcePath: 'research/topics/2026-09-08-heloc.md', slug: 'heloc', reason: 'updated', title: 'Heloc' },
    { sourcePath: 'research/topics/2026-09-07-missing.md', slug: 'missing', reason: 'updated', title: '读不到' },
  ]
  const documents = [
    { source_path: 'research/topics/2026-09-10-live.md', status: 'published', source_hash: liveHash },
    { source_path: 'research/topics/2026-09-08-heloc.md', status: 'published', source_hash: liveHash },
    { source_path: 'research/topics/2026-09-07-missing.md', status: 'published', source_hash: liveHash },
  ]
  const bodies = {
    'research/topics/2026-09-10-live.md': live,
    'research/topics/2026-09-08-heloc.md': changed,
  }
  const confirmed = await dropUnchangedPublishedUpdates(pending, documents, async (item) => {
    if (!(item.sourcePath in bodies)) throw new Error('GITHUB_API')
    return bodies[item.sourcePath]
  })
  assert.deepEqual(confirmed.map((item) => item.slug), ['pi', 'heloc', 'missing'])
})

test('research titles come from frontmatter, stored metadata, then GitHub body for missing pending items', async () => {
  assert.equal(extractResearchTitleFromMarkdown('---\ntitle: 圆周率 π\ncategory: topics\n---\n\n正文\n'), '圆周率 π')
  assert.equal(extractResearchTitleFromMarkdown('---\ntitle: "quoted"\n---\n'), 'quoted')
  assert.equal(extractResearchTitleFromMarkdown('# no frontmatter\n'), '')
  assert.equal(storedResearchTitle({ metadata_json: '{"title":"调研标题"}' }), '调研标题')
  const files = withStoredResearchTitles([
    { sourcePath: 'research/topics/2026-09-11-pi.md', slug: 'pi', filename: '2026-09-11-pi.md' },
    { sourcePath: 'research/topics/2026-09-10-live.md', slug: 'live', filename: '2026-09-10-live.md' },
  ], [{ source_path: 'research/topics/2026-09-10-live.md', title: '线上已发布' }])
  assert.deepEqual(files.map((item) => item.title), ['', '线上已发布'])
  const pending = await fillMissingResearchTitles(files, async (item) => {
    assert.equal(item.slug, 'pi')
    return '---\ntitle: 圆周率 π\n---\n'
  })
  assert.deepEqual(pending.map((item) => item.title), ['圆周率 π', '线上已发布'])
})

test('GitHub file payloads decode UTF-8 markdown', () => {
  const text = '# 圆周率\n'
  const encoded = Buffer.from(text, 'utf8').toString('base64')
  assert.equal(decodeGitHubFileContent({ encoding: 'base64', content: `${encoded.slice(0, 8)}\n${encoded.slice(8)}` }), text)
})

test('approval console lists Chinese titles ahead of slugs', async () => {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../../app/(admin)/admin/articles/research-import/ResearchImportConsole.jsx', import.meta.url), 'utf8')
  const pill = await readFile(new URL('../../app/(admin)/components/ui/StatusPill.jsx', import.meta.url), 'utf8')
  assert.match(source, /\{item\.title \|\| item\.slug\}/)
  assert.match(source, /placeholder="标题、slug、文件名"/)
  assert.match(source, /updated: '正文已改'/)
  assert.match(source, /已发布但 GitHub 正文与线上不一致/)
  assert.match(source, /阅览/)
  assert.match(source, /renderMarkdown/)
  assert.match(source, /prose-tuaran/)
  assert.match(source, /refresh=1/)
  assert.match(source, /lg:grid-cols-\[minmax\(20rem,26rem\)_minmax\(0,1fr\)\]/)
  assert.match(source, /全选当前列表/)
  assert.match(source, /saveSelected\('published'\)/)
  assert.match(source, /type="checkbox"/)
  assert.match(pill, /whitespace-nowrap/)
  assert.match(pill, /shrink-0/)
  assert.doesNotMatch(source, /CollapsibleSection/)
})

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  }
}

test('recent research paths come from a single compare range, not per-commit file lists', async () => {
  assert.deepEqual(githubCompareRange([{ sha: 'aaa', parents: [{ sha: 'parent' }] }, { sha: 'bbb', parents: [{ sha: 'root' }] }]), {
    head: 'aaa',
    base: 'root',
  })
  assert.deepEqual(
    researchPathsFromChangedFiles([
      { filename: 'research/topics/2026-09-11-pi.md' },
      { filename: 'README.md' },
      { previous_filename: 'research/topics/2026-09-01-older.md' },
    ]),
    ['research/topics/2026-09-11-pi.md', 'research/topics/2026-09-01-older.md'],
  )
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    if (String(url).includes('/commits?')) {
      return jsonResponse([{ sha: 'aaa', parents: [{ sha: 'parent' }] }, { sha: 'bbb', parents: [{ sha: 'root' }] }])
    }
    if (String(url).includes('/compare/root...aaa')) {
      return jsonResponse({ files: [{ filename: 'research/topics/2026-09-11-pi.md' }, { filename: 'package.json' }] })
    }
    throw new Error(String(url))
  }
  try {
    const paths = await listGitHubRecentResearchPaths({ GITHUB_SYNC_TOKEN: 't', GITHUB_REPOSITORY: 'TUARAN/tuaran-home-page' })
    assert.deepEqual(paths, ['research/topics/2026-09-11-pi.md'])
    assert.equal(calls.filter((url) => /\/commits\/[a-f0-9]+$/i.test(url)).length, 0)
    assert.equal(calls.filter((url) => url.includes('/compare/')).length, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('GitHub research index is reused until an explicit refresh', async () => {
  resetResearchGitHubCaches()
  const originalFetch = globalThis.fetch
  let trees = 0
  globalThis.fetch = async (url) => {
    const href = String(url)
    if (href.includes('/git/trees/')) {
      trees += 1
      return jsonResponse({ tree: [{ path: 'research/topics/2026-09-11-pi.md', type: 'blob', sha: '3' }] })
    }
    if (href.includes('/commits?')) return jsonResponse([])
    throw new Error(href)
  }
  try {
    const env = { GITHUB_SYNC_TOKEN: 't', GITHUB_REPOSITORY: 'TUARAN/tuaran-home-page' }
    const first = await loadGitHubResearchIndex(env)
    const second = await loadGitHubResearchIndex(env)
    assert.equal(trees, 1)
    assert.equal(first.files[0].slug, 'pi')
    assert.equal(second.files[0].slug, 'pi')
    await loadGitHubResearchIndex(env, { refresh: true })
    assert.equal(trees, 2)
  } finally {
    globalThis.fetch = originalFetch
    resetResearchGitHubCaches()
  }
})
