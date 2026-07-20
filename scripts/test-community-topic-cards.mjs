import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentSource = await readFile(
  new URL('../app/(site)/community/DiscussionHubClient.jsx', import.meta.url),
  'utf8',
)
const registrySource = await readFile(
  new URL('../lib/communityTopics.js', import.meta.url),
  'utf8',
)

test('discussion topic subset contains only the three requested platforms', () => {
  assert.match(registrySource, /export const DISCUSSION_COMMUNITY_TOPICS/)
  assert.match(registrySource, /shortLabel: 'X', shortDesc: '真实互动，一起增长。'/)
  assert.match(registrySource, /shortLabel: '小红书', shortDesc: '选题、标题与封面互评。'/)
  assert.match(registrySource, /shortLabel: '掘金', shortDesc: '技术文章互审与共创。'/)
  assert.match(registrySource, /\.filter\(\(topic\) => DISCUSSION_TOPIC_COPY\[topic\.id\]\)/)
})

test('discussion cards use compact content and a responsive three-column grid', () => {
  assert.match(componentSource, /DISCUSSION_COMMUNITY_TOPICS\.map/)
  assert.match(componentSource, /topic\.shortLabel/)
  assert.match(componentSource, /topic\.shortDesc/)
  assert.match(componentSource, /md:grid-cols-3/)
  assert.doesNotMatch(componentSource, /discussion-topic-tag/)
  assert.doesNotMatch(componentSource, /进入专题/)
})
