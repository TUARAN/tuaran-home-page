import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isInteractionNotification,
  notificationDestinationLabel,
  notificationHref,
  notificationTitle,
  presentNotification,
} from '../../lib/siteNotificationsDisplay.js'
import { notificationOpenHref } from '../../lib/notificationNavigation.js'

test('notification links carry the notification id without losing query or anchor', () => {
  assert.equal(
    notificationOpenHref('/crypto-research/rss?feed=v2ex#rss-feed-v2ex', 42),
    '/crypto-research/rss?feed=v2ex&notification=42#rss-feed-v2ex'
  )
  assert.equal(notificationOpenHref('/articles/hello#comment-9', 8), '/articles/hello?notification=8#comment-9')
})

test('interaction notifications jump to the content comment, not the inbox', () => {
  assert.equal(
    notificationHref({
      type: 'comment_reply',
      commentId: 42,
      contentHref: '/articles/hello',
    }),
    '/articles/hello#comment-42'
  )
  assert.equal(
    notificationHref({
      type: 'content_comment',
      commentId: 0,
      contentHref: '/articles/hello',
    }),
    '/articles/hello#comments'
  )
  assert.equal(
    notificationHref({
      type: 'content_like',
      contentHref: '/articles/hello',
    }),
    '/articles/hello#article-like'
  )
})

test('broken content keys still land on a real page per type', () => {
  assert.equal(notificationHref({ type: 'comment_reply' }), '/community')
  assert.equal(notificationHref({ type: 'content_like' }), '/')
  assert.equal(notificationHref({ type: 'weekly_summary' }), '/admin/content-weekly?days=7#notification-destination')
  assert.equal(notificationHref({ type: 'automation_monitor' }), '/admin/ops#notification-destination')
  assert.equal(notificationHref({ type: 'rss_update' }), '/crypto-research/rss')
})

test('RSS updates open the matching feed card', () => {
  assert.equal(
    notificationHref({
      type: 'rss_update',
      articleKey: 'rss:v2ex-newsletter:guid-1',
    }),
    '/crypto-research/rss?feed=v2ex-newsletter#rss-feed-v2ex-newsletter'
  )
})

test('titles and destinations stay distinct so the row is scannable', () => {
  assert.equal(notificationTitle('comment_reply', '阿然'), '阿然 回复了你')
  assert.equal(
    notificationDestinationLabel('comment_reply', '一篇调研'),
    '查看回复 · 一篇调研'
  )
  assert.equal(notificationDestinationLabel('weekly_summary', '站点周报'), '打开周报')
  assert.equal(notificationDestinationLabel('automation_monitor', 'RSS 轮询'), '打开运维台')
})

test('presentNotification fills type label, href and destination together', () => {
  const item = presentNotification(
    {
      type: 'content_comment',
      actor_user_name: '访客甲',
      article_key: 'article:hello',
      comment_id: 9,
      message_excerpt: '写得清楚',
    },
    { title: '你好', href: '/articles/hello' }
  )
  assert.equal(item.typeLabel, '评论')
  assert.equal(item.title, '访客甲 评论了你的内容')
  assert.equal(item.href, '/articles/hello#comment-9')
  assert.equal(item.destinationLabel, '查看评论 · 你好')
  assert.equal(item.messageExcerpt, '写得清楚')
  assert.equal(isInteractionNotification(item.type), true)
  assert.equal(isInteractionNotification('rss_update'), false)
  assert.equal(isInteractionNotification('automation_monitor'), false)
})
