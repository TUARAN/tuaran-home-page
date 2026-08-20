import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { getPullRefreshDistance, shouldTriggerPullRefresh } from '../lib/h5PullRefresh.js'

test('pull-to-refresh only counts downward overscroll at the top', () => {
  assert.equal(getPullRefreshDistance(40, 120, 0), 80)
  assert.equal(getPullRefreshDistance(40, 120, 12), 0)
  assert.equal(getPullRefreshDistance(80, 40, 0), 0)
  assert.equal(shouldTriggerPullRefresh(55), false)
  assert.equal(shouldTriggerPullRefresh(56), true)
})

test('H5 feed hides search and batch buttons in favor of pull-to-refresh', async () => {
  const [readingSource, pageSource, articlesSource, directorySource, listSource, communitySource, accountSource] = await Promise.all([
    readFile(new URL('../app/(site)/components/HomeFeaturedReadingClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/page.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/articles/ArticlesIndexClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/components/GroupedDirectoryPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/articles/ArticleListItem.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/community/DiscussionHubClient.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/(site)/account/AccountClient.jsx', import.meta.url), 'utf8'),
  ])
  assert.match(readingSource, /H5PullToRefresh/)
  assert.match(readingSource, /home-featured-heading hidden md:flex/)
  assert.match(readingSource, /h5-batch-more[\s\S]*hidden[\s\S]*md:flex/)
  assert.match(readingSource, /home-reading-meta hidden md:flex/)
  assert.match(pageSource, /hidden px-4 sm:px-0 md:block/)
  assert.match(articlesSource, /h5-article-chips/)
  assert.match(articlesSource, /hidden space-y-2.5[\s\S]*搜索标题、主题或对象/)
  assert.match(listSource, /h5-feed-row/)
  assert.match(listSource, /grid-cols-\[minmax\(0,1fr\)_72px\]/)
  assert.match(directorySource, /h5-directory-page/)
  assert.match(directorySource, /h5-feed-row/)
  assert.match(directorySource, /h5-feed-list/)
  assert.match(directorySource, /h5-feed-label mb-0 md:hidden/)
  assert.match(readingSource, /h5-feed-row home-reading-item/)
  assert.match(communitySource, /h5-community-page/)
  assert.match(communitySource, /h5-topic-list/)
  assert.match(communitySource, /discussion-stats hidden md:grid/)
  assert.match(accountSource, /h5-account-page/)
  assert.match(accountSource, /account-metric-grid/)
})
