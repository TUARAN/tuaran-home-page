import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  buildDirectoryUrl,
  filtersFromParams,
  sameDirectoryFilters,
} from '../../lib/articlesDirectoryFilters.js'

const [pageSource, clientSource, skeletonSource] = await Promise.all([
  readFile(new URL('../../app/(site)/articles/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/ArticlesIndexSkeleton.jsx', import.meta.url), 'utf8'),
])

test('articles first HTML is the full directory so refresh does not paint a stripped list', () => {
  assert.match(pageSource, /<ArticlesIndexClient items=\{items\} initialFilters=\{initialFilters\}/)
  assert.match(pageSource, /await searchParams/)
  assert.doesNotMatch(pageSource, /ArticlesIndexFallback/)
  assert.doesNotMatch(pageSource, /ArticlesIndexSkeleton/)
  assert.match(clientSource, /const \[catalogReady, setCatalogReady\] = useState\(false\)/)
  assert.match(clientSource, /\.finally\(\(\) =>[\s\S]*setCatalogReady\(true\)/)
  assert.match(clientSource, /DirectorySearchParamsSync/)
  assert.doesNotMatch(clientSource, /return <ArticlesIndexSkeleton \/>/)
  assert.match(clientSource, /useSearchParams/)
})

test('articles skeleton preserves search, filter, and first-page row geometry', () => {
  assert.match(skeletonSource, /SKELETON_ROWS = Array\.from\({ length: 24 }/)
  assert.match(skeletonSource, /lg:grid-cols-\[236px_minmax\(0,1fr\)\]/)
  assert.match(skeletonSource, /正在加载内容目录/)
})

test('directory filters keep legacy query params and avoid no-op state updates', () => {
  assert.deepEqual(filtersFromParams(new URLSearchParams('tab=research')), {
    group: 'analysis',
    subject: 'all',
    query: '',
  })
  assert.deepEqual(filtersFromParams({ subject: 'ai_dev', q: 'Agent' }), {
    group: 'all',
    subject: 'ai_dev',
    query: 'Agent',
  })
  assert.equal(buildDirectoryUrl({ group: 'practice', subject: 'all', query: '' }), '/articles?group=practice')
  assert.equal(
    sameDirectoryFilters(
      { group: 'all', subject: 'ai_dev', query: '' },
      { group: 'all', subject: 'ai_dev', query: '' },
    ),
    true,
  )
})
