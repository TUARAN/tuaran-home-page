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
const siteNavSource = await readFile(
  new URL('../lib/siteNav.js', import.meta.url),
  'utf8',
)

test('discussion cards contain the three active circles with detailed copy', () => {
  assert.match(registrySource, /export const DISCUSSION_COMMUNITY_TOPICS/)
  assert.match(registrySource, /\.filter\(\(topic\) => COMMUNITY_TOPIC_NAV_COPY\[topic\.id\]\)/)
})

test('discussion cards use detailed content and a responsive three-column grid', () => {
  assert.match(componentSource, /DISCUSSION_COMMUNITY_TOPICS\.map/)
  assert.match(componentSource, /topic\.label/)
  assert.match(componentSource, /topic\.desc/)
  assert.match(componentSource, /md:grid-cols-3/)
  assert.doesNotMatch(componentSource, /discussion-topic-tag/)
  assert.doesNotMatch(componentSource, /进入专题/)
  assert.doesNotMatch(componentSource, /topic\.tag/)
})

test('secondary navigation uses compact copy without status tags', () => {
  assert.match(registrySource, /export const COMMUNITY_TOPIC_NAV_ITEMS/)
  assert.match(siteNavSource, /items: COMMUNITY_TOPIC_NAV_ITEMS/)
  assert.match(registrySource, /label: 'X 互助圈'/)
  assert.match(registrySource, /label: '小红书创作圈'/)
  assert.match(registrySource, /label: '掘金创作圈'/)
  assert.match(registrySource, /const \{ tag: _tag, \.\.\.item \} = topic/)
})
