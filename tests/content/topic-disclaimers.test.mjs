import assert from 'node:assert/strict'
import test from 'node:test'

import { topicDisclaimerKind } from '../../lib/content/topicDisclaimers.js'
import { getTopicHub, TOPIC_HUB_GROUPS, TOPIC_HUB_LIST } from '../../lib/content/topicHubs.js'

test('finance and health pieces get a disclaimer while ordinary engineering does not', () => {
  assert.equal(topicDisclaimerKind({
    subjects: ['business_market'],
    series: 'a_share_research',
    slug: 'a-share-603256',
    href: '/articles/research/companies/a-share-603256',
  }), 'finance')
  assert.equal(topicDisclaimerKind({
    subjects: ['web3'],
    slug: 'crypto-bitcoin',
    href: '/articles/research/topics/crypto-bitcoin',
  }), 'finance')
  assert.equal(topicDisclaimerKind({
    subjects: ['life_family'],
    title: '糖、乳果糖与一岁半孩子',
    slug: 'lactulose-sugar-18-month-old-child',
    tags: ['乳果糖', '便秘'],
  }), 'health')
  assert.equal(topicDisclaimerKind({
    subjects: ['life_family'],
    title: '照顾者偏好',
    slug: 'toddler-caregiver-preference-contextual-attachment',
  }), '')
  assert.equal(topicDisclaimerKind({
    subjects: ['web_cloud'],
    slug: 'cloudflare-d1-free-tier-limit-enforcement',
    href: '/articles/research/topics/cloudflare-d1-free-tier-limit-enforcement',
  }), '')
})

test('topic hubs only point at existing site paths', () => {
  assert.deepEqual(TOPIC_HUB_LIST.map((hub) => hub.path), ['/topics/ai-agents', '/topics/frontend-cloud'])
  for (const hub of TOPIC_HUB_LIST) {
    assert.equal(getTopicHub(hub.slug).title.length > 0, true)
    assert.ok(hub.leads.length >= 4)
    assert.ok(hub.leads.every((lead) => lead.href.startsWith('/')))
    assert.ok(hub.leads.every((lead) => TOPIC_HUB_GROUPS.some((group) => group.id === lead.group)))
  }
  assert.ok(getTopicHub('ai-agents').leads.some((lead) => lead.href === '/about#openclaw-contributions'))
  assert.ok(getTopicHub('frontend-cloud').leads.some((lead) => lead.href.includes('cloudflare-d1-free-tier-limit-enforcement')))
})
