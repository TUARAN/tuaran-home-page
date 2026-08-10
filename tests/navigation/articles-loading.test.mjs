import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [pageSource, clientSource, skeletonSource] = await Promise.all([
  readFile(new URL('../../app/(site)/articles/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/articles/ArticlesIndexSkeleton.jsx', import.meta.url), 'utf8'),
])

test('articles keeps one skeleton through hydration and supplemental catalog loading', () => {
  assert.match(pageSource, /fallback={<ArticlesIndexSkeleton \/>}/)
  assert.doesNotMatch(pageSource, /ArticlesIndexFallback|ArticleListItem/)
  assert.match(clientSource, /const \[catalogReady, setCatalogReady\] = useState\(false\)/)
  assert.match(clientSource, /\.finally\(\(\) =>[\s\S]*setCatalogReady\(true\)/)
  assert.match(clientSource, /if \(!catalogReady\) return <ArticlesIndexSkeleton \/>/)
})

test('articles skeleton preserves search, filter, and first-page row geometry', () => {
  assert.match(skeletonSource, /SKELETON_ROWS = Array\.from\({ length: 24 }/)
  assert.match(skeletonSource, /lg:grid-cols-\[236px_minmax\(0,1fr\)\]/)
  assert.match(skeletonSource, /正在加载内容目录/)
})
