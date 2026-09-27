import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [discussionPage, discussionClient, circlesPage, navSource] = await Promise.all([
  readFile(new URL('../../app/(site)/community/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/community/DiscussionHubClient.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../app/(site)/circles/page.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../../lib/siteNav.js', import.meta.url), 'utf8'),
])

test('discussion center contains discussion features without membership content', () => {
  assert.match(discussionPage, /title: '讨论中心'/)
  assert.match(discussionClient, /<h1>讨论中心<\/h1>/)
  assert.match(discussionClient, /StompPanel/)
  assert.doesNotMatch(discussionClient, /CommunityMembershipCard|DISCUSSION_COMMUNITY_TOPICS|付费加入圈子|加入微信群聊/)
})

test('circles page owns topic introductions and joining instructions', () => {
  assert.match(circlesPage, /canonical: '\/circles'/)
  assert.match(circlesPage, /DISCUSSION_COMMUNITY_TOPICS/)
  assert.match(circlesPage, /CommunityMembershipCard/)
  assert.match(circlesPage, /查看加群方式/)
  assert.match(navSource, /href: '\/circles', label: '圈子'[^\n]*featured: true/)
  assert.match(navSource, /href: '\/community', label: '讨论中心'[^\n]*公开留言与文章评论/)
})
