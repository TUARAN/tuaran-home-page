import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { XMLParser, XMLValidator } from 'fast-xml-parser'

const root = new URL('../../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const fixture = [
  { slug: 'new-public', status: 'published', title: '公开 <&> "文章"', summary: '摘要 & 内容', publishedAt: 1788969600000, updatedAt: 1789056000000 },
  { slug: 'new-public', status: 'published', title: 'duplicate' },
  { slug: 'static-post', status: 'published', title: 'shadowed' },
  { slug: 'external-post', status: 'published' },
  { slug: 'research-alias', status: 'published' },
  { slug: 'secret-draft', status: 'draft', summary: 'DO NOT DISCLOSE' },
  { slug: '../share/private', status: 'published' },
  { slug: 'diary-self-reflection', status: 'published' },
]
const discoverySource = (await read('lib/articleDiscovery.js')).replace(/^import .*\n/gm, '')
const discoveryUrl = moduleUrl(`const articles = [{slug:'static-post'}, {slug:'external-post', href:'https://example.com'}];
const RESEARCH_ARTICLE_REDIRECTS = {'research-alias':'/articles/research/topics/example'};
const readContentCatalog = async () => ({articles, researchRedirects:RESEARCH_ARTICLE_REDIRECTS});
const listPublishedArticlePosts = async () => ${JSON.stringify(fixture)};
${discoverySource}`)
const discovery = await import(discoveryUrl)

test('published records only, canonical detail precedence, and duplicate slugs', async () => {
  const posts = await discovery.listDiscoverablePosts()
  assert.deepEqual(posts.map((post) => post.slug), ['new-public'])
  assert.deepEqual(discovery.selectDiscoverablePosts([], [], {}), [])
  assert.equal(discovery.postDiscoveryDate({ publishedAt: NaN }), null)
})

async function route(path, asset, postsModule = discoveryUrl) {
  const assetsUrl = moduleUrl(`export const readDiscoveryAsset = async () => ${JSON.stringify(asset)};
export const DISCOVERY_HEADERS = {'Cache-Control':'no-store'};`)
  const researchUrl = moduleUrl('export const researchDiscoverySnapshot = async () => []; export const applyResearchDiscovery = (xml) => xml;')
  const source = (await read(path))
    .replace(/'[^']*researchDiscovery'/, JSON.stringify(researchUrl))
    .replace(/'[^']*articleDiscovery'/, JSON.stringify(postsModule))
    .replace(/'[^']*discoveryAssets'/, JSON.stringify(assetsUrl))
  return (await import(moduleUrl(source))).GET(new Request('https://preview.example/'))
}

const publicRoutesExcluded = process.env.ADMIN_PAGES_BUILD === '1'
test('actual sitemap handler merges database sample without draft or shadow links', { skip: publicRoutesExcluded }, async () => {
  const response = await route('lib/discoverySitemap.js', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://2aran.com/articles/static-post</loc></url></urlset>')
  const xml = await response.text()
  assert.equal(XMLValidator.validate(xml), true)
  const entries = new XMLParser().parse(xml).urlset.url
  assert.deepEqual(entries.map((entry) => entry.loc), ['https://2aran.com/articles/static-post', 'https://2aran.com/articles/new-public'])
  assert.equal(entries[1].lastmod, new Date(fixture[0].updatedAt).toISOString())
  assert.doesNotMatch(xml, /secret|shadowed|private|research-alias/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('actual RSS handler preserves full text and GUID while adding escaped public summary', { skip: publicRoutesExcluded }, async () => {
  const response = await route('lib/discoveryRss.js', '<rss version="2.0"><channel><lastBuildDate>Tue, 01 Sep 2026 00:00:00 GMT</lastBuildDate><item><title>Static</title><link>https://2aran.com/articles/static-post</link><guid>versioned-guid</guid><description><![CDATA[<p>Full text</p>]]></description></item></channel></rss>')
  const xml = await response.text()
  assert.equal(XMLValidator.validate(xml), true)
  const items = new XMLParser().parse(xml).rss.channel.item
  assert.equal(items.length, 2)
  assert.equal(items[0].title, fixture[0].title)
  assert.equal(items[0].description, fixture[0].summary)
  assert.equal(items[1].guid, 'versioned-guid')
  assert.match(xml, /<!\[CDATA\[<p>Full text<\/p>\]\]>/)
  assert.doesNotMatch(xml, /secret|shadowed|private|research-alias/)
})

test('bad static artifact returns non-cacheable error instead of successful empty feed', { skip: publicRoutesExcluded }, async () => {
  for (const name of ['Sitemap', 'Rss']) {
    const response = await route(`lib/discovery${name}.js`, '<html>Not found</html>')
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store')
  }
})

test('directory has an unconditional server link and renders every published post', { skip: publicRoutesExcluded }, async () => {
  const [directory, published, db] = await Promise.all([
    read('app/(site)/articles/page.jsx'), read('lib/discoveryHtml.js'), read('lib/articlePosts.js'),
  ])
  assert.match(directory, /<a href="\/articles\/published"/)
  assert.match(published, /await listDiscoverablePosts\(\)/)
  assert.match(published, /posts\.map\(/)
  assert.doesNotMatch(published, /use client|useEffect|slice\(/)
  assert.match(db, /WHERE status = 'published'/)
})

test('Pages reads the current deployment static asset through ASSETS without cookies', async () => {
  const source = (await read('lib/discoveryAssets.js')).replace(/^import .*\n/gm, '')
  const url = moduleUrl(`let seen;
const getOptionalRequestContext = () => ({ env: { ASSETS: { fetch: async (request) => {
  seen = request;
  return new Response('<rss/>');
} } } });
export const getSeen = () => seen;
${source}`)
  const assets = await import(url)
  assert.equal(await assets.readDiscoveryAsset(new Request('https://preview.example/rss.xml', { headers: { Cookie: 'private=session' } }), '/rss-static.xml'), '<rss/>')
  assert.equal(assets.getSeen().url, 'https://preview.example/rss-static.xml')
  assert.equal(assets.getSeen().headers.get('cookie'), null)
})

test('metadata query reuses article accessor, restricts publication, and avoids full documents', async () => {
  const source = (await read('lib/articlePosts.js')).replace(/^import .*\n/gm, '')
  const url = moduleUrl(`let query;
const taxonomyForArticle = () => ({});
const getD1 = () => ({ prepare: (sql) => {
  query = sql;
  return { all: async () => ({ results: [{slug:'sample', status:'published', summary:'Public summary'}] }) };
} });
export const getQuery = () => query;
${source}`)
  const accessor = await import(url)
  const posts = await accessor.listPublishedArticlePosts({ metadataOnly: true })
  assert.equal(posts[0].slug, 'sample')
  assert.match(accessor.getQuery(), /WHERE status = 'published'/)
  assert.match(accessor.getQuery(), /substr\(content_text, 1, 160\)/)
  assert.doesNotMatch(accessor.getQuery(), /SELECT \*|content_json/)
  await accessor.listPublishedArticlePosts()
  assert.match(accessor.getQuery(), /SELECT \*/)
})


test('HTML archive emits links beyond the client page size without JavaScript', { skip: publicRoutesExcluded }, async () => {
  const posts = Array.from({ length: 40 }, (_, index) => ({ slug: `public-${index}`, title: `<Public ${index}>`, summary: 'A & B' }))
  const postsModule = moduleUrl(`export * from ${JSON.stringify(discoveryUrl)};
export const listDiscoverablePosts = async () => ${JSON.stringify(posts)};`)
  const response = await route('lib/discoveryHtml.js', '', postsModule)
  const html = await response.text()
  assert.match(response.headers.get('content-type'), /text\/html/)
  assert.equal((html.match(/<li>/g) || []).length, 40)
  assert.match(html, /href="https:\/\/2aran.com\/articles\/public-39"/)
  assert.match(html, /&lt;Public 0&gt;/)
  assert.doesNotMatch(html, /<script/)
})

test('stable public URLs share one Edge function and avoid ISR', { skip: publicRoutesExcluded }, async () => {
  const [config, dispatcher] = await Promise.all([read('next.config.js'), read('app/(site)/discovery/[format]/route.js')])
  for (const [source, destination] of [['/sitemap.xml', '/discovery/sitemap'], ['/rss.xml', '/discovery/rss'], ['/articles/published', '/discovery/articles']]) {
    assert.ok(config.includes(`source: '${source}', destination: '${destination}'`))
  }
  assert.match(dispatcher, /runtime = 'edge'/)
  assert.match(dispatcher, /dynamic = 'force-dynamic'/)
})
