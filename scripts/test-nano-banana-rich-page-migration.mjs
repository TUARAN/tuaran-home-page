import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('nano banana is registered only as a rich page', async () => {
  const [works, resources, registry] = await Promise.all([
    read('lib/engineeringWorks.js'),
    read('lib/homeResourceItems.js'),
    read('lib/contentRegistry.js'),
  ])

  assert.match(works, /id: 'nano-banana-gallery'[\s\S]*category: 'ai-engineering'[\s\S]*href: '\/nano-banana-gallery'/)
  assert.doesNotMatch(resources, /href: '\/resources\/nano-banana-gallery'/)
  assert.doesNotMatch(registry, /category: 'resource', slug: 'nano-banana-gallery'/)
  assert.match(registry, /category: 'rich-page', slug: 'nano-banana-gallery'[\s\S]*href: '\/nano-banana-gallery'/)
  assert.match(registry, /'rich-page': '多维页面'/)
  assert.match(registry, /new Set\(\['resource', 'feed', 'rich-page'\]\)/)
})

test('rich-page engagement keys resolve to the canonical route', async () => {
  const [pipeline, articleLinks, keyLite] = await Promise.all([
    read('lib/contentPipeline.js'),
    read('lib/articleLinks.js'),
    read('lib/contentKeyLite.js'),
  ])

  assert.match(pipeline, /'rich-page': '多维页面'/)
  assert.match(articleLinks, /CONTENT_PV_CATEGORIES\.has\(category\)/)
  assert.match(keyLite, /key\.startsWith\('rich-page:'\)/)
  assert.match(keyLite, /return slug \? `\/\$\{slug\}` : null/)
})

test('canonical page uses rich-page SEO analytics and engagement', async () => {
  const page = await read('app/(site)/nano-banana-gallery/page.jsx')
  assert.match(page, /createRichPageMetadata\('nano-banana-gallery'\)/)
  assert.match(page, /RichPageJsonLd pageId="nano-banana-gallery"/)
  assert.match(page, /ContentPvBeacon category="rich-page" slug=\{PAGE_SLUG\}/)
  assert.match(page, /ContentEngagement contentKey=\{`rich-page:\$\{PAGE_SLUG\}`\}/)
  assert.match(page, /href="\/rich-pages"/)
})

test('legacy resource URL is redirect-only', async () => {
  const legacy = await read('app/(site)/resources/nano-banana-gallery/page.jsx')
  assert.match(legacy, /permanentRedirect\('\/nano-banana-gallery'\)/)
  assert.doesNotMatch(legacy, /NanoBananaGallery cases=/)
})

test('SEO and sitemap expose only the canonical rich-page URL', async () => {
  const [seo, sitemap] = await Promise.all([
    read('lib/richPageSeo.js'),
    read('app/(site)/sitemap.js'),
  ])
  assert.match(seo, /'nano-banana-gallery': \{[\s\S]*schemaType: 'CollectionPage'/)
  assert.doesNotMatch(sitemap, /'\/resources\/nano-banana-gallery'/)
})
