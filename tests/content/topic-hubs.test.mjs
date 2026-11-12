import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { TOPIC_HUB_GROUPS, TOPIC_HUB_LIST, getTopicHub } from '../../lib/content/topicHubs.js'
import { SUBJECT_KEYS } from '../../lib/content/contentTaxonomy.js'
import { RESEARCH_ENTRY_KEY_SET, RESEARCH_ENTRY_META } from '../../lib/research/catalog.js'
import { PUBLISHED_WORKS } from '../../lib/site/publishedWorks.js'

const root = fileURLToPath(new URL('../..', import.meta.url))
const viewSource = await readFile(new URL('../../app/(site)/topics/TopicHubView.jsx', import.meta.url), 'utf8')

const POSITIONING = {
  'ai-agents': '智能体实践总入口',
  'frontend-cloud': '前端与云工程总入口',
  books: '著作总入口',
  openclaw: 'OpenClaw 总入口',
  editorial: '内容说明总入口',
}

async function pageRoutes() {
  const routes = new Set()
  async function walk(dir, segments) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const next = entry.name.startsWith('(') && entry.name.endsWith(')') ? segments : [...segments, entry.name]
        await walk(full, next)
      } else if (/^page\.(jsx|js|mdx|tsx)$/.test(entry.name)) {
        routes.add(`/${segments.join('/')}`.replace(/\/$/, '') || '/')
      }
    }
  }
  await walk(path.join(root, 'app'), [])
  return routes
}

const routes = await pageRoutes()

test('topic hubs share one directory layout and keep the lead without standing', () => {
  assert.match(viewSource, /\{hub\.description\}/)
  assert.doesNotMatch(viewSource, /hub\.standing/)
  assert.match(viewSource, /text-2xl/)
  assert.match(viewSource, /md:text-3xl/)
  assert.match(viewSource, /py-6 md:py-8/)
  assert.doesNotMatch(viewSource, /py-8 md:py-10/)
  assert.match(viewSource, /主线目录/)
  assert.match(viewSource, /section\.items\.map/)
  assert.doesNotMatch(viewSource, /AgentReadingPath|CURATED READING PATH|EXPLORE FURTHER|clamp\(3rem/)
  for (const sentence of [
    'OpenClaw 改动已合并进主分支，书目在著作。',
    '这台站点跑在 Next.js 与 Cloudflare 上。',
    '已出版图书、电子小册和站内可读资源，目录在图书馆。',
    '贡献记录只收已经合并进 OpenClaw 主分支的改动。',
    '作者、选题、核对、更正和 AI 协助。',
  ]) {
    assert.equal(viewSource.includes(sentence), false, sentence)
  }
  assert.equal(TOPIC_HUB_LIST.length, 5)
})

test('each hub is the topic entry, with standing and existing links only', async () => {
  assert.deepEqual(TOPIC_HUB_LIST.map((hub) => hub.path), [
    '/topics/ai-agents',
    '/topics/frontend-cloud',
    '/topics/books',
    '/topics/openclaw',
    '/topics/editorial',
  ])

  for (const hub of TOPIC_HUB_LIST) {
    assert.equal(getTopicHub(hub.slug), hub)
    assert.match(hub.description, new RegExp(POSITIONING[hub.slug]))
    assert.equal(hub.standing.includes('不是'), false)
    assert.ok(hub.standing.length > 8)
    assert.ok(hub.leads.length >= 5, hub.slug)
    assert.equal(new Set(hub.leads.map((lead) => lead.href)).size, hub.leads.length, hub.slug)
    const groups = new Set(hub.leads.map((lead) => lead.group))
    assert.ok(groups.size >= 2, hub.slug)

    for (const lead of hub.leads) {
      assert.equal(lead.href.startsWith('/'), true, lead.href)
      assert.ok(TOPIC_HUB_GROUPS.some((group) => group.id === lead.group), lead.href)
      assert.equal(typeof lead.label, 'string')
      assert.ok(lead.label.length > 1, lead.href)
      assert.equal(typeof lead.note, 'string')
      assert.ok(lead.note.length >= 16, lead.href)
      assert.equal(typeof lead.section, 'string')
      assert.ok(lead.section.length > 0, lead.href)
      assert.equal(lead.href.includes('/diary') || lead.href.includes('year-summary'), false, lead.href)
      await assertLeadExists(lead)
    }
  }

  assert.ok(getTopicHub('openclaw').leads.some((lead) => lead.href === '/about#openclaw-contributions'))
  assert.ok(getTopicHub('books').leads.some((lead) => lead.href === '/books/llm-underlying-logic'))
  assert.ok(getTopicHub('editorial').leads.some((lead) => lead.href === '/editorial'))
  assert.ok(getTopicHub('frontend-cloud').leads.some((lead) => lead.href.includes('cloudflare-d1-free-tier-limit-enforcement')))
  assert.ok(getTopicHub('ai-agents').leads.filter((lead) => lead.group === 'essay').length > 4)
})

async function assertLeadExists(lead) {
  const pathname = lead.href.split(/[?#]/)[0]
  const research = /^\/articles\/research\/(companies|topics|people)\/([a-z0-9-]+)$/.exec(pathname)
  if (research) {
    const key = `${research[1]}/${research[2]}`
    assert.ok(RESEARCH_ENTRY_KEY_SET.has(key), lead.href)
    const meta = RESEARCH_ENTRY_META[key]
    assert.equal(lead.label, meta.title, lead.href)
    assert.equal(lead.note, meta.summary, lead.href)
    assert.equal(lead.date, meta.date, lead.href)
    return
  }

  const archive = /^\/articles\/([^/]+)$/.exec(pathname)
  if (archive && archive[1] !== 'published') {
    const article = JSON.parse(await readFile(path.join(root, 'public/data/article-archive', `${archive[1]}.json`), 'utf8'))
    assert.equal(lead.label, article.title, lead.href)
    assert.equal(lead.note, article.summary, lead.href)
    assert.equal(lead.date, article.date, lead.href)
    assert.ok(routes.has('/articles/[slug]'), lead.href)
    return
  }

  const subject = new URLSearchParams(lead.href.split('?')[1] || '').get('subject')
  if (subject) assert.ok(SUBJECT_KEYS.includes(subject), lead.href)
  assert.ok(routes.has(pathname), lead.href)

  if (lead.href.startsWith('/books/')) {
    const book = PUBLISHED_WORKS.find((item) => item.href === pathname)
    assert.ok(book, lead.href)
    assert.ok(lead.note.includes(book.description), lead.href)
  }

  if (lead.href.includes('#')) {
    const id = lead.href.split('#')[1]
    const candidates = {
      '/about': 'app/(site)/about/page.jsx',
      '/help': 'app/(site)/help/page.jsx',
    }
    const file = candidates[pathname]
    assert.ok(file, lead.href)
    const source = await readFile(path.join(root, file), 'utf8')
    assert.match(source, new RegExp(`id=["']${id}["']|id: '${id}'`))
  }
}

test('hash targets and directory filters stay on public pages', async () => {
  const about = await readFile(path.join(root, 'app/(site)/about/page.jsx'), 'utf8')
  const help = await readFile(path.join(root, 'app/(site)/help/page.jsx'), 'utf8')
  assert.match(about, /id="openclaw-contributions"/)
  assert.match(help, /id: 'editorial'/)
  assert.match(help, /id=\{item\.id\}/)
  await access(path.join(root, 'app/(web-llm)/web-llm/page.jsx'))
})
